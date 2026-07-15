import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDB, ProductModel } from "@/lib/db";
import { ProductForm } from "@/components/admin/products/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const product = await ProductModel.findById(id).select("-__v").lean();
  if (!product) notFound();
  return <ProductForm initialProduct={JSON.parse(JSON.stringify(product))} />;
}
