import CollectionsSection from "@/components/storefront/home/CollectionsSection";

export const metadata = {
  title: "Collections — Naysa",
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
