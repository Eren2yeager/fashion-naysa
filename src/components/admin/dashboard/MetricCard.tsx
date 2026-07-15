"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string;
  value?: React.ReactNode;   // rendered when loaded
  error?: string;            // rendered when errored
  loading?: boolean;         // renders skeleton
};

// ─── Counter animation hook ──────────────────────────────────────────────────
// Only animates when value is a plain non-negative integer (e.g. counts).
// RupeeDisplay / strings pass through unchanged.

function useCountUp(target: number, active: boolean): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const duration = 800; // ms

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active]);

  return count;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useCountUp(value, true);
  return <span className="font-mono tabular-nums">{count.toLocaleString()}</span>;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({ title, value, error, loading }: MetricCardProps) {
  // Req 2.6 — skeleton while loading
  if (loading) return <Skeleton />;

  const isPlainNumber =
    typeof value === "number" && Number.isFinite(value) && value >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{title}</p>

      {/* Req 2.7 — per-card error, other cards still render */}
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-1 text-3xl font-semibold">
          {/* Req 2.5 — counter animation for plain integers; other nodes render as-is */}
          {isPlainNumber ? <AnimatedNumber value={value as number} /> : value}
        </p>
      )}
    </div>
  );
}
