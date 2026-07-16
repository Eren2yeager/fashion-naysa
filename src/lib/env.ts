import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI required"),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  // ponytail: only needed behind a proxy / non-localhost hosts; allow missing in dev.
  AUTH_TRUST_HOST: z.string().optional(),

  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  SHIPROCKET_EMAIL: z.string().email(),
  SHIPROCKET_PASSWORD: z.string().min(1),
  // ponytail: optional — if unset, the shiprocket webhook is unauthed in dev.
  // Set in production. Dashboard token goes here.
  SHIPROCKET_WEBHOOK_TOKEN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

// ponytail: no client-side auth secrets. Google login button is a server
// action — no NEXT_PUBLIC_* auth env needs to ship to the browser.
const clientSchema = z.object({});

const isServer = typeof window === "undefined";

let cached: z.infer<typeof serverSchema> | undefined;

export function getEnv() {
  if (!isServer) {
    return clientSchema.parse({}) as unknown as z.infer<typeof serverSchema>;
  }
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n  ");
    throw new Error(`Invalid server env:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
