// Refund flow — money path.
// Calls Razorpay, cancels the Shiprocket shipment, releases stock + coupon,
// and flips the order to "refunded" once Razorpay returns 2xx.
// Idempotent: re-running on an already-refunded order is a no-op.
import { getRazorpay } from "./razorpay";
import { connectDB, OrderModel } from "@/lib/db";
import { releaseRedemption } from "@/lib/coupons";
import { releaseStock } from "@/lib/orders";
import { cancelShipment } from "@/lib/shipping";
import { badRequest, conflict, notFound, upstream } from "@/lib/errors/AppError";

export type RefundInput = {
  orderId: string;
  /** paise; if omitted, full refund */
  amount?: number;
  reason?: string;
};

export async function refundOrder(input: RefundInput) {
  await connectDB();
  const order = await OrderModel.findById(input.orderId);
  if (!order) throw notFound("Order not found");
  if (!order.razorpayPaymentId) throw badRequest("No payment on this order");
  if (order.status === "refunded") return { id: order._id, status: order.status, dedup: true };
  if (!["paid", "fulfilled", "shipped", "delivered"].includes(order.status)) {
    throw conflict(`Cannot refund from status: ${order.status}`);
  }
  if (input.amount && (!Number.isInteger(input.amount) || input.amount <= 0)) {
    throw badRequest("Invalid refund amount");
  }
  if (input.amount && input.amount > order.total) {
    throw badRequest("Refund exceeds order total");
  }

  const rzp = getRazorpay();
  try {
    await rzp.payments.refund(order.razorpayPaymentId, {
      amount: input.amount,
      speed: "optimum",
      notes: input.reason ? { reason: input.reason } : undefined,
    } as Parameters<typeof rzp.payments.refund>[1]);
  } catch (err) {
    throw upstream("Razorpay refund failed", { err: (err as Error).message });
  }

  // Best-effort: cancel Shiprocket if already booked.
  if (order.shiprocketOrderId) {
    try {
      await cancelShipment([Number(order.shiprocketOrderId)]);
    } catch {
      // ponytail: shipment cancel failure is non-fatal for refund; admin reconciles.
    }
  }

  // Release domain side-effects: stock + coupon.
  await releaseStock(order._id.toString());
  if (order.couponCode) await releaseRedemption(order._id.toString());

  order.status = "refunded";
  order.history.push({ status: "refunded", note: input.reason ?? "admin refund" });
  await order.save();

  return { id: order._id, status: order.status };
}
