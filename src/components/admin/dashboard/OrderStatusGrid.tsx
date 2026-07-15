import { ORDER_STATUS, type OrderStatus } from "@/lib/db/models/Order";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

interface OrderStatusGridProps {
  counts: Partial<Record<OrderStatus, number>>;
}

export function OrderStatusGrid({ counts }: OrderStatusGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ORDER_STATUS.map((status) => (
        <div
          key={status}
          className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4"
        >
          <StatusBadge status={status} />
          <span className="text-2xl font-semibold tabular-nums">
            {counts[status] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}
