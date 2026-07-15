import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { OrderDetail } from "@/components/admin/orders/OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const order = await OrderModel.findById(id)
    .select("-__v -razorpaySignature")
    .lean();
  if (!order) notFound();
  return <OrderDetail initialOrder={JSON.parse(JSON.stringify(order))} />;
}
