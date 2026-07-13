// HMAC timing-safe compare for Rzp webhooks.
// Tests: valid signature, tampered body, length mismatch, wrong secret.
import { describe, it, expect } from "bun:test";
import crypto from "node:crypto";
import { verifyWebhookSignature } from "@/lib/payments/orders";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  it("accepts a signature computed against the raw body", () => {
    expect(verifyWebhookSignature(body, sign("rzp_test_webhook_secret", body))).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = sign("rzp_test_webhook_secret", body);
    expect(verifyWebhookSignature(body + " ", sig)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(verifyWebhookSignature(body, sign("wrong_secret", body))).toBe(false);
  });

  it("rejects when signature buffer length differs", () => {
    // 5-byte hex string — short enough to mismatch but still valid hex
    expect(verifyWebhookSignature(body, "abcd1")).toBe(false);
  });
});
