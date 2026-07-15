"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Map path segments to display labels
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Products",
  orders: "Orders",
  coupons: "Coupons",
  settings: "Settings",
  new: "New",
};

function buildBreadcrumbs(pathname: string) {
  // e.g. /admin/products/new → ["admin", "products", "new"]
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function AdminHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs.at(-1)?.label ?? "Admin";

  return (
    <header className={cn("h-14 items-center gap-4  bg-background px-6", className)}>
      {/* Page title */}
      {/* <h1 className="text-base font-semibold">{pageTitle}</h1> */}

      {/* Breadcrumb */}
      {crumbs.length > 1 && (
        <nav aria-label="Breadcrumb" className="ml-2">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground" role="list">
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {!crumb.isLast ? (
                  <>
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </>
                ) : (
                  <span className="text-foreground font-medium" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </header>
  );
}
