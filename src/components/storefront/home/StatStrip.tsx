"use client";

import { motion } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { staggerContainer, fadeUp } from "@/lib/animation-variants";

const STATS: { value: number; suffix: string; prefix?: string }[] = [
  { value: 73, suffix: "PRODUCTS" },
  { value: 6,  suffix: "COLLECTIONS", prefix: "0" },
  { value: 5,  suffix: "YEARS EXPERIENCE", prefix: "0" },
];

export default function StatStrip() {
  return (
    <section className="w-full border-y border-border bg-background">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-20 md:px-12 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border"
      >
        {STATS.map((stat) => (
          <motion.div
            key={stat.suffix}
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-2 py-12 md:py-0"
          >
            <p className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
              {stat.prefix ?? ""}
              <NumberTicker value={stat.value} />
              +
            </p>
            <p className="text-xs tracking-[0.3em] uppercase text-foreground/50">
              {stat.suffix}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
