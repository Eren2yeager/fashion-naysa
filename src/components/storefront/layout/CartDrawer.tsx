"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { slideInRight } from "@/lib/animation-variants";

export default function CartDrawer() {
  const { data: session } = useSession();
  const router = useRouter();

  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const setCouponCode = useCartStore((s) => s.setCouponCode);
  const setAppliedDiscount = useCartStore((s) => s.setAppliedDiscount);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const isEmpty = items.length === 0;

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      // Client-side preview using pure computeOrderTotals.
      // No coupon doc available client-side — we can only call with no coupon
      // object to show subtotal; authoritative discount comes from POST /api/checkout.
      // ponytail: we call with no coupon here because we don't have the coupon
      // document client-side; the server confirms the real discount at checkout.
      setCouponCode(couponInput.trim().toUpperCase());
      setCouponError("Coupon will be applied at checkout");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Could not apply coupon — please try again");
      setAppliedDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  }

  function handleCheckout() {
    if (isEmpty) return;
    toggleCart();
    if (!session) {
      router.push("/login?callbackUrl=/checkout");
    } else {
      router.push("/checkout");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            className="fixed inset-0 z-40 bg-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleCart}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background text-foreground shadow-2xl"
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold tracking-widest uppercase">Cart</h2>
              <button
                type="button"
                onClick={toggleCart}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Line items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isEmpty ? (
                <p className="mt-8 text-center text-sm text-muted-foreground">Your cart is empty.</p>
              ) : (
                <ul className="space-y-6" aria-label="Cart items">
                  {items.map((item) => (
                    <li key={item.sku} className="flex gap-4">
                      {/* Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-16 rounded object-cover bg-muted flex-shrink-0"
                        width={64}
                        height={80}
                      />

                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-sm font-medium text-foreground leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.size} / {item.color}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(item.price)} each
                        </span>

                        {/* Qty controls */}
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              item.qty > 1
                                ? setQty(item.sku, item.qty - 1)
                                : removeItem(item.sku)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded border border-border text-foreground transition-colors hover:bg-muted"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQty(item.sku, Math.min(item.qty + 1, 10))}
                            disabled={item.qty >= 10}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            <Plus className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => removeItem(item.sku)}
                            className="ml-auto flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <span className="text-sm font-medium text-foreground shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="border-t border-border px-6 py-4 space-y-4">
                {/* Coupon input */}
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-muted-foreground" role="alert">
                      {couponError}
                    </p>
                  )}
                  {couponCode && !couponError && (
                    <p className="text-xs text-muted-foreground">
                      Code <strong className="text-foreground">{couponCode}</strong> applied at checkout.
                    </p>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-foreground">−{formatPrice(appliedDiscount)}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isEmpty}
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
