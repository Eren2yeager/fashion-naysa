"use client";

import * as React from "react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/shared/DataTable";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { apiFetch } from "@/lib/admin/apiFetch";

export type AdminCoupon = {
  _id: string;
  code: string;
  kind: "percent" | "flat";
  amount: number;
  minSubtotal: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  stacksWith: string[];
  createdAt: string;
};

interface CouponTableProps {
  initialCoupons: AdminCoupon[];
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CouponTable({ initialCoupons }: CouponTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [coupons, setCoupons] = React.useState(initialCoupons);
  const [optimisticCoupons, updateOptimistic] = useOptimistic(
    coupons,
    (prev, { id, isActive }: { id: string; isActive: boolean }) =>
      prev.map((c) => (c._id === id ? { ...c, isActive } : c)),
  );

  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all");

  const filtered = optimisticCoupons.filter((c) => {
    if (activeFilter === "active") return c.isActive;
    if (activeFilter === "inactive") return !c.isActive;
    return true;
  });

  function handleToggle(coupon: AdminCoupon) {
    const next = !coupon.isActive;
    startTransition(async () => {
      updateOptimistic({ id: coupon._id, isActive: next });
      try {
        await apiFetch(`/api/admin/coupons/${coupon._id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: next }),
        });
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: next } : c)),
        );
      } catch {
        toast.error("Failed to update coupon status");
        // useOptimistic auto-reverts when transition settles
      }
    });
  }

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (c: AdminCoupon) => (
        <span className="font-mono font-bold tracking-wide">{c.code}</span>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (c: AdminCoupon) => (
        <span className="capitalize text-muted-foreground text-xs">{c.kind}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (c: AdminCoupon) =>
        c.kind === "flat" ? (
          <RupeeDisplay paise={c.amount} />
        ) : (
          <span className="font-mono tabular-nums">{c.amount}%</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: AdminCoupon) => (
        <StatusBadge status={String(c.isActive)} variant="active" />
      ),
    },
    {
      key: "used",
      header: "Used",
      render: (c: AdminCoupon) => (
        <span className="tabular-nums text-muted-foreground">
          {c.usedCount} / {c.usageLimit ?? "∞"}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      render: (c: AdminCoupon) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {fmtDate(c.startsAt)} – {fmtDate(c.endsAt)}
        </span>
      ),
    },
    {
      key: "perUserLimit",
      header: "Per-User Limit",
      render: (c: AdminCoupon) => (
        <span className="tabular-nums text-muted-foreground">
          {c.perUserLimit ?? "∞"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c: AdminCoupon) => (
        <Button variant="ghost" size="sm" onClick={() => handleToggle(c)}>
          {c.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <Button
              key={f}
              variant={activeFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => router.push("/admin/coupons/new")}>
          New Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        emptyState={
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <TicketIcon className="size-8 opacity-40" />
            <span>No coupons found</span>
          </div>
        }
      />
    </div>
  );
}
