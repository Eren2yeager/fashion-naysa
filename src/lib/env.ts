import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI required"),

  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().min(1),
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

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

const isServer = typeof window === "undefined";

let cached: z.infer<typeof serverSchema> | undefined;

export function getEnv() {
  if (!isServer) {
    // ponytail: client only needs the publishable key; full server env stays off the bundle
    return clientSchema.parse({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    }) as unknown as z.infer<typeof serverSchema>;
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
