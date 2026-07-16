import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { ProfileCard } from "@/components/storefront/account/ProfileCard";
import { OrderCountLink } from "@/components/storefront/account/OrderCountLink";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-10">
      <h1 className="text-sm font-semibold tracking-widest uppercase text-foreground">
        My Account
      </h1>

      <ProfileCard user={user} />

      <nav aria-label="Account sections">
        <ul className="divide-y divide-border border border-border rounded">
          <li>
            <OrderCountLink user={user} />
          </li>
          <li>
            <Link
              href="/wishlist"
              className="flex items-center justify-between px-5 py-4 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <span className="font-medium">Wishlist</span>
              <span className="text-muted-foreground" aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link
              href="/shop"
              className="flex items-center justify-between px-5 py-4 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <span className="font-medium">Shop</span>
              <span className="text-muted-foreground" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="pt-2">
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
