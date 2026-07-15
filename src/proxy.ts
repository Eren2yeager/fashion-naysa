// ponytail: auth gating lives inside each route via requireUser/requireAdmin
// (see route.md and AGENTS.md: "always verify auth inside each server function").
// Proxy here only does lightweight redirects for unauthenticated storefront pages.
// API routes return JSON 401 themselves — we don't gate /api/* here.
// Next.js 16 renamed `middleware` to `proxy`; see
// node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md.
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const isAdminPage = (path: string) => path === "/admin" || path.startsWith("/admin/");
const isStoreAuthWall = (path: string) =>
  path === "/checkout" || path.startsWith("/checkout/") ||
  path === "/account"  || path.startsWith("/account/");

const isProtectedPage = (path: string) => isAdminPage(path) || isStoreAuthWall(path);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!isProtectedPage(pathname)) return;
  if (req.auth) return; // session present — let it through
  // No session: bounce to the sign-in page with a callbackUrl.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    // Run on all paths except _next and static files. API routes included
    // so this runs for /api/* too, but the body is a no-op for /api/*
    // (we never redirect those).
    "/((?!_next|.*\\..*).*)",
  ],
};
