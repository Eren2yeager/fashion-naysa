"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { storefrontFetch } from "@/lib/storefront-fetch";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";

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

interface ApiResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

interface ProductGridProps {
  initialProducts: Product[];
  total: number;
  wishlistedIds: string[];
}

type SortValue = "" | "price-asc" | "price-desc";

function sortProducts(products: Product[], sort: SortValue): Product[] {
  if (sort === "price-asc") return [...products].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return [...products].sort((a, b) => b.price - a.price);
  return products; // "newest" = server default (already sorted by createdAt desc)
}

export default function ProductGrid({ initialProducts, total, wishlistedIds }: ProductGridProps) {
  const sp = useSearchParams();
  const router = useRouter();

  const tag = sp.get("tag") ?? "";
  const q = sp.get("q") ?? "";
  const sort = (sp.get("sort") ?? "") as SortValue;
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [currentTotal, setCurrentTotal] = useState(total);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch when tag / q filter changes; skip on initial mount (SSR data is already present)
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    params.set("page", "1");

    setLoading(true);
    setError(null);

    storefrontFetch<ApiResponse>(`/api/products?${params.toString()}`)
      .then((data) => {
        setProducts(data.items);
        setCurrentTotal(data.total);
      })
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, [tag, q]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    params.set("page", String(nextPage));

    setLoadingMore(true);
    setError(null);

    try {
      const data = await storefrontFetch<ApiResponse>(`/api/products?${params.toString()}`);
      setProducts((prev) => [...prev, ...data.items]);

      // Update URL with new page number
      const urlParams = new URLSearchParams(sp.toString());
      urlParams.set("page", String(nextPage));
      router.replace(`/shop?${urlParams.toString()}`, { scroll: false });
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }, [page, tag, q, sp, router]);

  function handleClear() {
    router.push("/shop");
  }

  const sorted = sortProducts(products, sort);
  const hasMore = products.length < currentTotal;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 w-full animate-pulse rounded-none bg-muted" />
        ))}
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">No products match your filters.</p>
        <Button variant="outline" onClick={handleClear}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isWishlisted={wishlistedIds.includes(product._id)}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
