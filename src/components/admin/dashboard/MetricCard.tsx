"use client";

import { NumberTicker } from "@/components/ui/number-ticker";

// ─── Types ───────────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string;
  value?: React.ReactNode;
  error?: string;
  loading?: boolean;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({ title, value, error, loading }: MetricCardProps) {
  if (loading) return <Skeleton />;

  const isPlainNumber =
    typeof value === "number" && Number.isFinite(value) && value >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{title}</p>

      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-1 text-3xl font-semibold">
          {isPlainNumber ? (
            <NumberTicker value={value as number} className="text-3xl font-semibold" />
          ) : (
            value
          )}
        </p>
      )}
    </div>
  );
}
