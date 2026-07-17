"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { slideInLeft } from "@/lib/animation-variants";

export default function SeasonalEditorial() {
  return (
    <section className="w-full overflow-hidden">
      {/* Full-width editorial image */}
      <div className="relative w-full aspect-16/7">
        <Image
          src="/images/seasonal-2026.png"
          alt="Naysa SSN°2026 — Cut for Movement, Made for Presence"
          fill
          className="object-cover object-top"
          sizes="100vw"
        />
        {/* Overlay text */}
        {/* <div className="absolute inset-0 flex items-end p-6 md:p-12 bg-linear-to-t from-black/60 to-transparent">
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AnimatedShinyText
              shimmerWidth={300}
              className="text-2xl font-bold tracking-tight uppercase text-white md:text-4xl xl:text-5xl max-w-none"
            >
              SSN°2026 / CUT FOR MOVEMENT, MADE FOR PRESENCE
            </AnimatedShinyText>
          </motion.div>
        </div> */}
      </div>
    </section>
  );
}
