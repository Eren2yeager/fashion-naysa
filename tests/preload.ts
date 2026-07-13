// Sets required env vars for tests that touch the priceOrder or webhook
// signature paths. Real DB-touching code paths are NOT tested here —
// those need a running Mongo (out of scope for smoke tests).
// @ts-expect-error mutating process.env at runtime in test preload
process.env.NODE_ENV = "test";
process.env.MONGODB_URI ||= "mongodb://localhost:27017/naysa-test";
process.env.CLERK_SECRET_KEY ||= "test_clerk_secret";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||= "test_clerk_pub";
process.env.RAZORPAY_KEY_ID ||= "rzp_test_id";
process.env.RAZORPAY_KEY_SECRET ||= "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET ||= "rzp_test_webhook_secret";
process.env.SHIPROCKET_EMAIL ||= "test@example.com";
process.env.SHIPROCKET_PASSWORD ||= "test_password";
process.env.CLOUDINARY_CLOUD_NAME ||= "test_cloud";
process.env.CLOUDINARY_API_KEY ||= "test_key";
process.env.CLOUDINARY_API_SECRET ||= "test_secret";
