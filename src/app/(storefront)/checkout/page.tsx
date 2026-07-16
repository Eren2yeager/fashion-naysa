import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import CheckoutPage from "@/components/storefront/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/checkout");
  return <CheckoutPage user={user} />;
}
