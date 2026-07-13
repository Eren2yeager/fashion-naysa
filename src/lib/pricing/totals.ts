// Pure pricing math. No DB, no IO. Safe to import in any test.
import { badRequest } from "@/lib/errors/AppError";

export const FLAT_SHIPPING_PAISE = 9900; // ₹99 — placeholder
export const FREE_SHIPPING_THRESHOLD_PAISE = 150000; // ₹1500

export type CouponLike = {
  code: string;
  kind: "percent" | "flat";
  amount: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
};

export type TotalsInput = {
  subtotal: number;
  coupon?: CouponLike | null;
  now?: Date;
};

export type TotalsResult = {
  discount: number;
  shipping: number;
  total: number;
  coupon: { code: string; discount: number } | null;
};

/**
 * Pure: subtotal + coupon → discount, shipping, total.
 * Throws AppError(400) on invalid coupon (window, min subtotal, limit).
 */
export function computeOrderTotals(input: TotalsInput): TotalsResult {
  const { subtotal, now = new Date() } = input;
  const coupon = input.coupon ?? null;

  let discount = 0;
  let applied: { code: string; discount: number } | null = null;

  if (coupon) {
    if (coupon.startsAt && coupon.startsAt > now) throw badRequest("Coupon not yet active");
    if (coupon.endsAt && coupon.endsAt < now) throw badRequest("Coupon expired");
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      throw badRequest(`Minimum subtotal ₹${coupon.minSubtotal / 100}`);
    }
    if (coupon.usageLimit != null) {
      if ((coupon.usedCount ?? 0) >= coupon.usageLimit) {
        throw badRequest("Coupon usage limit reached");
      }
    }
    if (coupon.kind === "percent") {
      discount = Math.floor((subtotal * coupon.amount) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.amount;
    }
    discount = Math.min(discount, subtotal);
    applied = { code: coupon.code.toUpperCase(), discount };
  }

  const shipping =
    subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;

  return { discount, shipping, total: subtotal - discount + shipping, coupon: applied };
}
