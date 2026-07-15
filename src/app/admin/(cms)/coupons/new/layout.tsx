import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Coupon — Naysa Admin",
  description: "Create a new discount coupon.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
