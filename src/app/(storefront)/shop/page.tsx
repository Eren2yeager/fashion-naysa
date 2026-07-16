import type { Metadata } from "next";
import { Suspense } from "react";
import { connectDB, ProductModel, WishlistModel, type Product as MongoProduct } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import ShopFilters from "@/components/storefront/shop/ShopFilters";
import ProductGrid from "@/components/storefront/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse Naysa's full range of premium shirts for girls. Filter by style, size, and more.",
  openGraph: {
    title: "Shop — Naysa",
    description: "Browse Naysa's full range of premium shirts for girls.",
    url: "/shop",
    images: [{ url: "/images/hero-2.png", width: 1200, height: 630, alt: "Naysa Shop" }],
  },
};

type SearchParams = Promise<{
  tag?: string;
  q?: string;
  page?: string;
  sort?: string;
}>;

interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  variants: { stock: number }[];
  tags: string[];
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const { tag, q, page: pageParam } = await searchParams;

  const page = Math.max(1, Number(pageParam ?? 1));
  const limit = 20;

  const filter: Record<string, unknown> = { isActive: true };
  if (tag) filter.tags = tag;
  if (q) filter.name = { $regex: q, $options: "i" };

  await connectDB();

  const [rawItems, total, user] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("slug name price compareAtPrice images variants tags")
      .lean(),
    ProductModel.countDocuments(filter),
    getOptionalUser(),
  ]);

  // Serialize (remove Mongoose internals) and convert ObjectIds to strings
  const items: Product[] = rawItems.map((p) => ({
    _id: String(p._id),
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    images: (p.images ?? []).map((img: MongoProduct["images"][number]) => ({ url: img.url, alt: img.alt ?? "" })),
    variants: (p.variants ?? []).map((v: MongoProduct["variants"][number]) => ({ stock: v.stock })),
    tags: p.tags ?? [],
  }));

  let wishlistedIds: string[] = [];
  if (user) {
    const wishlist = await WishlistModel.find({ userId: user.id })
      .select("productId")
      .lean();
    wishlistedIds = wishlist.map((w) => String(w.productId));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-widest uppercase text-foreground">
        Shop
      </h1>

      <div className="mb-8">
        {/* ShopFilters uses useSearchParams — must be inside Suspense */}
        <Suspense>
          <ShopFilters />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 w-full animate-pulse rounded-none bg-muted" />
            ))}
          </div>
        }
      >
        <ProductGrid initialProducts={items} total={total} wishlistedIds={wishlistedIds} />
      </Suspense>
    </main>
  );
}
