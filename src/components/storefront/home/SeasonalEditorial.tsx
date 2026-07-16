"use client";

import { motion } from "motion/react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { slideInLeft } from "@/lib/animation-variants";

export default function SeasonalEditorial() {
  return (
    <section className="w-full bg-background border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 md:px-12">
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <AnimatedShinyText
            shimmerWidth={300}
            className="text-2xl font-bold tracking-tight uppercase md:text-4xl xl:text-5xl max-w-none"
          >
            SSN°2026 / CUT FOR MOVEMENT, MADE FOR PRESENCE
          </AnimatedShinyText>
        </motion.div>
      </div>
    </section>
  );
}
