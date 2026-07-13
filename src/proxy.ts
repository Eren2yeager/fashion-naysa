// ponytail: auth gating lives inside each route via requireUser/requireAdmin
// (see route.md and AGENTS.md: "always verify auth inside each server function").
// Proxy here only does lightweight redirects for unauthenticated storefront pages.
// API routes return JSON 401 themselves — never auth.protect() on /api.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminPage = createRouteMatcher(["/admin(.*)"]);
const isStoreAuthWall = createRouteMatcher([
  "/checkout(.*)",
  "/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminPage(req)) await auth.protect();
  if (isStoreAuthWall(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Run on all paths except _next and static files. API routes included
    // so that auth.protect can run for admin pages served under /admin/...
    // (we don't call protect on /api/* — each route does its own gating).
    "/((?!_next|.*\\..*).*)",
  ],
};
