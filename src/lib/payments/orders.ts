// Money path — handler-level wrappers. Never inline HMAC math.
import crypto from "node:crypto";
import { getRazorpay } from "./razorpay";
import { getEnv } from "@/lib/env";
import { payment, upstream } from "@/lib/errors/AppError";

export type CreateRzpOrderInput = {
  /** amount in paise */
  amount: number;
  receipt: string;
  notes?: Record<string, string | number>;
};

export type RzpOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
};

export async function createOrder(input: CreateRzpOrderInput): Promise<RzpOrder> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw payment("Invalid amount");
  }
  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    });
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt ?? input.receipt,
      status: order.status,
    };
  } catch (err) {
    throw upstream("Failed to create Razorpay order", { err: (err as Error).message });
  }
}

/**
 * Client-side checkout confirmation.
 * Server MUST re-verify before marking order paid.
 */
export function verifyClientCheckoutSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { RAZORPAY_KEY_SECRET } = getEnv();
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  // timingSafeEqual needs equal-length buffers
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(args.signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Webhook signature — must be verified against the RAW request body string.
 * Never use parsed JSON; formatting differences break the HMAC.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { RAZORPAY_WEBHOOK_SECRET } = getEnv();
  const expected = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
