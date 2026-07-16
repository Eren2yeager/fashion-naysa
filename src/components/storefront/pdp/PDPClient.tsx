"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WishlistToggle from "@/components/storefront/shared/WishlistToggle";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { fadeIn } from "@/lib/animation-variants";

export interface SerializedProduct {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  variants: { sku: string; size: string; color: string; stock: number }[];
  tags: string[];
  creatorContent: {
    creatorName: string;
    platform: string;
    url: string;
    embedHtml?: string;
  }[];
}

interface PDPClientProps {
  product: SerializedProduct;
  initialWishlisted: boolean;
}

export default function PDPClient({ product, initialWishlisted }: PDPClientProps) {
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);

  // Derived unique sizes and colors
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const selectedVariant =
    selectedSize && selectedColor
      ? product.variants.find((v) => v.size === selectedSize && v.color === selectedColor)
      : null;

  const stockLabel = selectedVariant
    ? selectedVariant.stock === 0
      ? "Out of Stock"
      : selectedVariant.stock <= 10
        ? `${selectedVariant.stock} left`
        : "In Stock"
    : null;

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const primaryImage = product.images[primaryImageIndex];

  function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock === 0) return;
    addItem({
      productId: product._id,
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      color: selectedVariant.color,
      name: product.name,
      image: product.images[0]?.url ?? "",
      price: product.price,
    });
    toggleCart();
  }

  const cartDisabled = !selectedVariant || selectedVariant.stock === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* ── Image Gallery ── */}
        <div className="flex flex-col gap-4">
          {/* Primary image */}
          <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={primaryImageIndex}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute inset-0"
              >
                {primaryImage && !imgError ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setPrimaryImageIndex(i); setImgError(false); }}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden bg-muted border transition-colors ${
                    i === primaryImageIndex ? "border-foreground" : "border-transparent"
                  }`}
                  aria-label={img.alt || `Image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Details ── */}
        <div className="flex flex-col gap-6">
          {/* Name + wishlist */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-widest uppercase text-foreground">
              {product.name}
            </h1>
            <WishlistToggle productId={product._id} isWishlisted={initialWishlisted} />
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-xl text-foreground">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-sm text-foreground/40 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                {discountPct !== null && (
                  <Badge variant="default">{discountPct}% off</Badge>
                )}
              </>
            )}
          </div>

          {/* Size selector */}
          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs tracking-widest uppercase text-foreground/60">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[40px] border px-3 py-1.5 text-sm tracking-wide transition-colors ${
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs tracking-widest uppercase text-foreground/60">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`border px-3 py-1.5 text-sm tracking-wide transition-colors ${
                      selectedColor === color
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock label */}
          {stockLabel && (
            <p className={`text-sm ${stockLabel === "Out of Stock" ? "text-destructive" : "text-foreground/60"}`}>
              {stockLabel}
            </p>
          )}

          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            disabled={cartDisabled}
            size="lg"
            className="w-full tracking-widest uppercase"
          >
            {!selectedVariant
              ? "Select Size & Color"
              : selectedVariant.stock === 0
                ? "Out of Stock"
                : "Add to Cart"}
          </Button>

          {/* Description */}
          <div className="border-t border-border pt-6">
            <p className="text-sm leading-relaxed text-foreground/70">{product.description}</p>
          </div>
        </div>
      </div>

      {/* ── Creator Content ── */}
      {product.creatorContent.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-8 text-xs tracking-widest uppercase text-foreground/60">
            Creator Content
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {product.creatorContent.map((cc, i) => (
              <div key={i} className="flex flex-col gap-3">
                {cc.embedHtml ? (
                  <iframe
                    srcDoc={cc.embedHtml}
                    sandbox="allow-scripts allow-same-origin"
                    className="h-64 w-full border-0"
                    title={`${cc.creatorName} on ${cc.platform}`}
                  />
                ) : (
                  <a
                    href={cc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    {cc.creatorName} — {cc.platform}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
