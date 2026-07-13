// Atomic stock decrement for a paid order.
// Uses $inc on the matched variant; if stock goes negative we abort and mark order failed.
import { connectDB, OrderModel, ProductModel } from "@/lib/db";
import { conflict } from "@/lib/errors/AppError";

export type StockCheck = {
  /** set true to actually decrement; false to dry-run (pricing flow) */
  commit: boolean;
};

export async function decrementStock(orderId: string): Promise<void> {
  await connectDB();
  const order = await OrderModel.findById(orderId);
  if (!order) return;
  if (order.status !== "paid") return; // webhook flips status to paid first

  for (const line of order.items) {
    const res = await ProductModel.updateOne(
      { _id: line.productId, "variants.sku": line.sku, "variants.stock": { $gte: line.qty } },
      { $inc: { "variants.$.stock": -line.qty } },
    );
    if (res.modifiedCount === 0) {
      order.status = "failed";
      order.history.push({ status: "failed", note: `insufficient stock: ${line.sku}` });
      await order.save();
      throw conflict(`Out of stock: ${line.sku}`);
    }
  }
}

/**
 * Reverse a prior decrement. Used when an order is later cancelled or
 * a payment that looked successful is later marked failed. Idempotent
 * — re-running on an order with already-released stock is a no-op.
 */
export async function releaseStock(orderId: string): Promise<void> {
  await connectDB();
  const order = await OrderModel.findById(orderId);
  if (!order) return;
  if (order.status === "cancelled" || order.status === "refunded") return;

  for (const line of order.items) {
    await ProductModel.updateOne(
      { _id: line.productId, "variants.sku": line.sku },
      { $inc: { "variants.$.stock": line.qty } },
    );
  }
  order.history.push({ status: order.status, note: "stock released" });
  await order.save();
}
