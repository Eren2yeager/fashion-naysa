import Razorpay from "razorpay";
import { getEnv } from "@/lib/env";

let client: Razorpay | undefined;

export function getRazorpay(): Razorpay {
  if (client) return client;
  const e = getEnv();
  client = new Razorpay({
    key_id: e.RAZORPAY_KEY_ID,
    key_secret: e.RAZORPAY_KEY_SECRET,
  });
  return client;
}
