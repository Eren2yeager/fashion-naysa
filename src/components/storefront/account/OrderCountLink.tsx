import Link from "next/link";
import { connectDB, OrderModel } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

interface Props {
  user: SessionUser;
}

export async function OrderCountLink({ user }: Props) {
  await connectDB();
  const count = await OrderModel.countDocuments({ userId: user.id });

  return (
    <Link
      href="/account/orders"
      className="flex items-center justify-between px-5 py-4 text-sm text-foreground hover:bg-muted/40 transition-colors"
    >
      <span className="font-medium">My Orders</span>
      <span className="flex items-center gap-3 text-muted-foreground">
        {count > 0 && (
          <span className="text-xs">{count} order{count !== 1 ? "s" : ""}</span>
        )}
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
