"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { staggerContainer, fadeUp } from "@/lib/animation-variants";

const COLLECTIONS = [
  { tag: "resort",  label: "Resort Ease",     image: "/images/collection-resort.png" },
  { tag: "workday", label: "Workday Form",     image: "/images/collection-workday.jpg" },
  { tag: "evening", label: "Evening Line",     image: "/images/collection-evening.jpg" },
  { tag: "soft",    label: "Soft Structure",   image: "/images/collection-soft.jpg" },
] as const;

export default function CollectionsSection() {
  return (
    <section className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24 md:px-12">
        <h2 className="mb-12 text-xs tracking-[0.4em] uppercase text-foreground/50">
          Collections
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {COLLECTIONS.map((col) => (
            <motion.div key={col.tag} variants={fadeUp}>
              <Link href={`/shop?tag=${col.tag}`}>
                <CardContainer containerClassName="py-0">
                  <CardBody className="h-[480px] w-full relative">
                    <CardItem translateZ={20} className="w-full h-full">
                      <div className="relative h-full w-full overflow-hidden bg-muted">
                        <Image
                          src={col.image}
                          alt={col.label}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        />
                      </div>
                    </CardItem>
                    <CardItem
                      translateZ={40}
                      className="absolute bottom-4 left-4"
                    >
                      <p className="text-xs tracking-[0.3em] uppercase text-foreground bg-background/80 px-3 py-1">
                        {col.label}
                      </p>
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
