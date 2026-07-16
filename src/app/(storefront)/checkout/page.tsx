import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import CheckoutPage from "@/components/storefront/checkout/CheckoutPage";

export default async function CheckoutRoute() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?callbackUrl=/checkout");
  return <CheckoutPage user={user} />;
}
