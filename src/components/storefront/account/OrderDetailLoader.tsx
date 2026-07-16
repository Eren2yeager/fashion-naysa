import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB, OrderModel, ProductModel, type Order } from "@/lib/db";
import { OrderDetail } from "@/components/storefront/orders/OrderDetail";
import type { StorefrontOrder } from "@/components/storefront/orders/OrderDetail";
import type { SessionUser } from "@/lib/auth";

interface Props {
  id: string;
  user: SessionUser;
}

export async function OrderDetailLoader({ id, user }: Props) {
  await connectDB();

  let order: StorefrontOrder;
  try {
    const raw = await OrderModel.findOne({ _id: id, userId: user.id })
      .select("-__v -razorpaySignature")
      .lean();

    if (!raw) notFound();

    // Batch-fetch product images for all line items
    const productIds = raw.items.map((i: Order["items"][number]) => i.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } })
      .select("images")
      .lean();
    const imageMap = new Map(
      products.map((p) => [String(p._id), (p.images?.[0]?.url) ?? null]),
    );

    order = {
      _id: String(raw._id),
      status: raw.status,
      items: raw.items.map((i: Order["items"][number]) => ({
        productId: String(i.productId),
        sku: i.sku,
        name: i.name,
        size: i.size,
        color: i.color,
        qty: i.qty,
        unitPrice: i.unitPrice,
        image: imageMap.get(String(i.productId)) ?? undefined,
      })),
      subtotal: raw.subtotal,
      discount: raw.discount ?? 0,
      shipping: raw.shipping ?? 0,
      total: raw.total,
      couponCode: raw.couponCode ?? null,
      shippingAddress: {
        fullName: raw.shippingAddress.fullName,
        phone: raw.shippingAddress.phone,
        line1: raw.shippingAddress.line1,
        line2: raw.shippingAddress.line2 ?? undefined,
        city: raw.shippingAddress.city,
        state: raw.shippingAddress.state,
        pincode: raw.shippingAddress.pincode,
        country: raw.shippingAddress.country,
      },
      awb: raw.awb ?? undefined,
      trackingUrl: raw.trackingUrl ?? undefined,
      createdAt: (raw.createdAt as Date).toISOString(),
    };
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_NOT_FOUND")) throw err;

    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this order right now. Please try again.
        </p>
        <Link
          href="/account/orders"
          className="text-sm underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  return <OrderDetail order={order} />;
}
