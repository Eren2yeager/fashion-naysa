"use client";

import * as React from "react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/shared/DataTable";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { apiFetch } from "@/lib/admin/apiFetch";
import type { AdminProduct } from "./ProductForm";

interface ProductTableProps {
  initialProducts: AdminProduct[];
}

export function ProductTable({ initialProducts }: ProductTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [products, setProducts] = React.useState(initialProducts);
  const [optimisticProducts, updateOptimistic] = useOptimistic(
    products,
    (prev, { id, isActive }: { id: string; isActive: boolean }) =>
      prev.map((p) => (p._id === id ? { ...p, isActive } : p)),
  );

  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Client-side filter
  const filtered = optimisticProducts.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      activeFilter === "all" ||
      (activeFilter === "active" && p.isActive) ||
      (activeFilter === "inactive" && !p.isActive);
    return matchSearch && matchActive;
  });

  function handleToggle(product: AdminProduct) {
    const next = !product.isActive;
    startTransition(async () => {
      updateOptimistic({ id: product._id, isActive: next });
      try {
        await apiFetch(`/api/admin/products/${product._id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: next }),
        });
        // Update real state after success
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, isActive: next } : p)),
        );
      } catch {
        toast.error("Failed to update status");
        // useOptimistic auto-reverts when transition settles
      }
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/products/${deleteTarget}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget));
      toast.success("Product deleted");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete product");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      key: "image",
      header: "Image",
      render: (p: AdminProduct) =>
        p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.images[0].url}
            alt={p.images[0].alt || p.name}
            className="h-10 w-10 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <PackageIcon className="size-4" />
          </div>
        ),
    },
    {
      key: "name",
      header: "Name",
      render: (p: AdminProduct) => (
        <span className="font-medium">{p.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (p: AdminProduct) => (
        <span className="text-muted-foreground text-xs">{p.slug}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (p: AdminProduct) => <RupeeDisplay paise={p.price} />,
    },
    {
      key: "compareAtPrice",
      header: "Compare",
      render: (p: AdminProduct) =>
        p.compareAtPrice != null ? <RupeeDisplay paise={p.compareAtPrice} /> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p: AdminProduct) => (
        <StatusBadge status={String(p.isActive)} variant="active" />
      ),
    },
    {
      key: "variants",
      header: "Variants",
      render: (p: AdminProduct) => (
        <span className="text-muted-foreground">{p.variants.length}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p: AdminProduct) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/products/${p._id}`)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(p)}
          >
            {p.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(p._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-9 w-60 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        emptyState={
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <PackageIcon className="size-8 opacity-40" />
            <span>No products found</span>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete product?"
        description="This action cannot be undone. The product will be permanently removed."
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
