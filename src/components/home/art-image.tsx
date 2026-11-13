import type { ArtImage as Art } from "@/content/landing-art";

/**
 * A studio render. A plain <img> with its own srcset: the files are already sized and compressed WebP,
 * so sending them through the image optimizer would only re-encode them.
 */
export function ArtImage({
  image,
  alt,
  sizes = "(min-width: 768px) 50vw, 100vw",
  priority = false,
  small = false,
  className = "",
}: {
  image: Art;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** For tiles and menus: starts at the thumbnail instead of the large files. */
  small?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-built WebP files with their own srcset
    <img
      src={small ? image.srcSmall : image.src}
      srcSet={small ? `${image.thumb} 240w, ${image.srcSmall} 800w` : `${image.srcSmall} 800w, ${image.src} 1600w`}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}

/** A render in a block of its own, with the small lift it gets when its card is hovered. */
export function ArtFigure({
  image,
  alt,
  sizes,
  className = "",
  imageClassName = "",
}: {
  image: Art;
  alt: string;
  sizes?: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <figure className={`flex flex-col ${className}`} data-testid="art-figure">
      <ArtImage image={image} alt={alt} sizes={sizes} className={`art-float h-auto w-full ${imageClassName}`} />
    </figure>
  );
}
