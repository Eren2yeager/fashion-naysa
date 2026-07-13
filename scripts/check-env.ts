import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  SHIPROCKET_EMAIL: z.string().email(),
  SHIPROCKET_PASSWORD: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const r = schema.safeParse(process.env);
if (!r.success) {
  for (const i of r.error.issues) console.log(i.path.join("."), i.message);
  process.exit(1);
}
console.log("OK");
