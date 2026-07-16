import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { connectDB, WishlistModel } from "@/lib/db";
import WishlistClient from "@/components/storefront/wishlist/WishlistClient";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

type PopulatedProduct = {
  _id: { toString(): string };
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  variants: { sku: string; size: string; color: string; stock: number }[];
  tags: string[];
};

export default async function WishlistPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/wishlist");

  await connectDB();

  let resolvedProducts: Parameters<typeof WishlistClient>[0]["products"] = [];
  let error: string | undefined;

  try {
    const items = await WishlistModel.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .populate("productId", "name slug price compareAtPrice images variants tags")
      .lean();

    resolvedProducts = items
      .filter((item) => item.productId != null)
      .map((item) => {
        const p = item.productId as unknown as PopulatedProduct;
        return {
          _id: p._id.toString(),
          slug: p.slug,
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          images: p.images.map((img) => ({ url: img.url, alt: img.alt ?? "" })),
          variants: p.variants,
          tags: p.tags,
        };
      });
  } catch {
    error = "We couldn't load your wishlist right now.";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-8 text-sm font-semibold tracking-widest uppercase text-foreground">
        Wishlist
      </h1>
      <WishlistClient products={resolvedProducts} error={error} />
    </div>
  );
}
