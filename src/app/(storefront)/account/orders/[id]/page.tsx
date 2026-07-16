import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { connectDB, OrderModel, type Order } from "@/lib/db";
import { OrderDetail, type StorefrontOrder } from "@/components/storefront/orders/OrderDetail";

type Props = { params: Promise<{ id: string }> };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export default async function AccountOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const user = await getOptionalUser();
  if (!user) redirect(`/login?callbackUrl=/account/orders/${id}`);

  if (!OBJECT_ID.test(id)) notFound();

  await connectDB();

  let order: StorefrontOrder;
  try {
    const raw = await OrderModel.findOne({ _id: id, userId: user.id })
      .select("-__v -razorpaySignature")
      .lean();

    if (!raw) notFound();

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
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <OrderDetail order={order} />
    </div>
  );
}
