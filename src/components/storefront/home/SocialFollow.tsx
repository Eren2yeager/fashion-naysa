"use client";

import Image from "next/image";

const IG_IMAGES = [
  "/images/social-ig-1.png",
  "/images/social-ig-2.png",
  "/images/social-ig-3.png",
  "/images/social-ig-4.png",
  "/images/social-ig-5.png",
  "/images/social-ig-6.png",
] as const;

export default function SocialFollow() {
  return (
    <section className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24 md:px-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xs tracking-[0.4em] uppercase text-foreground/50">
            Follow @naysa
          </h2>
          <a
            href="https://instagram.com/naysa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase text-foreground/50 hover:text-foreground transition-colors"
          >
            Instagram ↗
          </a>
        </div>

        {/* Horizontally scrollable image strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {IG_IMAGES.map((src, i) => (
            <div
              key={src}
              className="relative aspect-square w-48 shrink-0 overflow-hidden bg-muted snap-start md:w-64"
            >
              <Image
                src={src}
                alt={`Naysa Instagram post ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 192px, 256px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
