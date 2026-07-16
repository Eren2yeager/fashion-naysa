import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { connectDB, OrderModel, type Order } from "@/lib/db";
import { OrdersClient } from "@/components/storefront/orders/OrdersClient";
import type { StorefrontOrder } from "@/components/storefront/orders/OrderDetail";

export default async function AccountOrdersPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/account/orders");

  await connectDB();

  let orders: StorefrontOrder[] = [];
  try {
    const raw = await OrderModel.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .select("-__v -razorpaySignature")
      .lean();

    orders = raw.map((o) => ({
      _id: String(o._id),
      status: o.status,
      items: o.items.map((i: Order["items"][number]) => ({
        productId: String(i.productId),
        sku: i.sku,
        name: i.name,
        size: i.size,
        color: i.color,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      subtotal: o.subtotal,
      discount: o.discount ?? 0,
      shipping: o.shipping ?? 0,
      total: o.total,
      couponCode: o.couponCode ?? null,
      shippingAddress: {
        fullName: o.shippingAddress.fullName,
        phone: o.shippingAddress.phone,
        line1: o.shippingAddress.line1,
        line2: o.shippingAddress.line2 ?? undefined,
        city: o.shippingAddress.city,
        state: o.shippingAddress.state,
        pincode: o.shippingAddress.pincode,
        country: o.shippingAddress.country,
      },
      awb: o.awb ?? undefined,
      trackingUrl: o.trackingUrl ?? undefined,
      createdAt: (o.createdAt as Date).toISOString(),
    }));
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your orders right now. Please try again.
        </p>
        <Link
          href="/shop"
          className="text-sm underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-sm font-semibold tracking-widest uppercase text-foreground">
        My Orders
      </h1>
      <OrdersClient orders={orders} />
    </div>
  );
}
