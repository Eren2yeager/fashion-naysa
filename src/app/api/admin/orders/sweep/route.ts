// Sweeper for orders stuck in "paid" without stock decrement.
// Razorpay's payment.failed webhook is best-effort. If we crash mid-pipeline
// after stock decrement, the order can sit in "paid" indefinitely.
// We re-derive the correct state from the world: if paid for >15min and
// stock has already been decremented (status==fulfilled|shipped|delivered),
// leave alone; if status==paid and stock NOT decremented, claim + decrement.
//
// In production: invoke from a Vercel Cron or external scheduler every 5 min.
import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { decrementStock, claimStockDecrement } from "@/lib/orders";

export const runtime = "nodejs";

const STUCK_AFTER_MS = 15 * 60 * 1000;

export const POST = withApi(async () => {
  await requireAdmin();
  await connectDB();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
  const stuck = await OrderModel.find({
    status: "paid",
    updatedAt: { $lt: cutoff },
  }).select("_id");

  let recovered = 0;
  for (const o of stuck) {
    // Atomic claim: if a webhook delivery is racing us, exactly one wins.
    const claim = await claimStockDecrement(o._id.toString());
    if (!claim) continue;
    try {
      await decrementStock(o._id.toString());
      await OrderModel.updateOne(
        { _id: o._id, status: "paid" },
        { $set: { status: "fulfilled" }, $push: { history: { status: "fulfilled", note: "sweeper" } } },
      );
      recovered++;
    } catch {
      // already decremented or stock issue; skip
    }
  }
  return ok({ recovered, total: stuck.length });
});
