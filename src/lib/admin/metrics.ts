import { ORDER_STATUS, type OrderStatus } from "@/lib/db/models/Order";

/** Statuses that count toward revenue. */
export const REVENUE_STATUSES: OrderStatus[] = [
  "paid",
  "fulfilled",
  "shipped",
  "delivered",
];

/**
 * Sum of `total` (paise) for orders whose status is in REVENUE_STATUSES.
 * Returns 0 when no qualifying orders exist.
 *
 * Validates: Requirements 2.1, 2.2
 */
export function computeRevenue(
  orders: Array<{ total: number; status: string }>,
): number {
  return orders.reduce(
    (sum, o) =>
      REVENUE_STATUSES.includes(o.status as OrderStatus) ? sum + o.total : sum,
    0,
  );
}

/**
 * Count of orders per status. All 8 ORDER_STATUS keys are always present,
 * defaulting to 0 for statuses absent from the input.
 *
 * Validates: Requirement 2.2
 */
export function computeStatusCounts(
  orders: Array<{ status: string }>,
): Record<OrderStatus, number> {
  const counts = Object.fromEntries(
    ORDER_STATUS.map((s) => [s, 0]),
  ) as Record<OrderStatus, number>;

  for (const o of orders) {
    if (o.status in counts) counts[o.status as OrderStatus]++;
  }

  return counts;
}
