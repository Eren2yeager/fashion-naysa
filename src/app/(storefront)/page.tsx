import type { Metadata } from "next";
import HeroSection from "@/components/storefront/home/HeroSection";
import MarqueeStrip from "@/components/storefront/home/MarqueeStrip";
import BrandPhilosophy from "@/components/storefront/home/BrandPhilosophy";
import StatStrip from "@/components/storefront/home/StatStrip";
import FeaturedProducts from "@/components/storefront/home/FeaturedProducts";
import CollectionsSection from "@/components/storefront/home/CollectionsSection";
import SeasonalEditorial from "@/components/storefront/home/SeasonalEditorial";
import SocialFollow from "@/components/storefront/home/SocialFollow";

export const metadata: Metadata = {
  title: "Naysa — Premium Girls' Shirts",
  description:
    "Discover Naysa's curated collections of premium shirts for girls — crafted with care, designed to last.",
  openGraph: {
    title: "Naysa — Premium Girls' Shirts",
    description:
      "Discover Naysa's curated collections of premium shirts for girls — crafted with care, designed to last.",
    url: "/",
    images: [
      {
        url: "/images/hero-1.png",
        width: 1200,
        height: 630,
        alt: "Naysa — Premium Girls' Shirts",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <BrandPhilosophy />
      <StatStrip />
      <FeaturedProducts />
      <CollectionsSection />
      <SeasonalEditorial />
      <SocialFollow />
    </>
  );
}
