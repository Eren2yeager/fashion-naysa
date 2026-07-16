"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingBag, Heart } from "lucide-react";

import { useCartStore } from "@/lib/cart-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaggeredMenu } from "@/components/ui/StaggeredMenu";

const NAV_ITEMS = [
  { label: "SHOP", ariaLabel: "Shop all products", link: "/shop" },
  { label: "COLLECTIONS", ariaLabel: "Browse collections", link: "/collections" },
];

const SOCIAL_ITEMS = [
  { label: "Instagram", link: "https://instagram.com" },
  { label: "Pinterest", link: "https://pinterest.com" },
];

export default function StorefrontNav() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-xl font-black tracking-widest text-foreground uppercase"
          aria-label="NAYSA — home"
        >
          NAYSA
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(({ label, link }) => (
            <Link
              key={label}
              href={link}
              className="text-xs font-semibold tracking-widest text-muted-foreground transition-colors hover:text-foreground uppercase"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {session && (
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <Heart className="size-5" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCart}
            aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingBag className="size-5" />
            {itemCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]"
                aria-hidden="true"
              >
                {itemCount}
              </Badge>
            )}
          </button>

          {session ? (
            <Link
              href="/account"
              className="text-xs font-medium text-muted-foreground truncate max-w-[100px] hover:text-foreground transition-colors"
              aria-label="My account"
            >
              {session.user?.name?.split(" ")[0] ?? session.user?.email}
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile — StaggeredMenu's own toggle button is the hamburger.
            Always in the DOM so GSAP can animate; isFixed makes it full-screen. */}
        <div className="md:hidden">
          <StaggeredMenu
            isFixed
            items={[
              ...NAV_ITEMS.map((i) => ({ label: i.label, ariaLabel: i.ariaLabel, link: i.link })),
              ...(session
                ? [
                    { label: "WISHLIST", ariaLabel: "Wishlist", link: "/wishlist" },
                    { label: "MY ACCOUNT", ariaLabel: "My account", link: "/account" },
                  ]
                : [{ label: "SIGN IN", ariaLabel: "Sign in", link: "/login" }]),
            ]}
            socialItems={SOCIAL_ITEMS}
            colors={["var(--foreground)", "var(--primary)"]}
            closeOnClickAway
          />
        </div>
      </nav>
    </header>
  );
}
