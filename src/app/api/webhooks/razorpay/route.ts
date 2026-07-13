// Money path: verify HMAC first, then flip order state.
// On first transition to "paid" we decrement stock atomically and book
// a Shiprocket shipment. The shipment is fire-and-forget after stock
// is committed so a slow Shiprocket call cannot double-charge a customer.
import { withApi, ok } from "@/lib/errors/handler";
import { connectDB, OrderModel } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments";
import { tryRedeem, releaseRedemption } from "@/lib/coupons";
import { decrementStock, releaseStock } from "@/lib/orders";
import { createShipment, generateAwb } from "@/lib/shipping";
import { unauthorized } from "@/lib/errors/AppError";

export const runtime = "nodejs";

type RzpWebhookPayload = {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method?: string;
      };
    };
  };
};

async function bookShipment(orderId: string) {
  await connectDB();
  const order = await OrderModel.findById(orderId);
  if (!order || order.shiprocketOrderId) return;
  try {
    const created = await createShipment({
      orderId: order._id.toString(),
      orderDate: order.createdAt.toISOString(),
      paymentMethod: "Prepaid",
      shipping: {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        country: order.shippingAddress.country,
      },
      items: order.items.map((l: { name: string; sku: string; qty: number; unitPrice: number }) => ({
        name: l.name,
        sku: l.sku,
        units: l.qty,
        selling_price: l.unitPrice / 100,
      })),
      subTotal: order.subtotal / 100,
      weight: 0.5,
    });
    order.shiprocketOrderId = String(created.order_id);
    if (created.awb_data?.awb) {
      order.awb = created.awb_data.awb;
      order.status = "shipped";
      order.shipmentStatus = created.awb_data.courier_name;
      order.history.push({ status: "shipped", note: created.awb_data.awb });
    } else {
      const awb = await generateAwb(created.shipment_id);
      order.awb = awb.awb_code;
      order.trackingUrl = `https://www.shiprocket.in/shipment-tracking/${awb.awb_code}`;
      order.status = "shipped";
      order.shipmentStatus = awb.courier_name;
      order.history.push({ status: "shipped", note: awb.awb_code });
    }
    await order.save();
  } catch (err) {
    // ponytail: shipment booking is async-safe to retry; admin can replay.
    await OrderModel.updateOne(
      { _id: orderId },
      { $push: { history: { status: "fulfilled", note: `shipment error: ${(err as Error).message}` } } },
    );
  }
}

export const POST = withApi(async (req: Request) => {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) throw unauthorized("Missing signature");

  if (!verifyWebhookSignature(raw, signature)) {
    throw unauthorized("Invalid signature");
  }

  const data = JSON.parse(raw) as RzpWebhookPayload;
  if (data.event !== "payment.captured" && data.event !== "payment.failed") {
    return ok({ ignored: data.event });
  }

  await connectDB();
  const payment = data.payload.payment.entity;
  const order = await OrderModel.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return ok({ ignored: true });

  if (data.event === "payment.captured") {
    if (order.status === "paid") return ok({ dedup: true });
    const wasFirstPayment = order.status === "created";
    order.status = "paid";
    order.razorpayPaymentId = payment.id;
    order.history.push({ status: "paid", note: `rzp:${payment.id}` });

    if (order.couponCode) {
      const r = await tryRedeem({
        couponCode: order.couponCode,
        orderId: order._id.toString(),
        userId: order.userId,
        discount: order.discount,
      });
      if (!r.ok) {
        // coupon invalid or limit hit after pricing — roll back status, fail order.
        order.status = "failed";
        order.history.push({ status: "failed", note: `coupon: ${r.reason}` });
        await order.save();
        return ok({ ok: true, note: r.reason });
      }
    }
    await order.save();

    if (wasFirstPayment) {
      // stock first; only book shipment if all lines reserved.
      try {
        await decrementStock(order._id.toString());
      } catch (err) {
        // decrementStock already flipped order to "failed" + pushed history.
        // release coupon so it can be reused.
        if (order.couponCode) await releaseRedemption(order._id.toString());
        return ok({ ok: true, note: (err as Error).message });
      }
      order.status = "fulfilled";
      order.history.push({ status: "fulfilled" });
      await order.save();
      // fire-and-forget; failures recorded in history
      void bookShipment(order._id.toString());
    }
  } else {
    order.status = "failed";
    order.history.push({ status: "failed", note: `rzp:${payment.id}` });
    await order.save();
    if (order.couponCode) await releaseRedemption(order._id.toString());
    if (order.status === "fulfilled" || order.status === "shipped") {
      await releaseStock(order._id.toString());
    }
  }

  return ok({ ok: true });
});
