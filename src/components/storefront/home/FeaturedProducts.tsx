"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { staggerContainer, scaleUp } from "@/lib/animation-variants";
import { formatPrice } from "@/lib/format/formatPrice";
import Image from "next/image";
import Link from "next/link";

// TODO: replace with real ProductCard once src/components/storefront/shop/ProductCard.tsx exists
interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string; alt: string }[];
}

function PlaceholderCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm tracking-wide text-foreground truncate">{product.name}</p>
        <p className="text-sm text-foreground/60">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

const SKELETON_COUNT = 6;

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=6")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load products (${r.status})`);
        return r.json();
      })
      .then((data) => {
        // API may return { products: [...] } or [...]
        setProducts(Array.isArray(data) ? data : (data.items ?? data.products ?? []));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24 md:px-12">
        <h2 className="mb-12 text-xs tracking-[0.4em] uppercase text-foreground/50">
          Featured
        </h2>

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="h-72 w-full animate-pulse bg-muted rounded-none" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {products.map((product) => (
              <motion.div key={product._id} variants={scaleUp}>
                <PlaceholderCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
