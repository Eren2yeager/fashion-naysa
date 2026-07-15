"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/shared/DataTable";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { apiFetch } from "@/lib/admin/apiFetch";
import type { AdminOrder } from "./OrderDetail";
import { ORDER_STATUS } from "@/lib/constants/orderStatus";

const PAGE_SIZES = [10, 30, 50] as const;

interface OrderTableProps {
  initialOrders: AdminOrder[];
  initialTotal: number;
}

export function OrderTable({ initialOrders, initialTotal }: OrderTableProps) {
  const router = useRouter();
  const [orders, setOrders] = React.useState(initialOrders);
  const [total, setTotal] = React.useState(initialTotal);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState<10 | 30 | 50>(30);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(false);
  const [sweeperOpen, setSweeperOpen] = React.useState(false);
  const [sweeping, setSweeping] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function fetchOrders(nextPage: number, nextLimit: number, nextStatus: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });
      if (nextStatus !== "all") params.set("status", nextStatus);
      const res = await apiFetch<{ data: { items: AdminOrder[]; total: number } }>(
        `/api/admin/orders?${params}`,
      );
      setOrders(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(next: number) {
    setPage(next);
    fetchOrders(next, limit, statusFilter);
  }

  function handleLimitChange(next: 10 | 30 | 50) {
    setLimit(next);
    setPage(1);
    fetchOrders(1, next, statusFilter);
  }

  function handleStatusChange(next: string) {
    setStatusFilter(next);
    setPage(1);
    fetchOrders(1, limit, next);
  }

  async function handleSweeper() {
    setSweeping(true);
    setSweeperOpen(false);
    try {
      const res = await apiFetch<{ data: { affected: number } }>(
        "/api/admin/orders/sweep",
        { method: "POST" },
      );
      toast.success(`Sweeper ran — ${res.data.affected} order(s) affected`);
      await fetchOrders(page, limit, statusFilter);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSweeping(false);
    }
  }

  const columns = [
    {
      key: "id",
      header: "Order ID",
      render: (o: AdminOrder) => (
        <span className="font-mono text-xs text-muted-foreground">…{o._id.slice(-8)}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o: AdminOrder) => (
        <span className="font-medium">{o.shippingAddress.fullName}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (o: AdminOrder) => <RupeeDisplay paise={o.total} />,
    },
    {
      key: "status",
      header: "Status",
      render: (o: AdminOrder) => <StatusBadge status={o.status} />,
    },
    {
      key: "items",
      header: "Items",
      render: (o: AdminOrder) => (
        <span className="text-muted-foreground">{o.items.length}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (o: AdminOrder) => (
        <span className="text-sm text-muted-foreground">
          {new Date(o.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      render: (o: AdminOrder) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/orders/${o._id}`);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={loading}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Page size */}
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          value={limit}
          onChange={(e) => handleLimitChange(Number(e.target.value) as 10 | 30 | 50)}
          disabled={loading}
          aria-label="Page size"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        {loading && (
          <span className="text-sm text-muted-foreground">Loading…</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSweeperOpen(true)}
            disabled={sweeping || loading}
          >
            {sweeping ? "Running…" : "Run Sweeper"}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        emptyState={
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ShoppingBagIcon className="size-8 opacity-40" />
            <span>No orders found</span>
          </div>
        }
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} total</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Prev
          </Button>
          <span className="px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={sweeperOpen}
        onOpenChange={setSweeperOpen}
        title="Run Order Sweeper?"
        description="This will resolve stuck 'paid' orders that haven't been fulfilled. The operation cannot be undone."
        onConfirm={handleSweeper}
        loading={sweeping}
      />
    </div>
  );
}
