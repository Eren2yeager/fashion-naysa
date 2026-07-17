import Image from "next/image";
import Link from "next/link";
import HeroHeadline from "./HeroHeadline"

export default function HeroSection() {
  return (
    <section data-nav-theme="dark" className="relative flex min-h-screen w-full items-end overflow-hidden bg-background">
      {/* Hero image */}
      <Image
        src="/images/hero-1.png"
        alt="Naysa – Dress With Intent"
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/40" />
      {/* Top gradient — ensures nav text is always legible over the image */}
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/50 to-transparent pointer-events-none z-1" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:px-12">
        <HeroHeadline />
        <p className="mt-4 text-sm tracking-widest uppercase text-foreground/70 max-w-xs">
          Premium women&apos;s wear — crafted with intention.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block border border-foreground px-8 py-3 text-xs tracking-widest uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
