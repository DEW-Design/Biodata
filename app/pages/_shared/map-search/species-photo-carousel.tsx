"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { speciesImages } from "@/app/pages/_shared/map-search/species-images";

/**
 * A species' reference photos as a square, full-width figure. One photo is just the photo; two or
 * more become a carousel: swipe or scroll, the arrow buttons, or the Left and Right arrow keys
 * (once the figure has focus). There is no autoplay, and moving between photos is instant when
 * reduced motion is on. The credit under the photo always belongs to the photo showing. Square so
 * a tall subject is not cut off by a wide strip; `object-cover` crops a landscape photo's sides,
 * not its centre.
 */
export function SpeciesPhotoCarousel({ scientificName, alt, className }: { scientificName: string; alt: string; className?: string }) {
  const images = speciesImages(scientificName);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }, [count]);

  // Keep the index in step with what is actually showing, however it was scrolled.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [count]);

  if (count === 0) return null;
  const current = images[Math.min(index, count - 1)];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (count < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  };

  const chip = "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-fg-quaternary shadow-sm outline-focus-ring transition duration-100 ease-linear before:absolute before:-inset-1.5 hover:bg-secondary hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-0";

  return (
    <figure className={cx("m-0 flex flex-col", className)}>
      <div
        role={count > 1 ? "group" : undefined}
        aria-roledescription={count > 1 ? "carousel" : undefined}
        aria-label={count > 1 ? `${alt}, photos` : undefined}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={onKeyDown}
        className="relative aspect-square min-h-[120px] w-full shrink overflow-hidden bg-secondary outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div ref={trackRef} className="flex size-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, i) => (
            <div key={image.src} role={count > 1 ? "group" : undefined} aria-roledescription={count > 1 ? "slide" : undefined} aria-label={count > 1 ? `${i + 1} of ${count}` : undefined} className="size-full shrink-0 snap-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export with local files */}
              <img src={image.src} alt={alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className="size-full object-cover" />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" disabled={index === 0} onClick={() => goTo(index - 1)} className={cx(chip, "left-2")}>
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Next photo" disabled={index === count - 1} onClick={() => goTo(index + 1)} className={cx(chip, "right-2")}>
              <ChevronRight className="size-4" />
            </button>
            <p aria-live="polite" className="absolute bottom-2 left-1/2 z-10 m-0 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-secondary tabular-nums shadow-sm">
              {index + 1} of {count}
            </p>
          </>
        )}
      </div>
      <figcaption className="shrink-0 px-4 pt-2 text-xs text-tertiary">
        Photo: {current.creator}, {current.licence},{" "}
        <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="underline outline-focus-ring underline-offset-2 hover:text-secondary focus-visible:outline-2">
          Atlas of Living Australia
        </a>
      </figcaption>
    </figure>
  );
}
