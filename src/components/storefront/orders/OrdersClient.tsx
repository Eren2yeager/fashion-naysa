"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { StorefrontOrder } from "./OrderDetail";

const STATUS_LABELS: Record<string, string> = {
  created: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

interface OrdersClientProps {
  orders: StorefrontOrder[];
  loading?: boolean;
}

export function OrdersClient({ orders, loading }: OrdersClientProps) {
  const router = useRouter();

  if (loading) {
    return (
      <ul className="space-y-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="animate-pulse bg-muted rounded h-20 w-full" />
        ))}
      </ul>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
        <Link
          href="/shop"
          className="text-sm underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          Start shopping →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
        // Up to 4 thumbnails
        const thumbs = order.items.slice(0, 4);

        return (
          <li key={order._id}>
            <button
              type="button"
              onClick={() => router.push(`/account/orders/${order._id}`)}
              className="w-full text-left rounded border border-border hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-4 py-4 flex items-center gap-4"
            >
              {/* Image strip */}
              <div className="flex shrink-0 -space-x-3">
                {thumbs.map((item, i) => (
                  <div
                    key={i}
                    className="relative h-12 w-12 overflow-hidden rounded border-2 border-background bg-muted"
                    style={{ zIndex: thumbs.length - i }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="relative flex h-12 w-12 items-center justify-center rounded border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium text-foreground">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="rounded border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <time>{dateFormatter.format(new Date(order.createdAt))}</time>
                  <span>·</span>
                  <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                  <span>·</span>
                  <span className="text-foreground font-medium">{formatPrice(order.total)}</span>
                </div>
              </div>

              <span className="text-muted-foreground shrink-0" aria-hidden="true">→</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
