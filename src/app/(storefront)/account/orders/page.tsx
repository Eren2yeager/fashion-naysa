import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { OrdersList } from "@/components/storefront/account/OrdersList";

export const metadata = { title: "My Orders" };

export default async function AccountOrdersPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/account/orders");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 space-y-4">
        <Link
          href="/account"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          ← Account
        </Link>
        <h1 className="text-sm font-semibold tracking-widest uppercase text-foreground">
          My Orders
        </h1>
      </div>
      <div className="space-y-4">
        <OrdersList user={user} />
      </div>
    </div>
  );
}
