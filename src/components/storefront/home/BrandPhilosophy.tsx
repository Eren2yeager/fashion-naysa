import { TextReveal } from "@/components/ui/text-reveal";
import BrandPhilosophyImage from "./BrandPhilosophyImage";

const PROSE =
  "Naysa is built on a single conviction: what you wear shapes how you move through the world. Every silhouette is cut to carry you further — from the first fitting to the final hour of a long day.";

export default function BrandPhilosophy() {
  return (
    <section className="w-full bg-background">
      {/* Keep reveal effect, but shorten pinned range so page no longer feels stuck here. */}
      <TextReveal
        className="mx-auto"
        sectionClassName="h-[160vh]"
        stickyClassName="top-8 h-auto min-h-[60vh] items-start px-6 pt-20 pb-12 md:top-12 md:min-h-[70vh] md:px-12 md:pt-24 md:pb-16"
      >
        {PROSE}
      </TextReveal>

      {/* Editorial image with whileInView fadeUp — needs CC */}
      <div className="max-w-7xl mx-auto px-6 pb-24 md:px-12">
        <BrandPhilosophyImage />
      </div>
    </section>
  );
}
