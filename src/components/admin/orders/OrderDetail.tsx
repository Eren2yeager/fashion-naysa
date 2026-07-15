"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { StatusTransitionSelect } from "./StatusTransitionSelect";
import { RefundDialog } from "./RefundDialog";
import { apiFetch } from "@/lib/admin/apiFetch";
import { toPaise, toRupees } from "@/lib/format/rupees";
import type { OrderStatus } from "@/lib/db";

// Thin admin view type derived from Order schema
export type AdminOrder = {
  _id: string;
  status: OrderStatus;
  items: {
    productId: string;
    sku: string;
    name: string;
    size: string;
    color: string;
    qty: number;
    unitPrice: number;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  refundedAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  awb?: string;
  trackingUrl?: string;
  shipmentStatus?: string;
  history: { at: string; status: string; note: string }[];
  createdAt: string;
};

// Pure function exported for property tests (task 10.4)
export function checkOrderTotalInvariant(order: Pick<AdminOrder, "subtotal" | "discount" | "shipping" | "total">): boolean {
  return order.subtotal - order.discount + order.shipping === order.total;
}

// Pure function exported for property tests (task 10.4)
export function maxRefundable(order: Pick<AdminOrder, "total" | "refundedAmount">): number {
  return Math.max(0, order.total - order.refundedAmount);
}

const REFUNDABLE_STATUSES: OrderStatus[] = ["paid", "fulfilled", "shipped", "delivered"];

interface OrderDetailProps {
  initialOrder: AdminOrder;
}

export function OrderDetail({ initialOrder }: OrderDetailProps) {
  const [order, setOrder] = React.useState(initialOrder);
  const [nextStatus, setNextStatus] = React.useState<OrderStatus | "">("");
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [awb, setAwb] = React.useState(order.awb ?? "");
  const [trackingUrl, setTrackingUrl] = React.useState(order.trackingUrl ?? "");
  const [savingTracking, setSavingTracking] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const [refundOpen, setRefundOpen] = React.useState(false);

  const totalValid = checkOrderTotalInvariant(order);
  const canRefund =
    REFUNDABLE_STATUSES.includes(order.status) &&
    order.refundedAmount < order.total;

  async function handleStatusUpdate() {
    if (!nextStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch<{ data: AdminOrder }>(
        `/api/admin/orders/${order._id}`,
        { method: "PATCH", body: JSON.stringify({ status: nextStatus }) },
      );
      // Atomic: only update state on success
      setOrder(res.data);
      setNextStatus("");
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveTracking() {
    setSavingTracking(true);
    try {
      const res = await apiFetch<{ data: AdminOrder }>(
        `/api/admin/orders/${order._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            awb: awb || undefined,
            trackingUrl: trackingUrl || undefined,
          }),
        },
      );
      setOrder(res.data);
      toast.success("Tracking info saved");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingTracking(false);
    }
  }

  async function handlePollTracking() {
    setPolling(true);
    try {
      const res = await apiFetch<{ data: { shipmentStatus?: string } }>(
        `/api/admin/orders/${order._id}/track`,
      );
      const newStatus = res.data?.shipmentStatus;
      if (newStatus && newStatus !== order.shipmentStatus) {
        setOrder((prev) => ({ ...prev, shipmentStatus: newStatus }));
        toast.success(`Shipment status: ${newStatus}`);
      } else {
        toast.info("No new tracking data");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPolling(false);
    }
  }

  function handleRefundSuccess(newRefundedAmount: number, newStatus: string) {
    setOrder((prev) => ({
      ...prev,
      refundedAmount: newRefundedAmount,
      status: newStatus as OrderStatus,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          Order <span className="font-mono text-lg">…{order._id.slice(-8)}</span>
        </h1>
        <StatusBadge status={order.status} />
        <span className="ml-auto text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Total invariant warning */}
      {!totalValid && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-medium text-yellow-700 dark:text-yellow-400">
          ⚠ Data integrity warning: subtotal − discount + shipping ≠ total. This order may have been corrupted.
        </div>
      )}

      {/* Line items */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Items</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Product", "SKU", "Size", "Color", "Qty", "Unit Price", "Line Total"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-2">{item.size}</td>
                  <td className="px-4 py-2">{item.color}</td>
                  <td className="px-4 py-2">{item.qty}</td>
                  <td className="px-4 py-2"><RupeeDisplay paise={item.unitPrice} /></td>
                  <td className="px-4 py-2"><RupeeDisplay paise={item.unitPrice * item.qty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Money summary */}
      <section className="flex justify-end">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right"><RupeeDisplay paise={order.subtotal} /></dd>
          <dt className="text-muted-foreground">Discount</dt>
          <dd className="text-right">− <RupeeDisplay paise={order.discount} /></dd>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right"><RupeeDisplay paise={order.shipping} /></dd>
          <dt className="font-semibold">Total</dt>
          <dd className="text-right font-semibold"><RupeeDisplay paise={order.total} /></dd>
          {order.refundedAmount > 0 && (
            <>
              <dt className="text-muted-foreground">Refunded</dt>
              <dd className="text-right text-destructive">− <RupeeDisplay paise={order.refundedAmount} /></dd>
            </>
          )}
        </dl>
      </section>

      {/* Shipping address + coupon */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Shipping Address</h2>
          <address className="not-italic text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
            <p>{order.shippingAddress.country}</p>
          </address>
        </div>
        {order.couponCode && (
          <div className="space-y-1 rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold">Coupon</h2>
            <p className="font-mono text-sm">{order.couponCode}</p>
          </div>
        )}
      </section>

      {/* Tracking */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">Tracking</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="awb">AWB</label>
            <input
              id="awb"
              type="text"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              placeholder="Airway bill number"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="trackingUrl">Tracking URL</label>
            <input
              id="trackingUrl"
              type="url"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.shipmentStatus && (
            <span className="text-sm text-muted-foreground">
              Shipment status: <span className="font-medium text-foreground">{order.shipmentStatus}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveTracking}
            disabled={savingTracking}
          >
            {savingTracking ? "Saving…" : "Save Tracking"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePollTracking}
            disabled={polling}
          >
            {polling ? "Polling…" : "Poll Tracking"}
          </Button>
        </div>
      </section>

      {/* Status transition */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">Update Status</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTransitionSelect
            current={order.status}
            value={nextStatus}
            onChange={setNextStatus}
            disabled={updatingStatus}
          />
          <Button
            size="sm"
            onClick={handleStatusUpdate}
            disabled={!nextStatus || updatingStatus}
          >
            {updatingStatus ? "Updating…" : "Apply"}
          </Button>
        </div>
      </section>

      {/* Refund */}
      {canRefund && (
        <section className="space-y-3 rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4">
          <h2 className="text-base font-semibold text-yellow-700 dark:text-yellow-400">
            ⚠ Refund — Money-sensitive
          </h2>
          <p className="text-sm text-muted-foreground">
            Max refundable: <span className="font-mono font-medium text-foreground">
              <RupeeDisplay paise={maxRefundable(order)} />
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>
            Initiate Refund
          </Button>
        </section>
      )}

      {/* History */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">History</h2>
        {order.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <ol className="space-y-2">
            {order.history.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <time className="w-36 shrink-0 text-muted-foreground">
                  {new Date(h.at).toLocaleString()}
                </time>
                <span>
                  <StatusBadge status={h.status} />
                </span>
                {h.note && <span className="text-muted-foreground">{h.note}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderId={order._id}
        total={order.total}
        refundedAmount={order.refundedAmount}
        onSuccess={handleRefundSuccess}
      />
    </div>
  );
}
