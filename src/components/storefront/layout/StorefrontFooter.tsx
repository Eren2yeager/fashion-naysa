import Link from "next/link";

const LINKS = {
  Shop: [
    { label: "New Arrivals", href: "/shop?tag=new-arrivals" },
    { label: "Dresses", href: "/shop?tag=dresses" },
    { label: "Tailoring", href: "/shop?tag=tailoring" },
    { label: "Knitwear", href: "/shop?tag=knitwear" },
  ],
  Brand: [
    { label: "About NAYSA", href: "/brand/about" },
    { label: "Journal", href: "/brand/journal" },
    { label: "Studio", href: "/brand/studio" },
    { label: "Sustainability", href: "/brand/sustainability" },
  ],
  Support: [
    { label: "Size Guide", href: "/support/size-guide" },
    { label: "Shipping", href: "/support/shipping" },
    { label: "Returns", href: "/support/returns" },
    { label: "Contact", href: "/support/contact" },
  ],
  Social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "Newsletter", href: "/newsletter" },
  ],
} as const;

export default function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {(Object.entries(LINKS) as [string, readonly { label: string; href: string }[]][]).map(
            ([group, links]) => (
              <div key={group}>
                <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-foreground">
                  {group}
                </h3>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
        <div className="mt-16 border-t border-border pt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} NAYSA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
