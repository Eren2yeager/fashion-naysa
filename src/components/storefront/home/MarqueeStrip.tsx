"use client";

import { ScrollVelocityRow } from "@/components/ui/scroll-based-velocity";

export default function MarqueeStrip() {
  return (
    <section className="w-full overflow-hidden border-y border-border py-4">
      <ScrollVelocityRow baseVelocity={4}>
        <span className="mx-8 text-sm tracking-[0.4em] uppercase text-foreground/60">
          NAYSA WOMEN&apos;S WEAR
        </span>
      </ScrollVelocityRow>
    </section>
  );
}
