@AGENTS.md

# Nayasa

Premium girls' shirt e-commerce brand site. Client freelance project. Focus: fast, elegant, conversion-friendly storefront with a weekly drop model , client wants a CMS too.

## Stack
- Next.js (App Router) + TypeScript
- MongoDB
- bun.js manager
- Razorpay (payments)
- Clerk for auth
- Shiprocket for delivery
- Cloudinary (media)
- Zod Validation
- Zustand store
- UI: shadcn/ui + Aceternity UI + Magic UI + Reactbits
- Design tokens: OKLCH color system
- Scroll/Slide Animations: motion + lenis

## Commands
```
bun run dev        # dev server
bun run build       # production build
bun run lint         # eslint
bun run test        # if/when test suite exists — add real command here once set up
```

## Architecture
- `/app` — routes (App Router). Storefront, admin, and API routes are separated under `/app/(storefront)`, `/app/admin`, `/app/api`.
- `/lib/razorpay/` — payment order creation, webhook verification. Never touch signature verification logic without re-checking Razorpay docs.
- `/lib/cloudinary/` — upload + transform helpers.
- `/lib/db/` — Mongo connection + models (products, drops, coupons, wishlist, orders).
- `/components/ui/` — shadcn primitives, don't hand-edit generated files; regenerate via CLI instead.
- `/styles/globals.css` — OKLCH design tokens. All colors must reference tokens, no hardcoded hex in components.

  use modules and features

## Domain terms
- **Creator content** — UGC/influencer content blocks tied to specific products, shown on PDP.
- **Wishlist** — persists per logged-in user; not a cart.

## Workflow rules
- One logical change per commit, descriptive messages.
- Never commit `.env.local` or Cloudinary/Razorpay secrets.
- Run lint before considering a task done.
- For anything touching payments, flag it in the summary — these are client-money-sensitive paths.

## Known gotchas
- Coupon logic must stack correctly with drop pricing — validate against both before applying.

## Don'ts
- Don't paste large code blocks into this file — point to the file instead.
- Don't use CommonJS (`require`) — ES modules only.


@server.plan.md