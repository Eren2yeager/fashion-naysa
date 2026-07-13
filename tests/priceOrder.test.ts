// Coupon math: flat, percent, maxDiscount cap, minSubtotal, usage limit,
// shipping tiers, expiry window, percent floors to integer paise.
import { describe, it, expect } from "bun:test";
// Import the pure math module directly — bypasses the priceOrder module so
// tests don't pull in mongoose.
import {
  computeOrderTotals,
  FLAT_SHIPPING_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
} from "@/lib/pricing/totals";

const NOW = new Date("2026-07-13T12:00:00Z");

describe("computeOrderTotals — no coupon", () => {
  it("charges flat shipping for small subtotals", () => {
    const t = computeOrderTotals({ subtotal: 50_000, now: NOW });
    expect(t.discount).toBe(0);
    expect(t.shipping).toBe(FLAT_SHIPPING_PAISE);
    expect(t.total).toBe(50_000 + FLAT_SHIPPING_PAISE);
    expect(t.coupon).toBeNull();
  });

  it("waives shipping above the free threshold", () => {
    const t = computeOrderTotals({ subtotal: FREE_SHIPPING_THRESHOLD_PAISE, now: NOW });
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(FREE_SHIPPING_THRESHOLD_PAISE);
  });

  it("zero subtotal means zero shipping", () => {
    const t = computeOrderTotals({ subtotal: 0, now: NOW });
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(0);
  });
});

describe("computeOrderTotals — flat coupon", () => {
  it("applies flat discount directly", () => {
    const t = computeOrderTotals({
      subtotal: 20_000,
      coupon: { code: "save500", kind: "flat", amount: 500 },
      now: NOW,
    });
    expect(t.discount).toBe(500);
    expect(t.shipping).toBe(FLAT_SHIPPING_PAISE);
    expect(t.total).toBe(20_000 - 500 + FLAT_SHIPPING_PAISE);
  });

  it("caps flat discount at subtotal (no negative total)", () => {
    const t = computeOrderTotals({
      subtotal: 300,
      coupon: { code: "huge", kind: "flat", amount: 9_999 },
      now: NOW,
    });
    expect(t.discount).toBe(300);
    expect(t.total).toBe(0 + FLAT_SHIPPING_PAISE);
  });
});

describe("computeOrderTotals — percent coupon", () => {
  it("applies percent and floors to integer paise", () => {
    // 10% of 333 = 33.3 → 33
    const t = computeOrderTotals({
      subtotal: 333,
      coupon: { code: "ten", kind: "percent", amount: 10 },
      now: NOW,
    });
    expect(t.discount).toBe(33);
  });

  it("respects maxDiscount cap", () => {
    // 50% of 100_000 = 50_000, capped at 5_000
    const t = computeOrderTotals({
      subtotal: 100_000,
      coupon: { code: "half", kind: "percent", amount: 50, maxDiscount: 5_000 },
      now: NOW,
    });
    expect(t.discount).toBe(5_000);
  });
});

describe("computeOrderTotals — guard rails", () => {
  it("rejects when minSubtotal not met", () => {
    expect(() =>
      computeOrderTotals({
        subtotal: 1_000,
        coupon: { code: "big", kind: "flat", amount: 100, minSubtotal: 5_000 },
        now: NOW,
      }),
    ).toThrow(/Minimum subtotal/);
  });

  it("rejects when usageLimit already reached", () => {
    expect(() =>
      computeOrderTotals({
        subtotal: 5_000,
        coupon: { code: "limited", kind: "flat", amount: 100, usageLimit: 5, usedCount: 5 },
        now: NOW,
      }),
    ).toThrow(/usage limit/);
  });

  it("rejects before startsAt", () => {
    expect(() =>
      computeOrderTotals({
        subtotal: 5_000,
        coupon: {
          code: "future",
          kind: "flat",
          amount: 100,
          startsAt: new Date("2027-01-01T00:00:00Z"),
        },
        now: NOW,
      }),
    ).toThrow(/not yet active/);
  });

  it("rejects after endsAt", () => {
    expect(() =>
      computeOrderTotals({
        subtotal: 5_000,
        coupon: {
          code: "old",
          kind: "flat",
          amount: 100,
          endsAt: new Date("2020-01-01T00:00:00Z"),
        },
        now: NOW,
      }),
    ).toThrow(/expired/);
  });
});
