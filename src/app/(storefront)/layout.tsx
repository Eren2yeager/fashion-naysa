import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import LenisProvider from "@/components/storefront/layout/LenisProvider";
import StorefrontNav from "@/components/storefront/layout/StorefrontNav";
import CartDrawer from "@/components/storefront/layout/CartDrawer";
import StorefrontFooter from "@/components/storefront/layout/StorefrontFooter";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <LenisProvider>
        <StorefrontNav />
        <CartDrawer />
        <main className="flex flex-col flex-1">{children}</main>
        <StorefrontFooter />
      </LenisProvider>
    </SessionProvider>
  );
}
