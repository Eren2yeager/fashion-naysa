"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { z } from "zod";
import { addressSchema } from "@/lib/validation/schemas";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { storefrontFetch } from "@/lib/storefront-fetch";
import type { SessionUser } from "@/lib/auth";
import AddressForm from "./AddressForm";

type Address = z.infer<typeof addressSchema>;
type Step = "address" | "paying" | "done";

interface CheckoutPageProps {
  user: SessionUser;
}

interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

const RZP_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export default function CheckoutPage({ user }: CheckoutPageProps) {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>("address");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

  async function handleAddressSubmit(address: Address) {
    setError(null);
    setLoading(true);
    setStep("paying");

    let checkout: CheckoutResponse;
    try {
      checkout = await storefrontFetch<{ orderId: string; razorpayOrderId: string; amount: number; currency: string }>(
        "/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty })),
            shippingAddress: address,
            couponCode: couponCode || undefined,
          }),
        },
      );
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Something went wrong. Please try again.";
      setError(msg);
      setStep("address");
      setLoading(false);
      return;
    }

    // Order is created in DB at this point. Open Razorpay to capture payment.
    // The webhook at /api/webhooks/razorpay handles server-side payment confirmation.
    // On success we clear cart and navigate; no additional POST needed.
    const rzp = new window.Razorpay({
      key: RZP_KEY,
      amount: checkout.amount,
      currency: checkout.currency,
      order_id: checkout.razorpayOrderId,
      name: "Naysa",
      prefill: {
        name: user.name ?? user.email,
        email: user.email,
      },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled. Your cart has been saved.");
          setStep("address");
          setLoading(false);
        },
      },
      handler: () => {
        // Payment captured — order confirmation happens via Razorpay webhook.
        // The order doc already exists; navigate to confirmation.
        clearCart();
        setStep("done");
        router.push(`/order-confirmation/${checkout.orderId}`);
      },
    });

    rzp.open();
    setLoading(false);
  }

  return (
    <>
      {/* Load Razorpay SDK lazily — only when this page mounts */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1fr_400px]">
        {/* Left: address form */}
        <section aria-labelledby="checkout-heading">
          <h1
            id="checkout-heading"
            className="mb-6 text-sm font-semibold tracking-widest uppercase text-foreground"
          >
            Shipping Address
          </h1>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {step !== "done" && (
            <AddressForm onSubmit={handleAddressSubmit} loading={loading} />
          )}
        </section>

        {/* Right: order summary */}
        <aside aria-label="Order summary" className="space-y-4">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-foreground">
            Order Summary
          </h2>

          <ul className="space-y-3 border-b border-border pb-4">
            {items.map((item) => (
              <li key={item.sku} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {item.name}{" "}
                  <span className="text-xs">
                    ({item.size} / {item.color}) × {item.qty}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-foreground">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-foreground">−{formatPrice(appliedDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="italic text-muted-foreground">Calculated at checkout</span>
            </div>

            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatPrice(subtotal - appliedDiscount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
