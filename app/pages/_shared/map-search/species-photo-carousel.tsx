"use client";

import { ChevronLeft, ChevronRight, InfoCircle } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Carousel, useCarousel } from "@/components/application/carousel/carousel-base";
import { cx } from "@/utils/cx";
import { speciesImages, type SpeciesImage } from "@/app/pages/_shared/map-search/species-images";

/**
 * A species' reference photos as a square, full-width figure. One photo is just the photo; two or
 * more become the design system's `Carousel`: swipe, the arrow buttons, or the Left and Right arrow
 * keys (once the figure has focus). There is no autoplay, and moving between photos is instant when
 * reduced motion is on (the Carousel's own). Square so a tall subject is not cut off by a wide strip;
 * `object-cover` crops a landscape photo's sides, not its centre.
 *
 * The credit is inside the photo, as an info icon at its foot (designer, 25 Oct 2026: it was a
 * caption under the photo). Pointing at it or focusing it says who took the photo, under what
 * licence and where from; pressing it opens the photo's own page on the Atlas of Living Australia,
 * which is where the full licence sits. The credit always belongs to the photo showing.
 */
export function SpeciesPhotoCarousel({ scientificName, alt, className }: { scientificName: string; alt: string; className?: string }) {
  const images = speciesImages(scientificName);
  const count = images.length;
  if (count === 0) return null;

  const frame = cx("relative aspect-square min-h-[120px] w-full shrink overflow-hidden bg-secondary", className);

  if (count === 1) {
    return (
      <div className={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export with local files */}
        <img src={images[0].src} alt={alt} loading="eager" decoding="async" draggable={false} className="size-full object-cover" />
        <PhotoCredit image={images[0]} />
      </div>
    );
  }

  return (
    <div className={frame}>
      <Carousel.Root aria-label={`${alt}, photos`} tabIndex={0} className="size-full outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2">
        <Carousel.Content className="h-full">
          {images.map((image, i) => (
            <Carousel.Item key={image.src} aria-label={`${i + 1} of ${count}`} className="h-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export with local files */}
              <img src={image.src} alt={alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className="size-full object-cover" />
            </Carousel.Item>
          ))}
        </Carousel.Content>

        <Carousel.PrevTrigger>
          {({ isDisabled, onClick }) => (
            <ButtonUtility icon={ChevronLeft} aria-label="Previous photo" isDisabled={isDisabled} onPress={onClick} className={cx(arrow, "left-2")} />
          )}
        </Carousel.PrevTrigger>
        <Carousel.NextTrigger>
          {({ isDisabled, onClick }) => (
            <ButtonUtility icon={ChevronRight} aria-label="Next photo" isDisabled={isDisabled} onPress={onClick} className={cx(arrow, "right-2")} />
          )}
        </Carousel.NextTrigger>

        <Position images={images} />
        <ShowingCredit images={images} />
      </Carousel.Root>
    </div>
  );
}

// A round chip that sits over the photo, at the middle of its edge. It goes (not just fades) at the end of the photos, as it did.
const arrow = "absolute top-1/2 z-10 -translate-y-1/2 rounded-full shadow-sm disabled:pointer-events-none disabled:opacity-0";

/** "1 of 4", for the photo showing; read out as it changes. */
function Position({ images }: { images: SpeciesImage[] }) {
  const { selectedIndex } = useCarousel();
  return (
    <p aria-live="polite" className="absolute bottom-2 left-1/2 z-10 m-0 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-secondary tabular-nums shadow-sm">
      {selectedIndex + 1} of {images.length}
    </p>
  );
}

/** The credit of the photo that is showing. */
function ShowingCredit({ images }: { images: SpeciesImage[] }) {
  const { selectedIndex } = useCarousel();
  return <PhotoCredit image={images[Math.min(selectedIndex, images.length - 1)]} />;
}

/**
 * The credit as an info icon over the photo's foot, on the right. Pointing at it or focusing it opens
 * the design system's tooltip in its two-line form: the creator in bold, and under it, in the
 * supporting colour, the licence and the source. The tooltip opens above the icon with its right edge
 * on the icon's (`crossOffset` 0, no arrow to balance), so it sits over the photo and stays inside the card (it is at most as wide as its
 * longest line, about 200px, in a card of 320px). The licence never breaks across lines ("CC BY-NC"
 * is one word). Pressing the icon opens the photo's page on ALA. The accessible name is the whole
 * sentence, so a screen reader hears the credit when it lands on it.
 */
function PhotoCredit({ image }: { image: SpeciesImage }) {
  return (
    <Tooltip
      title={`Photo: ${image.creator}`}
      description={
        <>
          <span className="whitespace-nowrap">{image.licence}</span>, Atlas of Living Australia
        </>
      }
      placement="top end"
      offset={4}
      crossOffset={0}
    >
      <ButtonUtility
        icon={InfoCircle}
        size="xs"
        href={image.sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Photo: ${image.creator}, ${image.licence}, Atlas of Living Australia (opens the photo's page)`}
        className="absolute right-2 bottom-2 z-10 rounded-full shadow-sm"
      />
    </Tooltip>
  );
}
