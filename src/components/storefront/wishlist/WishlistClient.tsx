"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/storefront/shop/ProductCard";
import { useCartStore } from "@/lib/cart-store";

type WishlistProduct = {
  _id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  variants: { sku: string; size: string; color: string; stock: number }[];
  tags: string[];
};

interface WishlistClientProps {
  products: WishlistProduct[];
  error?: string;
}

export default function WishlistClient({ products: initial, error }: WishlistClientProps) {
  const [products, setProducts] = useState(initial);
  const router = useRouter();
  const { addItem, toggleCart } = useCartStore();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-4">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground tracking-wide">Your wishlist is empty.</p>
        <Link
          href="/shop"
          className="text-sm underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const firstInStock = product.variants.find((v) => v.stock > 0);

        function handleAddToCart() {
          if (!firstInStock) return;
          addItem({
            productId: product._id,
            sku: firstInStock.sku,
            size: firstInStock.size,
            color: firstInStock.color,
            name: product.name,
            image: product.images[0]?.url ?? "",
            price: product.price,
          });
          toggleCart();
        }

        function handleRemove() {
          setProducts((prev) => prev.filter((p) => p._id !== product._id));
        }

        return (
          <div key={product._id} className="flex flex-col gap-2">
            <ProductCard
              product={product}
              isWishlisted={true}
              onRemove={handleRemove}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!firstInStock}
              onClick={handleAddToCart}
              className="w-full text-xs tracking-wide"
            >
              {firstInStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
