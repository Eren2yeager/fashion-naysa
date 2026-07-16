import HeroSection from "@/components/storefront/home/HeroSection";
import MarqueeStrip from "@/components/storefront/home/MarqueeStrip";
import BrandPhilosophy from "@/components/storefront/home/BrandPhilosophy";
import StatStrip from "@/components/storefront/home/StatStrip";
import FeaturedProducts from "@/components/storefront/home/FeaturedProducts";
import CollectionsSection from "@/components/storefront/home/CollectionsSection";
import SeasonalEditorial from "@/components/storefront/home/SeasonalEditorial";
import SocialFollow from "@/components/storefront/home/SocialFollow";

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
