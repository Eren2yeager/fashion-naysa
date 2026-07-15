import { ORDER_STATUS, type OrderStatus } from "@/lib/db/models/Order";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { NumberTicker } from "@/components/ui/number-ticker";

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
          <NumberTicker
            value={counts[status] ?? 0}
            className="text-2xl font-semibold"
          />
        </div>
      ))}
    </div>
  );
}
