import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { connectDB, OrderModel } from "@/lib/db";

export const metadata: Metadata = {
  title: "Orders — Naysa Admin",
  description: "View and manage customer orders.",
  robots: { index: false, follow: false },
};
import { OrderTable } from "@/components/admin/orders/OrderTable";

export default async function OrdersPage() {
  await requireAdmin();
  await connectDB();

  const [items, total] = await Promise.all([
    OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .select("-__v -razorpaySignature")
      .lean(),
    OrderModel.countDocuments(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <OrderTable
        initialOrders={JSON.parse(JSON.stringify(items))}
        initialTotal={total}
      />
    </div>
  );
}
