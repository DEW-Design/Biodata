"use client";

import { useState } from "react";
import type React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "@untitledui/icons";
import { PageHeader } from "@/components/PageHeader";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ScaffoldCheckbox, ScaffoldLabel, ScaffoldNumberInput, SegmentedControl } from "@/components/scaffold/controls";
import { SpeciesPhotoCarousel } from "@/app/pages/_shared/map-search/species-photo-carousel";
import { isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";
import { cx } from "@/utils/cx";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">{label}</p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "arrows", label: "Arrows" },
  { key: "indicators", label: "Indicators" },
  { key: "vertical", label: "Vertical" },
  { key: "onPhoto", label: "On a photo" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

// The real interface of components/application/carousel/carousel-base.tsx, part by part.
const rootProps = [
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' },
  { name: "opts", type: "Embla options (loop, align, dragFree, ...)", default: "-" },
  { name: "plugins", type: "Embla plugins", default: "-" },
  { name: "setApi", type: "(api: CarouselApi) => void", default: "-" },
  { name: "...props", type: "div props (aria-label, tabIndex, className, ...)", default: "-" },
];
const partProps = [
  { part: "Content", name: "overflowHidden", type: "boolean", default: "true" },
  { part: "Item", name: "...props", type: "div props (aria-label, className, ...)", default: "-" },
  { part: "PrevTrigger, NextTrigger", name: "children", type: "ReactNode | ({ isDisabled, onClick }) => ReactNode", default: "-" },
  { part: "PrevTrigger, NextTrigger", name: "asChild", type: "boolean", default: "false" },
  { part: "PrevTrigger, NextTrigger", name: "className", type: "string | ({ isDisabled }) => string", default: "-" },
  { part: "IndicatorGroup", name: "children", type: "ReactNode | ({ index }) => ReactNode", default: "-" },
  { part: "Indicator", name: "index", type: "number", default: "required" },
  { part: "Indicator", name: "className", type: "string | ({ isSelected }) => string", default: "-" },
  { part: "Indicator", name: "asChild, isSelected, children, style", type: "as Trigger; isSelected overrides the carousel's own", default: "-" },
];

/** A neutral slide, the same size whatever is in the carousel. The demo content is placeholder tiles, not data. */
function Tile({ n, tall }: { n: number; tall?: boolean }) {
  return (
    <div className={cx("flex items-center justify-center rounded-xl bg-primary text-sm font-medium text-tertiary ring-1 ring-secondary ring-inset", tall ? "h-56" : "aspect-[16/9]")}>
      Slide {n}
    </div>
  );
}

const arrowChip = "absolute z-10 rounded-full shadow-sm disabled:pointer-events-none disabled:opacity-0";

/** The carousel as the demos draw it: the parts of `Carousel`, with `ButtonUtility` for an arrow and a plain dot for an indicator. */
function DemoCarousel({
  slides,
  orientation = "horizontal",
  arrows = true,
  indicators = true,
  loop = false,
}: {
  slides: number;
  orientation?: "horizontal" | "vertical";
  arrows?: boolean;
  indicators?: boolean;
  loop?: boolean;
}) {
  const vertical = orientation === "vertical";
  const [Prev, Next] = vertical ? [ChevronUp, ChevronDown] : [ChevronLeft, ChevronRight];
  return (
    <Carousel.Root key={`${slides}-${orientation}-${loop}`} orientation={orientation} opts={{ loop }} aria-label="Example slides" className={cx("font-barlow w-full", vertical ? "h-56" : "")}>
      <Carousel.Content className={vertical ? "h-56" : ""}>
        {Array.from({ length: slides }, (_, i) => (
          <Carousel.Item key={i} aria-label={`${i + 1} of ${slides}`} className={vertical ? "h-56 basis-auto" : ""}>
            <Tile n={i + 1} tall={vertical} />
          </Carousel.Item>
        ))}
      </Carousel.Content>

      {arrows && (
        <>
          <Carousel.PrevTrigger>
            {({ isDisabled, onClick }) => (
              <ButtonUtility icon={Prev} aria-label="Previous slide" isDisabled={isDisabled} onPress={onClick} className={cx(arrowChip, vertical ? "top-2 left-1/2 -translate-x-1/2" : "top-1/2 left-2 -translate-y-1/2")} />
            )}
          </Carousel.PrevTrigger>
          <Carousel.NextTrigger>
            {({ isDisabled, onClick }) => (
              <ButtonUtility icon={Next} aria-label="Next slide" isDisabled={isDisabled} onPress={onClick} className={cx(arrowChip, vertical ? "bottom-2 left-1/2 -translate-x-1/2" : "top-1/2 right-2 -translate-y-1/2")} />
            )}
          </Carousel.NextTrigger>
        </>
      )}

      {indicators && (
        <Carousel.IndicatorGroup className={cx("flex gap-2 [--hit-min:18px]", vertical ? "absolute top-1/2 right-3 -translate-y-1/2 flex-col" : "mt-4 justify-center")}>
          {({ index }) => <Carousel.Indicator key={index} index={index} className={({ isSelected }) => cx("hit-area size-2.5 cursor-pointer rounded-full transition duration-100 ease-linear outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2", isSelected ? "bg-brand-solid" : "bg-fg-quaternary hover:bg-fg-quaternary_hover")} />}
        </Carousel.IndicatorGroup>
      )}
    </Carousel.Root>
  );
}

export default function CarouselPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig.carousel;

  const defaults = { slides: 4, orientation: "horizontal" as "horizontal" | "vertical", arrows: true, indicators: true, loop: false };
  const [slides, setSlides] = useState(defaults.slides);
  const [orientation, setOrientation] = useState(defaults.orientation);
  const [arrows, setArrows] = useState(defaults.arrows);
  const [indicators, setIndicators] = useState(defaults.indicators);
  const [loop, setLoop] = useState(defaults.loop);

  const isDefault = slides === defaults.slides && orientation === defaults.orientation && arrows === defaults.arrows && indicators === defaults.indicators && loop === defaults.loop;
  const resetPreview = () => {
    setSlides(defaults.slides);
    setOrientation(defaults.orientation);
    setArrows(defaults.arrows);
    setIndicators(defaults.indicators);
    setLoop(defaults.loop);
  };

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Carousel"
        description="Pages through slides of one kind: swipe or drag, arrows, dot indicators, and the Left and Right arrow keys. Built on Embla, and headless: it draws nothing of its own, so an arrow is a ButtonUtility and an indicator is a dot you draw. There is no autoplay."
        actions={<ContextualConfigPanel slug="carousel" title="Carousel" sections={sectionToggles} />}
      />

      {/* ── Component Playground ── */}
      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance. The slides are placeholder tiles; the controls change how the parts are put together.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] flex-col items-center justify-center bg-primary_alt p-12"
                style={{ backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              >
                <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-md">
                  <DemoCarousel slides={slides} orientation={orientation} arrows={arrows} indicators={indicators} loop={loop} />
                </div>
              </div>

              <div className="flex flex-col gap-5 border-l border-secondary bg-primary p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">Controls</p>
                  <button type="button" onClick={resetPreview} disabled={isDefault} className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40">
                    Reset
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Orientation</ScaffoldLabel>
                  <SegmentedControl
                    options={[
                      { key: "horizontal", label: "Horizontal" },
                      { key: "vertical", label: "Vertical" },
                    ]}
                    value={orientation}
                    onChange={setOrientation}
                  />
                </div>

                <ScaffoldNumberInput label="Slides" value={slides} onChange={setSlides} min={2} max={8} />

                <div className="flex flex-col gap-3">
                  <ScaffoldCheckbox label="Arrows" checked={arrows} onChange={setArrows} />
                  <ScaffoldCheckbox label="Indicators" checked={indicators} onChange={setIndicators} />
                  <ScaffoldCheckbox label="Loop" checked={loop} onChange={setLoop} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Arrows ── */}
      {isFeatureEnabled(config, "arrows") && (
        <>
          <h2 className="text-balance">Arrows</h2>
          <p className="text-balance">
            <code>PrevTrigger</code> and <code>NextTrigger</code> hand a render function <code>isDisabled</code> and <code>onClick</code>, so the arrow is a real <code>ButtonUtility</code> (its hit area, focus ring and label come with it). An arrow
            that cannot go further is disabled; the demo hides it.
          </p>
          <Section label="Arrows over the slides">
            <div className="w-full max-w-md">
              <DemoCarousel slides={3} indicators={false} />
            </div>
          </Section>
        </>
      )}

      {/* ── Indicators ── */}
      {isFeatureEnabled(config, "indicators") && (
        <>
          <h2 className="text-balance">Indicators</h2>
          <p className="text-balance">
            <code>IndicatorGroup</code> calls its children once for each snap point with its <code>index</code>; each <code>Indicator</code> goes to that slide and marks the one showing with <code>aria-current</code>. Draw each dot with
            <code>hit-area</code> and tell the chosen one by colour, not by size, so the row does not move. Dots 8px apart are 18px from centre to centre, so the group caps the hit area at that (<code>[--hit-min:18px]</code>, CONTRACTS 2.16) and no two
            overlap; the arrows and the keys are the 40px way on.
          </p>
          <Section label="Dots under the slides">
            <div className="w-full max-w-md">
              <DemoCarousel slides={5} arrows={false} />
            </div>
          </Section>
        </>
      )}

      {/* ── Vertical ── */}
      {isFeatureEnabled(config, "vertical") && (
        <>
          <h2 className="text-balance">Vertical</h2>
          <p className="text-balance">
            <code>orientation=&quot;vertical&quot;</code> pages up and down. The slides need a height (the viewport&apos;s), and the arrow keys are still Left and Right.
          </p>
          <Section label="orientation=&quot;vertical&quot;">
            <div className="w-full max-w-md">
              <DemoCarousel slides={3} orientation="vertical" />
            </div>
          </Section>
        </>
      )}

      {/* ── On a photo ── */}
      {isFeatureEnabled(config, "onPhoto") && (
        <>
          <h2 className="text-balance">On a photo</h2>
          <p className="text-balance">
            How the Explore record summary card uses it (<code>SpeciesPhotoCarousel</code>): a square, full-width figure with round arrows at the sides, the position at the foot (&quot;2 of 4&quot;), and the photo&apos;s credit as an
            info icon in the corner. Pointing at the icon says who took the photo and under which licence; pressing it opens the photo&apos;s page. One photo is just the photo, with no arrows or position.
          </p>
          <Section label="Four photos of one species, each with its own credit">
            <div className="w-full max-w-xs overflow-hidden rounded-xl border border-secondary bg-primary">
              <SpeciesPhotoCarousel scientificName="Isoodon obesulus" alt="Southern Brown Bandicoot" />
            </div>
          </Section>
        </>
      )}

      {/* ── API ── */}
      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>Carousel.Root</code> holds the state and the keyboard; it is a <code>region</code> with <code>aria-roledescription=&quot;carousel&quot;</code> and gives each slide <code>role=&quot;group&quot;</code> and{" "}
        <code>aria-roledescription=&quot;slide&quot;</code>. Name the carousel (<code>aria-label</code>) and each slide (&quot;2 of 4&quot;). <code>useCarousel()</code> returns the state from inside a part: <code>selectedIndex</code>,{" "}
        <code>scrollSnaps</code>, <code>canScrollPrev</code>, <code>canScrollNext</code>, <code>scrollPrev</code>, <code>scrollNext</code>, <code>api</code>.
      </p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Root prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {rootProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Part</th>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {partProps.map((p) => (
            <tr key={`${p.part}-${p.name}`}>
              <td style={{ color: "var(--ui-text-secondary)" }}>{p.part}</td>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Behaviour</h2>
      <ul className="text-balance">
        <li>
          <strong>Keyboard.</strong> With focus inside the carousel (an arrow, a dot, or the region itself when it has <code>tabIndex=&#123;0&#125;</code>) the Left and Right arrow keys go to the previous and next slide.
        </li>
        <li>
          <strong>Reduced motion.</strong> When the person has asked for less motion, an arrow, a dot or a key jumps to the slide instead of animating (Embla&apos;s <code>jump</code>).
        </li>
        <li>
          <strong>No autoplay.</strong> Nothing moves until the person asks, and a slide is never taken away while it is being read.
        </li>
        <li>
          <strong>Changes from the ingested source</strong> (OVR-012), listed at the top of <code>carousel-base.tsx</code>: reduced motion, the indicator&apos;s label (&quot;Go to slide 1&quot;), a lint fix, <code>type=&quot;button&quot;</code> on
          the default trigger and indicator, and the index <code>IndicatorGroup</code> hands its children (it handed over each snap&apos;s position, so a dot went to the wrong slide).
        </li>
      </ul>

      {/* ── Usage ── */}
      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

<Carousel.Root aria-label="Photos">
  <Carousel.Content>
    {photos.map((photo, i) => (
      <Carousel.Item key={photo.src} aria-label={\`\${i + 1} of \${photos.length}\`}>
        <img src={photo.src} alt={photo.alt} className="w-full" />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  <Carousel.PrevTrigger>
    {({ isDisabled, onClick }) => <ButtonUtility icon={ChevronLeft} aria-label="Previous photo" isDisabled={isDisabled} onPress={onClick} />}
  </Carousel.PrevTrigger>
  <Carousel.NextTrigger>
    {({ isDisabled, onClick }) => <ButtonUtility icon={ChevronRight} aria-label="Next photo" isDisabled={isDisabled} onPress={onClick} />}
  </Carousel.NextTrigger>
</Carousel.Root>`}
            </code>
          </pre>
        </>
      )}

      {/* ── Figma ── */}
      {isFeatureEnabled(config, "figma") && (
        <>
          <h2 className="text-balance">Figma</h2>
          <p className="text-balance">No linked Figma file yet - this component was pulled in via the Untitled UI CLI, not designed in Figma first.</p>
        </>
      )}
    </div>
  );
}
