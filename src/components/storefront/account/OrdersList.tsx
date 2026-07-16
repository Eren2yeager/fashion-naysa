import Link from "next/link";
import { connectDB, OrderModel, ProductModel, type Order } from "@/lib/db";
import { OrdersClient } from "@/components/storefront/orders/OrdersClient";
import type { StorefrontOrder } from "@/components/storefront/orders/OrderDetail";
import type { SessionUser } from "@/lib/auth";

interface Props {
  user: SessionUser;
}

export async function OrdersList({ user }: Props) {
  await connectDB();

  let orders: StorefrontOrder[] = [];
  try {
    const raw = await OrderModel.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .select("-__v -razorpaySignature")
      .lean();

    // Batch-fetch first image per product across all orders
    const allProductIds = raw.flatMap((o) =>
      o.items.map((i: Order["items"][number]) => i.productId),
    );
    const products = await ProductModel.find({ _id: { $in: allProductIds } })
      .select("images")
      .lean();
    const imageMap = new Map(
      products.map((p) => [String(p._id), (p.images?.[0]?.url) ?? null]),
    );

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
        image: imageMap.get(String(i.productId)) ?? undefined,
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
      <div className="py-16 text-center space-y-4">
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
    <>
      {orders.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      )}
      <OrdersClient orders={orders} />
    </>
  );
}
