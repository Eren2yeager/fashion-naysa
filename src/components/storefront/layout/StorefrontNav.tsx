"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingBag, Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { useCartStore } from "@/lib/cart-store";
import { Badge } from "@/components/ui/badge";
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

  // Sections with data-nav-theme="dark" signal the nav to use white text.
  // The gradient in those sections handles image legibility independently.
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    // Fires when a dark-theme section's top edge is within the nav height (64px)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setOnDark(true); return; }
        }
        // Only flip to light if no dark section is still intersecting
        const anyStillVisible = Array.from(
          document.querySelectorAll("[data-nav-theme='dark']")
        ).some((el) => {
          const r = el.getBoundingClientRect();
          return r.top < 64 && r.bottom > 0;
        });
        setOnDark(anyStillVisible);
      },
      // top 64px of viewport only
      { rootMargin: "0px 0px -100% 0px", threshold: 0 }
    );

    const attach = () =>
      document.querySelectorAll("[data-nav-theme='dark']").forEach((el) => observer.observe(el));

    attach();
    const t = setTimeout(attach, 300);
    return () => { observer.disconnect(); clearTimeout(t); };
  }, []);

  const textCls = onDark
    ? "text-white"
    : "text-foreground";

  const mutedCls = onDark
    ? "text-white/70"
    : "text-muted-foreground";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className={`font-heading text-xl font-black tracking-widest uppercase transition-colors duration-300 ${textCls}`}
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
              className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-300 hover:opacity-70 ${mutedCls}`}
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
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-300 hover:opacity-70 ${mutedCls}`}
            >
              <Heart className="size-5" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCart}
            aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-300 hover:opacity-70 ${mutedCls}`}
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
              className={`text-xs font-medium truncate max-w-[100px] transition-colors duration-300 hover:opacity-70 ${mutedCls}`}
              aria-label="My account"
            >
              {session.user?.name?.split(" ")[0] ?? session.user?.email}
            </Link>
          ) : (
            <Link
              href="/login"
              className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-300 hover:opacity-70 ${mutedCls}`}
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile — StaggeredMenu's own toggle button is the hamburger */}
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
            menuButtonColor={onDark ? "#ffffff" : "var(--foreground)"}
            changeMenuColorOnOpen={false}
            closeOnClickAway
          />
        </div>
      </nav>
    </header>
  );
}
