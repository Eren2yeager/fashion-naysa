"use client";

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
          <li key={i} className="animate-pulse bg-muted rounded h-16 w-full" />
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
    <ul className="divide-y divide-border border border-border rounded">
      {orders.map((order) => {
        const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
        return (
          <li key={order._id}>
            <button
              type="button"
              onClick={() => router.push(`/account/orders/${order._id}`)}
              className="w-full text-left px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-1 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-mono text-sm font-medium text-foreground">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {dateFormatter.format(new Date(order.createdAt))}
              </span>
              <span className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatPrice(order.total)}
              </span>
              <span className="ml-auto rounded border border-border px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
