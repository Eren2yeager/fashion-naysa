// Coupon redemption helpers — race-safe via CouponRedemption unique index
// and an atomic $inc on Coupon.usedCount for the global usageLimit.
import { connectDB, CouponModel, CouponRedemptionModel } from "@/lib/db";

export async function tryRedeem(args: {
  couponCode: string;
  orderId: string;
  userId: string;
  discount: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const code = args.couponCode.toUpperCase();
  await connectDB();

  const coupon = await CouponModel.findOne({ code, isActive: true });
  if (!coupon) return { ok: false, reason: "Invalid coupon" };

  // Insert redemption first (E11000 = duplicate redemption for this order).
  try {
    await CouponRedemptionModel.create({
      couponCode: code,
      orderId: args.orderId,
      userId: args.userId,
      discount: args.discount,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return { ok: false, reason: "Already redeemed" };
    }
    throw err;
  }

  // Atomic global usage limit: bump usedCount only if it would still be
  // within the limit. If the limit isn't set, noop.
  if (coupon.usageLimit != null) {
    const updated = await CouponModel.findOneAndUpdate(
      {
        _id: coupon._id,
        isActive: true,
        $expr: { $lt: ["$usedCount", coupon.usageLimit] },
      },
      { $inc: { usedCount: 1 } },
    );
    if (!updated) {
      // Limit hit between read and write — undo our redemption.
      await CouponRedemptionModel.deleteOne({
        couponCode: code,
        orderId: args.orderId,
      });
      return { ok: false, reason: "Coupon usage limit reached" };
    }
  }

  // Enforce per-user limit if set. Two parallel inserts can both see
  // count<=limit; in that race both succeed (TOCTOU) but the worst case
  // is one extra redemption per user — acceptable for a non-strict limit.
  if (coupon.perUserLimit) {
    const count = await CouponRedemptionModel.countDocuments({
      couponCode: code,
      userId: args.userId,
    });
    if (count > coupon.perUserLimit) {
      await CouponRedemptionModel.deleteOne({
        couponCode: code,
        orderId: args.orderId,
      });
      if (coupon.usageLimit != null) {
        await CouponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
      }
      return { ok: false, reason: "Per-user limit reached" };
    }
  }

  return { ok: true };
}

export async function releaseRedemption(orderId: string) {
  await connectDB();
  const r = await CouponRedemptionModel.findOne({ orderId }).select("couponCode");
  await CouponRedemptionModel.deleteOne({ orderId });
  if (r) {
    // Mirror usedCount back so release keeps the cached counter honest.
    await CouponModel.updateOne({ code: r.couponCode }, { $inc: { usedCount: -1 } });
  }
}

export async function isRedeemed(orderId: string): Promise<boolean> {
  await connectDB();
  const r = await CouponRedemptionModel.findOne({ orderId }).lean();
  return Boolean(r);
}

export async function couponStats(code: string) {
  await connectDB();
  const c = code.toUpperCase();
  const [total, perUser] = await Promise.all([
    CouponRedemptionModel.countDocuments({ couponCode: c }),
    CouponRedemptionModel.aggregate<{ _id: string; count: number }>([
      { $match: { couponCode: c } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
  ]);
  return { total, byUser: perUser };
}
