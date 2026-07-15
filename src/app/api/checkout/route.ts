import { withApi, ok } from "@/lib/errors/handler";
import { requireUser } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation/schemas";
import { priceOrder } from "@/lib/pricing";
import { createOrder as createRzpOrder } from "@/lib/payments";
import { payment } from "@/lib/errors/AppError";

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const body = createOrderSchema.parse(await req.json());

  await connectDB();
  const priced = await priceOrder(body.items, body.couponCode);

  // Money path: persist order first, then create Razorpay order linked to it.
  const order = await OrderModel.create({
    userId: user.id,
    status: "created",
    items: priced.lines,
    subtotal: priced.subtotal,
    discount: priced.discount,
    shipping: priced.shipping,
    total: priced.total,
    couponCode: priced.coupon?.code ?? null,
    shippingAddress: body.shippingAddress,
    history: [{ status: "created" }],
  });

  try {
    const rzp = await createRzpOrder({
      amount: priced.total,
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString(), userId: user.id },
    });
    order.razorpayOrderId = rzp.id;
    await order.save();
    return ok({ orderId: order._id, razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency });
  } catch (err) {
    order.status = "failed";
    order.history.push({ status: "failed", note: "rzp create failed" });
    await order.save();
    throw payment("Could not initiate payment", { err: (err as Error).message });
  }
});

// ponytail: GET /api/orders lives in app/api/orders/route.ts

