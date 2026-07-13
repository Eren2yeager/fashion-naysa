Backend plan

  0. Pre-flight (mandatory) — read node_modules/next/dist/docs/ for App Router API routes, Route Handlers, middleware. AGENTS.md
  says this Next is non-standard. Don't trust training data.

  1. Project structure (modules + features)
  src/lib/
    db/         # connect, models, queries
    auth/       # Clerk helpers + role guard
    payments/   # razorpay
    shipping/   # shiprocket
    media/      # cloudinary
    validation/ # zod schemas per feature
    errors/     # AppError + handler
  src/app/api/
    products/         [GET list, GET :id]
    cart/             [GET, POST, PATCH, DELETE]  # zustand-synced server snapshot optional
    wishlist/         [GET, POST, DELETE]
    orders/           [POST create, GET list, GET :id]
    checkout/         [POST razorpay order]
    webhooks/
      razorpay/       [POST]
      shiprocket/     [POST]
    admin/
      products/       CRUD
      orders/         list + status update
      coupons/        CRUD + validate
      uploads/        signed cloudinary
  src/middleware.ts   # Clerk + admin role guard

  2. DB layer + models (src/lib/db)
  - Mongoose (or driver — Mongoose for schema validation + zod interop)
  - connect() cached on global (dev hot reload safe)
  - Models: Product, Order, Coupon, Wishlist, User (mirror of Clerk)
  - Indexes: Product.slug unique, Order.userId+createdAt, Coupon.code unique, Wishlist.userId+productId unique

  3. Validation (src/lib/validation)
  - One zod schema per route input. Single source of truth — same schema reused client-side later.
  - All API routes: parse → validate → handle.

  4. Auth (src/lib/auth)
  - requireUser() — throws 401 if no Clerk session
  - requireAdmin() — checks sessionClaims.metadata.role === 'admin'
  - Webhooks skip auth, verify signatures instead

  5. Payments (src/lib/payments)
  - createOrder({ amount, currency, receipt }) — server-side
  - verifyWebhookSignature(rawBody, signature) — must re-check Razorpay docs
  - Order state machine: created → paid → fulfilled → shipped → delivered (or failed/refunded)
  - Money path — flag in commit summary

  6. Shipping (src/lib/shipping)
  - createShipment(order) → Shiprocket API
  - trackByAwb(awb) for status polling
  - Cron or webhook-driven sync to Order.tracking

  7. Media (src/lib/media)
  - signUploadParams({ folder, eager }) — server signs, client uploads direct
  - destroy(publicId) for admin deletes
  - Helpers for transform URLs (width, format, quality)

  8. Coupons
  - Validate against current product prices before apply (gotcha from CLAUDE.md)
  - Stack rules: stacksWith field on coupon, reject if conflict

  9. Error model
  - AppError class w/ status + code
  - Central handler in withApi(handler) wrapper → consistent JSON shape
  - 4xx/5xx with codes client can switch on

  10. Env
  - .env.local keys needed: MONGODB_URI, CLERK_*, RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET, SHIPROCKET_EMAIL/PASSWORD, CLOUDINARY_*
  - src/lib/env.ts — zod-validated env, fail-fast on boot

  11. Workflow per feature
  1. Read Next docs for the route type
  2. Define zod schema
  3. Model + query helper
  4. Route handler using withApi + requireUser/requireAdmin
  5. Lint
  6. Flag money paths in summary

  ---
  Order to build: env → db connect → models → auth helpers → error wrapper → products read API → admin product CRUD → coupons →
  cart/wishlist → orders + checkout → webhooks → shipping → media uploads.

  Skipping: Drop model (per your call), dedicated cron infra (use Vercel cron or external — flag later), per-feature test suite
  (add when each feature stabilizes, per CLAUDE.md "add when set up").