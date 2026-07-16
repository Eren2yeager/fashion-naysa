"use client";

import { motion } from "motion/react";
import { fadeUp } from "@/lib/animation-variants";

export default function HeroHeadline() {
  return (
    <motion.h1
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="text-5xl font-bold tracking-tighter uppercase text-foreground md:text-7xl xl:text-9xl"
    >
      DRESS WITH INTENT
    </motion.h1>
  );
}
