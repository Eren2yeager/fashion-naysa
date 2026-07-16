"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistToggleProps {
  productId: string;
  isWishlisted: boolean;
  "aria-disabled"?: boolean;
  className?: string;
  onRemove?: () => void;
}

export default function WishlistToggle({
  productId,
  isWishlisted,
  "aria-disabled": ariaDisabled,
  className,
  onRemove,
}: WishlistToggleProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [pending, setPending] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (ariaDisabled || pending) return;

    // Optimistic update
    const next = !wishlisted;
    setWishlisted(next);
    setPending(true);

    try {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Wishlist API error");
      if (!next) onRemove?.();
    } catch {
      // Revert on error
      setWishlisted(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-disabled={ariaDisabled}
      disabled={pending}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        "bg-background/60 hover:bg-background/80 backdrop-blur-sm",
        ariaDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          wishlisted ? "fill-foreground stroke-foreground" : "stroke-foreground fill-none",
        )}
      />
    </button>
  );
}
