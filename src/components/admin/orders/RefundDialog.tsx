"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { toPaise, toRupees } from "@/lib/format/rupees";
import { apiFetch } from "@/lib/admin/apiFetch";
import { toast } from "sonner";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  total: number;
  refundedAmount: number;
  onSuccess: (newRefundedAmount: number, newStatus: string) => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  total,
  refundedAmount,
  onSuccess,
}: RefundDialogProps) {
  const maxRefundable = total - refundedAmount;
  const [amountStr, setAmountStr] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmountStr(String(toRupees(maxRefundable)));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReason("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("");
    }
  }, [open, maxRefundable]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const rupeeVal = parseFloat(amountStr);
    if (isNaN(rupeeVal) || rupeeVal <= 0) {
      setError("Enter a valid amount");
      return;
    }
    const paise = toPaise(rupeeVal);
    if (paise > maxRefundable) {
      setError(`Amount exceeds maximum refundable (${toRupees(maxRefundable).toFixed(2)})`);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { refundedAmount: number; status: string } }>(
        `/api/admin/orders/${orderId}/refund`,
        { method: "POST", body: JSON.stringify({ amount: paise, reason: reason || undefined }) },
      );
      toast.success("Refund initiated");
      onSuccess(res.data.refundedAmount, res.data.status);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Refund</DialogTitle>
          <DialogDescription>
            This action will trigger a refund via Razorpay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <p className="font-medium text-yellow-700 dark:text-yellow-400">⚠ Money-sensitive operation</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Order total</span>
            <span className="font-mono tabular-nums"><RupeeDisplay paise={total} /></span>
            <span className="text-muted-foreground">Already refunded</span>
            <span className="font-mono tabular-nums"><RupeeDisplay paise={refundedAmount} /></span>
            <span className="text-muted-foreground">Max refundable</span>
            <span className="font-mono tabular-nums font-medium"><RupeeDisplay paise={maxRefundable} /></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="refund-amount">
              Amount (₹)
            </label>
            <input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={toRupees(maxRefundable)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={amountStr}
              onChange={(e) => { setAmountStr(e.target.value); setError(""); }}
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="refund-reason">
              Reason (optional)
            </label>
            <input
              id="refund-reason"
              type="text"
              maxLength={200}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer request"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || maxRefundable <= 0}>
              {loading ? "Processing…" : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
