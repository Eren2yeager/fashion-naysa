import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel, ProductModel } from "@/lib/db";
import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { OrderStatusGrid } from "@/components/admin/dashboard/OrderStatusGrid";
import { RupeeDisplay } from "@/components/admin/shared/RupeeDisplay";
import { computeRevenue, computeStatusCounts, REVENUE_STATUSES } from "@/lib/admin/metrics";
import type { OrderStatus } from "@/lib/db/models/Order";

// ─── Skeleton (Suspense fallback) ────────────────────────────────────────────

function MetricSkeleton() {
  return <MetricCard title="" loading />;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <MetricCard key={i} title="" loading />
      ))}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connectDB();

  // Fetch orders (for revenue + status counts) and active product count in parallel.
  // allSettled: one failure doesn't block the other metrics (Req 2.7).
  const [ordersResult, productsResult] = await Promise.allSettled([
    OrderModel.find()
      .select("total status")
      .lean<Array<{ total: number; status: string }>>(),
    ProductModel.countDocuments({ isActive: true }),
  ]);

  const orders =
    ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const ordersError =
    ordersResult.status === "rejected"
      ? "Could not load order data."
      : undefined;

  const activeCount =
    productsResult.status === "fulfilled" ? productsResult.value : null;
  const productsError =
    productsResult.status === "rejected"
      ? "Could not load product data."
      : undefined;

  // Derive metrics from orders (or null if the query failed).
  const revenue = orders !== null ? computeRevenue(orders) : null;
  const statusCounts = orders !== null ? computeStatusCounts(orders) : null;

  // Revenue placeholder when no qualifying orders exist (Req 2.4).
  const hasRevenue =
    revenue !== null &&
    orders!.some((o) => REVENUE_STATUSES.includes(o.status as OrderStatus));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Revenue + active products — two side-by-side metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<MetricSkeleton />}>
          <MetricCard
            title="Total Revenue"
            value={
              ordersError ? undefined : hasRevenue ? (
                <RupeeDisplay paise={revenue!} />
              ) : (
                <span className="text-base text-muted-foreground">
                  No sales data available
                </span>
              )
            }
            error={ordersError}
          />
        </Suspense>

        <Suspense fallback={<MetricSkeleton />}>
          <MetricCard
            title="Active Products"
            value={activeCount ?? undefined}
            error={productsError}
          />
        </Suspense>
      </section>

      {/* Order status breakdown grid */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Orders by status
        </h2>
        <Suspense fallback={<GridSkeleton />}>
          {ordersError ? (
            <p className="text-sm text-destructive">{ordersError}</p>
          ) : (
            <OrderStatusGrid counts={statusCounts!} />
          )}
        </Suspense>
      </section>
    </div>
  );
}
