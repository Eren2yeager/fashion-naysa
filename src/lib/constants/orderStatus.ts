/**
 * Order status constants — plain data, no Mongoose dependency.
 * Safe to import in both server and client components.
 */
export const ORDER_STATUS = [
  "created",
  "paid",
  "fulfilled",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];
