import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/lib/db";

// Plain serialised order type — no Mongoose methods, safe for both RSC and CC props
export type StorefrontOrder = {
  _id: string;
  status: OrderStatus;
  items: {
    productId: string;
    sku: string;
    name: string;
    size: string;
    color: string;
    qty: number;
    unitPrice: number; // paise
    image?: string; // first product image URL, populated at query time
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  awb?: string;
  trackingUrl?: string;
  createdAt: string;
};

const SUCCESS_STATUSES: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

interface OrderDetailProps {
  order: StorefrontOrder;
}

export function OrderDetail({ order }: OrderDetailProps) {
  const isSuccess = SUCCESS_STATUSES.includes(order.status);
  const isPending = order.status === "created";
  const hasTracking =
    (order.status === "shipped" || order.status === "delivered") && order.awb;

  return (
    <div className="space-y-8">
      {/* Status banner */}
      {isSuccess && (
        <div
          role="status"
          className="rounded border border-border bg-muted/40 px-5 py-4 text-sm text-foreground"
        >
          <p className="font-semibold">Your order is confirmed!</p>
          <p className="mt-1 text-muted-foreground">
            We&apos;ve received your order and will keep you updated by email.
          </p>
        </div>
      )}
      {isPending && (
        <div
          role="status"
          className="rounded border border-border bg-muted/40 px-5 py-4 text-sm text-foreground"
        >
          <p className="font-semibold">Payment pending</p>
          <p className="mt-1 text-muted-foreground">
            We&apos;ll update you by email once your payment is confirmed.
          </p>
        </div>
      )}

      {/* Order header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-foreground">
          Order{" "}
          <span className="font-mono">#{order._id.slice(-8).toUpperCase()}</span>
        </h1>
        <span className="rounded border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
        <time className="ml-auto text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(order.createdAt))}
        </time>
      </div>

      {/* Line items */}
      <section aria-label="Order items" className="space-y-2">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Items
        </h2>
        <ul className="divide-y divide-border border border-border rounded">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-4">
              {/* Product thumbnail */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted border border-border">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground tracking-widest uppercase">
                    No img
                  </div>
                )}
                {item.qty > 1 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                    {item.qty}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.size} · {item.color}
                </p>
              </div>

              {/* Price */}
              <span className="shrink-0 text-sm font-medium text-foreground">
                {formatPrice(item.unitPrice * item.qty)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Money summary */}
      <section aria-label="Order totals" className="flex justify-end">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm min-w-[240px]">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right text-foreground">{formatPrice(order.subtotal)}</dd>

          {order.discount > 0 && (
            <>
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="text-right text-foreground">−{formatPrice(order.discount)}</dd>
            </>
          )}

          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right text-foreground">{formatPrice(order.shipping)}</dd>

          <dt className="border-t border-border pt-2 font-semibold text-foreground">Total</dt>
          <dd className="border-t border-border pt-2 text-right font-semibold text-foreground">
            {formatPrice(order.total)}
          </dd>
        </dl>
      </section>

      {/* Shipping address */}
      <section aria-label="Shipping address" className="space-y-2">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Shipping Address
        </h2>
        <address className="not-italic rounded border border-border px-4 py-3 text-sm text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p>
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          </p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </address>
      </section>

      {/* AWB / tracking — only when shipped or delivered and awb present */}
      {hasTracking && (
        <section aria-label="Tracking" className="space-y-2">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Tracking
          </h2>
          <div className="rounded border border-border px-4 py-3 text-sm space-y-1">
            <p className="text-muted-foreground">
              AWB:{" "}
              <span className="font-mono font-medium text-foreground">{order.awb}</span>
            </p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
              >
                Track your shipment →
              </a>
            )}
          </div>
        </section>
      )}

      {/* Navigation links */}
      <div className="flex flex-wrap gap-4 pt-2 text-sm">
        <Link
          href="/account/orders"
          className="underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          View My Orders
        </Link>
        <Link
          href="/shop"
          className="underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
