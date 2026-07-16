"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/animation-variants";

export default function BrandPhilosophyImage() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative aspect-[16/9] w-full overflow-hidden"
    >
      <Image
        src="/images/brand-editorial.png"
        alt="Naysa brand editorial"
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 100vw, 1280px"
      />
    </motion.div>
  );
}
