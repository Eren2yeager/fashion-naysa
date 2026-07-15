import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// OKLCH color classes per OrderStatus (no hex/rgb/hsl)
const ORDER_STATUS_CLASSES: Record<string, string> = {
  created:
    "bg-[oklch(0.85_0.1_240)] text-[oklch(0.3_0.1_240)] border-transparent",
  paid: "bg-[oklch(0.85_0.12_145)] text-[oklch(0.3_0.12_145)] border-transparent",
  fulfilled:
    "bg-[oklch(0.85_0.1_190)] text-[oklch(0.3_0.1_190)] border-transparent",
  shipped:
    "bg-[oklch(0.85_0.1_280)] text-[oklch(0.3_0.1_280)] border-transparent",
  delivered:
    "bg-[oklch(0.8_0.15_155)] text-[oklch(0.25_0.15_155)] border-transparent",
  cancelled: "bg-muted text-muted-foreground border-transparent",
  refunded:
    "bg-[oklch(0.88_0.12_85)] text-[oklch(0.3_0.1_85)] border-transparent",
  failed: "bg-destructive/20 text-destructive border-transparent",
};

const ACTIVE_CLASSES =
  "bg-[oklch(0.85_0.12_145)] text-[oklch(0.3_0.12_145)] border-transparent";
const INACTIVE_CLASSES = "bg-muted text-muted-foreground border-transparent";

interface StatusBadgeProps {
  status: string;
  variant?: "order" | "active";
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  let className: string;

  if (variant === "active") {
    // For product active/inactive: treat any truthy non-"inactive"/"false" string as active
    const isActive =
      status === "true" || status === "active" || status === "1";
    className = isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES;
  } else {
    className = ORDER_STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground border-transparent";
  }

  return (
    <Badge className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}
