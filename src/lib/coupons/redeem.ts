// Coupon redemption helpers — race-safe via CouponRedemption unique index.
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

  // Enforce per-user limit if set.
  if (coupon.perUserLimit) {
    const count = await CouponRedemptionModel.countDocuments({
      couponCode: code,
      userId: args.userId,
    });
    if (count > coupon.perUserLimit) {
      // Undo our insert and reject.
      await CouponRedemptionModel.deleteOne({
        couponCode: code,
        orderId: args.orderId,
      });
      return { ok: false, reason: "Per-user limit reached" };
    }
  }

  return { ok: true };
}

export async function releaseRedemption(orderId: string) {
  await connectDB();
  await CouponRedemptionModel.deleteOne({ orderId });
}

export async function isRedeemed(orderId: string): Promise<boolean> {
  await connectDB();
  const r = await CouponRedemptionModel.findOne({ orderId }).lean();
  return Boolean(r);
}

export async function couponStats(code: string) {
  await connectDB();
  const [total, perUser] = await Promise.all([
    CouponRedemptionModel.countDocuments({ couponCode: code.toUpperCase() }),
    CouponRedemptionModel.aggregate<{ _id: string; count: number }>([
      { $match: { couponCode: code.toUpperCase() } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
  ]);
  return { total, byUser: perUser };
}
