"use client";

import type { OrderStatus } from "@/lib/db";

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["paid", "cancelled", "failed"],
  paid: ["fulfilled", "cancelled", "refunded"],
  fulfilled: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
  failed: [],
};

interface StatusTransitionSelectProps {
  current: OrderStatus;
  value: OrderStatus | "";
  onChange: (next: OrderStatus) => void;
  disabled?: boolean;
}

export function StatusTransitionSelect({
  current,
  value,
  onChange,
  disabled,
}: StatusTransitionSelectProps) {
  const options = VALID_TRANSITIONS[current];
  const isDisabled = disabled || options.length === 0;

  return (
    <select
      className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      disabled={isDisabled}
      aria-label="Transition to status"
    >
      <option value="" disabled>
        {options.length === 0 ? "No transitions available" : "Select next status…"}
      </option>
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
