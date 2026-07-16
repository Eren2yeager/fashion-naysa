import { TextReveal } from "@/components/ui/text-reveal";
import BrandPhilosophyImage from "./BrandPhilosophyImage";

const PROSE =
  "Naysa is built on a single conviction: what you wear shapes how you move through the world. Every silhouette is cut to carry you further — from the first fitting to the final hour of a long day.";

export default function BrandPhilosophy() {
  return (
    <section className="w-full bg-background">
      {/* Scroll-driven word reveal */}
      <TextReveal className="mx-auto">{PROSE}</TextReveal>

      {/* Editorial image with whileInView fadeUp — needs CC */}
      <div className="max-w-7xl mx-auto px-6 pb-24 md:px-12">
        <BrandPhilosophyImage />
      </div>
    </section>
  );
}
