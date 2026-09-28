"use client";

import type { FC } from "react";
import { cx } from "@/utils/cx";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";

/**
 * A species' reference photo at a fixed size (so nothing shifts as it loads), or, when there is no
 * usable photo for it, its group icon on a neutral tile at the same size. The alt text is the
 * common name, so the photo is announced as the animal or plant it shows. Credit is not drawn
 * here: wherever the photo is large enough to read, the caller shows it (`speciesImage(...)`).
 */
export function SpeciesPhoto({
  scientificName,
  alt,
  fallbackIcon: FallbackIcon,
  className,
}: {
  scientificName: string;
  alt: string;
  fallbackIcon: FC<{ className?: string }>;
  className?: string;
}) {
  const image = speciesImage(scientificName);
  if (!image) {
    return (
      <span className={cx("flex shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary", className)}>
        <FallbackIcon className="size-1/2" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export with local files; sizes are fixed by the caller
    <img src={image.src} alt={alt} loading="lazy" decoding="async" className={cx("shrink-0 rounded-lg bg-secondary object-cover outline -outline-offset-1 outline-black/10", className)} />
  );
}
