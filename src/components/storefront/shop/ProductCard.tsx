"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import WishlistToggle from "@/components/storefront/shared/WishlistToggle";
import { formatPrice } from "@/lib/format";
import { fadeIn } from "@/lib/animation-variants";

interface ProductCardProps {
  product: {
    _id: string;
    slug: string;
    name: string;
    price: number;          // paise
    compareAtPrice?: number; // paise
    images: { url: string; alt: string }[];
    variants: { stock: number }[];
    tags: string[];
  };
  isWishlisted: boolean;
  /** Called after the WishlistToggle successfully removes this product. */
  onRemove?: () => void;
}

export default function ProductCard({ product, isWishlisted, onRemove }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const primaryImage = product.images?.[0];
  const outOfStock = product.variants.every((v) => v.stock === 0);

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <motion.article
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="group relative flex flex-col"
    >
      {/* Image area */}
      <Link href={`/shop/${product.slug}`} className="relative block aspect-3/4 w-full overflow-hidden bg-muted">
        {primaryImage && !imgError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}

        {/* Discount badge */}
        {discountPct !== null && (
          <span className="absolute left-2 top-2">
            <Badge variant="default">{discountPct}% off</Badge>
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="text-xs tracking-widest uppercase text-foreground">Out of Stock</span>
          </div>
        )}

        {/* Wishlist toggle — positioned top-right */}
        <span className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
          <WishlistToggle
            productId={product._id}
            isWishlisted={isWishlisted}
            aria-disabled={outOfStock}
            onRemove={onRemove}
          />
        </span>
      </Link>

      {/* Card body — navigates to PDP */}
      <Link href={`/shop/${product.slug}`} className="mt-3 space-y-1">
        <p className="truncate text-sm tracking-wide text-foreground">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-foreground/40 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
