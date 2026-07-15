"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/admin/apiFetch";
import { toPaise } from "@/lib/format/rupees";
import { couponCreateSchema } from "@/lib/validation/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kind = "percent" | "flat";

type FormErrors = Partial<
  Record<
    | "code"
    | "kind"
    | "amount"
    | "minSubtotal"
    | "maxDiscount"
    | "usageLimit"
    | "perUserLimit"
    | "startsAt"
    | "endsAt"
    | "stacksWith"
    | "form",
    string
  >
>;

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponForm() {
  const router = useRouter();

  // Fields
  const [code, setCode] = React.useState("");
  const [kind, setKind] = React.useState<Kind>("percent");
  const [amount, setAmount] = React.useState("");
  const [minSubtotal, setMinSubtotal] = React.useState("");
  const [maxDiscount, setMaxDiscount] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");
  const [perUserLimit, setPerUserLimit] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [stacksWith, setStacksWith] = React.useState<string[]>([]);
  const [stacksWithInput, setStacksWithInput] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  // ─── stacksWith helpers ──────────────────────────────────────────────────

  function addStacksWith() {
    const val = stacksWithInput.trim().toUpperCase();
    if (!val) return;
    if (!stacksWith.includes(val)) {
      setStacksWith((prev) => [...prev, val]);
    }
    setStacksWithInput("");
  }

  function removeStacksWith(code: string) {
    setStacksWith((prev) => prev.filter((c) => c !== code));
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // Parse numeric fields
    const amountNum = parseFloat(amount);
    const minSubtotalNum = minSubtotal.trim() ? parseFloat(minSubtotal) : 0;
    const maxDiscountNum = maxDiscount.trim() ? parseFloat(maxDiscount) : undefined;
    const usageLimitNum = usageLimit.trim() ? parseInt(usageLimit, 10) : undefined;
    const perUserLimitNum = perUserLimit.trim() ? parseInt(perUserLimit, 10) : undefined;

    // Manual validations before Zod
    if (!code.trim()) newErrors.code = "Code is required.";
    if (isNaN(amountNum) || amountNum <= 0) newErrors.amount = "Enter a valid amount.";
    if (kind === "percent" && amountNum > 100) newErrors.amount = "Percent discount cannot exceed 100.";

    const startsAtDate = startsAt ? new Date(startsAt) : undefined;
    const endsAtDate = endsAt ? new Date(endsAt) : undefined;

    if (endsAtDate) {
      if (startsAtDate) {
        if (endsAtDate <= startsAtDate) {
          newErrors.endsAt = "End date must be after start date.";
        }
      } else {
        if (endsAtDate <= new Date()) {
          newErrors.endsAt = "End date must be in the future.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build payload with paise conversion
    const payload = {
      code: code.trim().toUpperCase(),
      kind,
      // percent: raw integer; flat: rupees → paise
      amount: kind === "flat" ? toPaise(amountNum) : Math.round(amountNum),
      minSubtotal: toPaise(minSubtotalNum),
      ...(kind === "percent" && maxDiscountNum !== undefined
        ? { maxDiscount: toPaise(maxDiscountNum) }
        : {}),
      ...(usageLimitNum !== undefined ? { usageLimit: usageLimitNum } : {}),
      ...(perUserLimitNum !== undefined ? { perUserLimit: perUserLimitNum } : {}),
      ...(startsAtDate ? { startsAt: startsAtDate } : {}),
      ...(endsAtDate ? { endsAt: endsAtDate } : {}),
      stacksWith,
      isActive,
    };

    // Zod safeParse
    const result = couponCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      if (Object.keys(fieldErrors).length === 0)
        fieldErrors.form = result.error.issues[0]?.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    // stacksWith warning
    if (stacksWith.length > 0) {
      toast.warning(
        `This coupon stacks with ${stacksWith.length} other coupon(s): ${stacksWith.join(", ")}`,
      );
    }

    setLoading(true);
    try {
      await apiFetch("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      router.push("/admin/coupons");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong.";
      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ code: "This coupon code already exists." });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New Coupon</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}

        {/* Code */}
        <Field label="Code" error={errors.code}>
          <input
            className={inputCls(!!errors.code)}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER20"
            maxLength={32}
          />
        </Field>

        {/* Kind */}
        <Field label="Kind" error={errors.kind}>
          <select
            className={inputCls(!!errors.kind)}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setMaxDiscount(""); // reset when switching
            }}
          >
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
        </Field>

        {/* Amount */}
        <Field
          label={kind === "percent" ? "Discount (%)" : "Discount Amount (₹)"}
          error={errors.amount}
        >
          <input
            type="number"
            min="0"
            max={kind === "percent" ? 100 : undefined}
            step={kind === "percent" ? "1" : "0.01"}
            className={inputCls(!!errors.amount)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={kind === "percent" ? "20" : "100.00"}
          />
        </Field>

        {/* maxDiscount — percent only */}
        {kind === "percent" && (
          <Field label="Max Discount (₹)" error={errors.maxDiscount}>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls(!!errors.maxDiscount)}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground">
              Cap the maximum rupee value this percentage discount can provide.
            </p>
          </Field>
        )}

        {/* Min subtotal */}
        <Field label="Min Subtotal (₹)" error={errors.minSubtotal}>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls(!!errors.minSubtotal)}
            value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)}
            placeholder="0 (no minimum)"
          />
        </Field>

        {/* Usage & per-user limits */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Usage Limit" error={errors.usageLimit}>
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls(!!errors.usageLimit)}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </Field>
          <Field label="Per-User Limit" error={errors.perUserLimit}>
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls(!!errors.perUserLimit)}
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </Field>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts At" error={errors.startsAt}>
            <input
              type="datetime-local"
              className={inputCls(!!errors.startsAt)}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Ends At" error={errors.endsAt}>
            <input
              type="datetime-local"
              className={inputCls(!!errors.endsAt)}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
        </div>

        {/* Stacks With */}
        <Field label="Stacks With" error={errors.stacksWith}>
          <div className="flex gap-2">
            <input
              className={inputCls(false)}
              value={stacksWithInput}
              onChange={(e) => setStacksWithInput(e.target.value.toUpperCase())}
              placeholder="OTHER10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStacksWith();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addStacksWith}>
              Add
            </Button>
          </div>
          {stacksWith.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {stacksWith.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeStacksWith(c)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${c}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        {/* Is Active */}
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active (usable on storefront)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create coupon"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/coupons")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1",
    hasError
      ? "border-destructive focus:ring-destructive/40"
      : "border-border focus:ring-ring",
  ].join(" ");
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
