import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Product — Naysa Admin",
  description: "Add a new product to the Naysa catalogue.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
