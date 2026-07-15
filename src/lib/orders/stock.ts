// Atomic stock decrement for a paid order.
// Uses $inc on the matched variant; if any line lacks stock we roll back the
// lines already decremented, mark the order failed, and throw.
// Idempotency is tracked via Order.stockCommitted so webhook retries and the
// sweeper cannot double-decrement, and release cannot double-increment.
//
// "claim" is the single gate: findOneAndUpdate flips { status: "paid",
// stockCommitted: false } to { stockCommitted: true } atomically. If two
// webhook deliveries race, exactly one wins. The winner then performs the
// stock decrements AND becomes the sole caller of bookShipment (via the
// "fulfilled" branch in the webhook), preventing double shipment creation.
import { connectDB, OrderModel, ProductModel } from "@/lib/db";
import { conflict } from "@/lib/errors/AppError";

type OrderLine = { productId: unknown; sku: string; qty: number };

async function incrementLines(lines: OrderLine[]) {
  for (const line of lines) {
    await ProductModel.updateOne(
      { _id: line.productId, "variants.sku": line.sku },
      { $inc: { "variants.$.stock": line.qty } },
    );
  }
}

/**
 * Atomically claim the stock-decrement right for this order. Returns the
 * order doc if we won the race, or null if another caller already claimed.
 */
export async function claimStockDecrement(orderId: string) {
  await connectDB();
  return OrderModel.findOneAndUpdate(
    { _id: orderId, status: "paid", stockCommitted: false },
    { $set: { stockCommitted: true } },
    { returnDocument: 'after' },
  );
}

/** Release a prior claim (used on rollback when a line runs out of stock). */
export async function releaseClaim(orderId: string) {
  await connectDB();
  await OrderModel.updateOne(
    { _id: orderId, stockCommitted: true },
    { $set: { stockCommitted: false } },
  );
}

export async function decrementStock(orderId: string): Promise<void> {
  await connectDB();
  const order = await claimStockDecrement(orderId);
  if (!order) return; // lost race, already decremented, or order not paid

  const done: OrderLine[] = [];
  for (const line of order.items as unknown as OrderLine[]) {
    const res = await ProductModel.updateOne(
      { _id: line.productId, "variants.sku": line.sku, "variants.stock": { $gte: line.qty } },
      { $inc: { "variants.$.stock": -line.qty } },
    );
    if (res.modifiedCount === 0) {
      // Roll back lines already taken, release our claim, and fail the order.
      await incrementLines(done);
      await releaseClaim(orderId);
      order.status = "failed";
      order.history.push({ status: "failed", note: `insufficient stock: ${line.sku}` });
      await order.save();
      throw conflict(`Out of stock: ${line.sku}`);
    }
    done.push(line);
  }
  // stockCommitted already true (set by the claim); nothing more to save.
}

/**
 * Reverse a prior decrement. Used when an order is later cancelled, refunded,
 * or a payment that looked successful is later marked failed. Idempotent via
 * Order.stockCommitted — a no-op unless stock was actually committed.
 */
export async function releaseStock(orderId: string): Promise<void> {
  await connectDB();
  const order = await OrderModel.findById(orderId);
  if (!order) return;
  if (!order.stockCommitted) return;

  await incrementLines(order.items as unknown as OrderLine[]);
  order.stockCommitted = false;
  order.history.push({ status: order.status, note: "stock released" });
  await order.save();
}
