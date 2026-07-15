import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { connectDB, ProductModel } from "@/lib/db";
import { ProductForm } from "@/components/admin/products/ProductForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const product = await ProductModel.findById(id).select("name").lean();
  return {
    title: product ? `Edit "${product.name}" — Naysa Admin` : "Edit Product — Naysa Admin",
    robots: { index: false, follow: false },
  };
}

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
