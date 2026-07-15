import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Products — Naysa Admin",
  description: "Manage the Naysa product catalogue.",
  robots: { index: false, follow: false },
};
import { connectDB, ProductModel } from "@/lib/db";
import { ProductTable } from "@/components/admin/products/ProductTable";

export default async function ProductsPage() {
  await requireAdmin();
  await connectDB();
  const products = await ProductModel.find()
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Product
        </Link>
      </div>
      <ProductTable initialProducts={JSON.parse(JSON.stringify(products))} />
    </div>
  );
}
