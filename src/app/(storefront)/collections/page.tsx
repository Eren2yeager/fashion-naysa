import type { Metadata } from "next";
import CollectionsSection from "@/components/storefront/home/CollectionsSection";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore Naysa's curated collections — from workday essentials to resort and evening styles.",
  openGraph: {
    title: "Collections — Naysa",
    description: "Explore Naysa's curated collections — from workday essentials to resort and evening styles.",
    url: "/collections",
    images: [
      { url: "/images/collection-soft.png", width: 1200, height: 630, alt: "Naysa Collections" },
    ],
  },
};

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-24 md:px-12">
        <p className="text-xs tracking-[0.4em] uppercase text-foreground/40 mb-2">
          Naysa
        </p>
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground uppercase">
          Collections
        </h1>
      </div>
      <CollectionsSection />
    </div>
  );
}
