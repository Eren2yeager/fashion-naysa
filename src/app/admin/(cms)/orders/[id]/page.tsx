import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { OrderDetail } from "@/components/admin/orders/OrderDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id.slice(-8).toUpperCase()} — Naysa Admin`,
    robots: { index: false, follow: false },
  };
}

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
