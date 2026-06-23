import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

export const SITE_PHOTOS = {
  heroHouse: {
    src: "/site-photos/hero-house-sail.jpg",
    alt: "Large cream shade sail installed over a residential patio beside a brick house.",
  },
  terracePatio: {
    src: "/site-photos/patio-terrace-sail.jpg",
    alt: "Tensioned sand-colour shade sail over a furnished terrace with garden planting.",
  },
  courtyard: {
    src: "/site-photos/courtyard-sail.jpg",
    alt: "Wide shade sail spanning a bright courtyard beside a stone-clad home.",
  },
  garden: {
    src: "/site-photos/garden-sail.jpg",
    alt: "Freestanding charcoal shade sail stretched above a garden seating area.",
  },
  galleryPool: {
    src: "/site-photos/gallery-pool-hero.jpg",
    alt: "Sand-colour shade sail covering a landscaped pool terrace in Cape Town.",
  },
  howItWorks: {
    src: "/site-photos/how-it-works-hero.jpg",
    alt: "Installer tensioning a charcoal shade sail with stainless steel hardware.",
  },
  tensionHardware: {
    src: "/site-photos/tension-hardware.jpg",
    alt: "Close-up of shade sail fixings with turnbuckle, chain, and stainless anchor hardware.",
  },
  quotePatio: {
    src: "/site-photos/quote-patio.jpg",
    alt: "Complete charcoal shade sail installation over a timber dining patio.",
  },
  quotePatioBlack: {
    src: "/site-photos/quote-patio-black.jpg",
    alt: "Black shade sail installation over a contemporary outdoor patio.",
  },
  quotePatioSand: {
    src: "/site-photos/quote-patio-sand.jpg",
    alt: "Sand-colour shade sail installation brightening a residential patio.",
  },
  quotePatioSilver: {
    src: "/site-photos/quote-patio-silver.jpg",
    alt: "Silver shade sail installation above a light outdoor entertaining area.",
  },
  standard: {
    src: "/site-photos/standard-sail.jpg",
    alt: "Sand-colour Standard shade sail over a sheltered family patio.",
  },
  extreme: {
    src: "/site-photos/extreme-sail.jpg",
    alt: "Reinforced charcoal Extreme shade sail on an exposed coastal terrace.",
  },
} as const;

export const QUOTE_PHOTOS_BY_COLOUR = {
  Black: SITE_PHOTOS.quotePatioBlack,
  Charcoal: SITE_PHOTOS.quotePatio,
  Sand: SITE_PHOTOS.quotePatioSand,
  Silver: SITE_PHOTOS.quotePatioSilver,
} as const;

export const GALLERY_CARD_FALLBACKS = [
  SITE_PHOTOS.heroHouse,
  SITE_PHOTOS.terracePatio,
  SITE_PHOTOS.garden,
  SITE_PHOTOS.courtyard,
  SITE_PHOTOS.galleryPool,
  SITE_PHOTOS.standard,
  SITE_PHOTOS.extreme,
  SITE_PHOTOS.quotePatioBlack,
  SITE_PHOTOS.quotePatioSand,
  SITE_PHOTOS.quotePatioSilver,
] as const;

export const PHOTO_CREDIT_LINKS = [
  {
    label: "Sonnensegel Terrasse — Segelmacherei Z-LINE",
    href: "https://commons.wikimedia.org/wiki/File:Sonnensegel_Terrasse.jpg",
  },
  {
    label: "Ombrage terrasse — Frlafarge",
    href: "https://commons.wikimedia.org/wiki/File:Ombrage_terrasse_.jpg",
  },
  {
    label: "Voile d'ombrage — Frlafarge",
    href: "https://commons.wikimedia.org/wiki/File:Voile_d%27ombrage.jpg",
  },
  {
    label: "Sonnensegel-Freistehend — Segelmacherei Z-LINE",
    href: "https://commons.wikimedia.org/wiki/File:Sonnensegel-Freistehend.jpg",
  },
] as const;

type Photo = (typeof SITE_PHOTOS)[keyof typeof SITE_PHOTOS];

export function PageHero({
  photo,
  eyebrow,
  title,
  description,
  objectPosition = "center",
}: {
  photo: Photo;
  eyebrow: string;
  title: string;
  description: string;
  objectPosition?: CSSProperties["objectPosition"];
}) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "clamp(390px, 43vw, 520px)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(18,28,38,.94) 0%, rgba(28,39,51,.82) 42%, rgba(28,39,51,.28) 75%, rgba(28,39,51,.12) 100%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1240, margin: "0 auto", padding: "72px 28px" }}>
        <div style={{ maxWidth: 650 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display" style={{ fontSize: "clamp(34px,5vw,56px)", margin: "12px 0 10px", color: "#fff" }}>
            {title}
          </h1>
          <p style={{ fontSize: 18, color: "#dfe6eb", maxWidth: 600, margin: 0, lineHeight: 1.65 }}>
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PhotoFrame({
  photo,
  alt,
  priority,
  sizes = "100vw",
  style,
  imageStyle,
  overlay,
  className,
  children,
}: {
  photo: Photo;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  overlay?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <Image
        src={photo.src}
        alt={alt || photo.alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: "cover", ...imageStyle }}
      />
      {overlay ? (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: overlay }}
        />
      ) : null}
      {children ? (
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      ) : null}
    </div>
  );
}
