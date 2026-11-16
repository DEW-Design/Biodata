"use client";

import { Suspense, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { SegmentedControl } from "@/components/scaffold/controls";
import { Check, Plus } from "@untitledui/icons";

// LAB: typography, before and after. Today every DEW component is Barlow (`font-barlow`, CONTRACTS 2.2). The question: titles in Barlow and
// body text in Aptos. Three views:
//   A  Before: the real screen, Barlow throughout (nothing changed).
//   B  After: the same real screen, headings Barlow, everything else Aptos.
//   C  Side by side: a type specimen of real components at true size, Barlow beside Aptos, so the two can be read next to each other.
//
// How "after" is made, and why it touches nothing in the product. Every component sets its font through the `font-barlow` utility, which reads
// the `--font-barlow` variable, so changing that variable on a wrapper changes the typeface for everything inside it, with no component edited.
// A title is a real heading element on these screens (the page title is an h1, a section an h2, a card an h3), so headings are put back on the
// original value (`--type-title`, taken before the change). The one exception that is not a heading is the "BioData SA" wordmark in the header,
// which is the brand and is kept in Barlow. The real screens are framed (same origin) and the rule is added to the frame's own document as a style element.
//
// Aptos is read from the machine: it is a Microsoft font with no web licence in this repo, so nothing is downloaded or shipped, and a machine
// without it falls back to Segoe UI or the system font (the lab says so). Aptos has Light, Regular, SemiBold and Bold, and no Medium, so text the
// product sets at 500 draws at Regular, and `font-synthesis: none` (globals.css) stops the browser faking one.
//
// Numbers are Aptos Mono with a slashed zero (designer, 13 Nov 2026). They are done with a font-face that is only the digits (`unicode-range`
// U+0030-0039) over the installed Aptos Mono, so every digit in a sentence, an ID, a date or a phone number takes it and the rest of the line stays
// Aptos, with no component edited; the stack puts it first, in the body and in headings (a number in a title is a number). The slashed zero is the
// font's own `zero` feature, set once on the scope so it is inherited. Aptos Mono has Regular and Bold only: digits in 400 and 500 text draw Regular,
// and in 600 and 700 text draw Bold, which is heavier than the Aptos SemiBold beside them. The comma, point and slash inside a number stay Aptos.
const APTOS = '"Aptos", "Segoe UI", system-ui, sans-serif';
const DIGITS = '"Aptos Digits"';
const DIGIT_FACES = `
@font-face { font-family: "Aptos Digits"; src: local("Aptos Mono"), local("Aptos-Mono"); font-weight: 100 599; unicode-range: U+0030-0039; }
@font-face { font-family: "Aptos Digits"; src: local("Aptos Mono Bold"), local("Aptos-Mono-Bold"); font-weight: 600 900; unicode-range: U+0030-0039; }
`;

/** The rule for the "after": the variable is changed on the body, headings (and the header's wordmark, a `p` with `tracking-tight`, the only brand mark) go back to the face the body had. */
const afterCss = (title: string) => `${DIGIT_FACES}
:root { --type-title: ${DIGITS}, ${title}; }
html body[class] { --font-barlow: ${DIGITS}, ${APTOS}; font-feature-settings: "zero" 1; }
:is(h1, h2, h3, h4, h5, h6), header p[class*="tracking-tight"] { font-family: var(--type-title) !important; }
`;
// The frame's own Prototype tools bar is hidden: the lab has one, and two bars on one screen is noise.
const FRAME_CSS = `.fixed.touch-none.select-none { display: none !important; }`;

const OPTIONS = [
  { id: "before", label: "A: Before", description: "Barlow throughout, as today" },
  { id: "after", label: "B: After", description: "Barlow headings, Aptos body, Aptos Mono numbers" },
  { id: "side", label: "C: Side by side", description: "A type specimen, both at true size" },
];
type Option = "before" | "after" | "side";

const SCREENS = [
  { id: "project", label: "Project page", path: "/pages/project-list/adelaide-hills/project-details" },
  { id: "list", label: "Projects list", path: "/pages/project-list" },
  { id: "add", label: "Add project", path: "/pages/project-registration" },
] as const;
type ScreenId = (typeof SCREENS)[number]["id"];

/** Whether a font is installed here: one that is not drawn measures the same as the fallback. */
function hasFont(family: string): boolean {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return false;
  const sample = "mmmmmmmmmmlli";
  ctx.font = "72px serif";
  const fallback = ctx.measureText(sample).width;
  ctx.font = `72px "${family}", serif`;
  return ctx.measureText(sample).width !== fallback;
}

/** A real screen in a frame, as it is or with the "after" rule on its document. Only a style element is added to the frame: nothing on a node React draws is touched, because a changed attribute before hydration is a mismatch. */
function Frame({ path, after }: { path: string; after: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const apply = (): boolean => {
      const doc = ref.current?.contentDocument;
      if (!doc?.head || !doc.body || doc.readyState === "loading") return false;
      doc.getElementById("lab-frame-css")?.remove();
      const style = doc.createElement("style");
      style.id = "lab-frame-css";
      // The title face is what the body has before the change, read once from the frame's own stylesheet (the next/font family).
      const title = getComputedStyle(doc.body).getPropertyValue("--font-barlow");
      style.textContent = FRAME_CSS + (after ? afterCss(title) : "");
      doc.head.appendChild(style);
      return true;
    };
    // The frame loads after the lab does, so the rule is added as soon as its document can take it.
    const timer = window.setInterval(() => {
      if (apply()) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [after, path]);
  return (
    <iframe
      ref={ref}
      title={after ? "After: Barlow headings, Aptos body, Aptos Mono numbers" : "Before: Barlow throughout"}
      src={`${path}?userRole=biodata-admin`}
      className="h-full w-full rounded-lg border border-secondary bg-primary"
    />
  );
}

// ── The specimen ──

const SPECIMEN_ABSTRACT = "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network, tracking indicator species before and after prescribed burns.";

function Specimen({ label, aptos }: { label: string; aptos: boolean }) {
  // The same wrapper change as the frame's: the variable, and headings put back on the title face.
  const style = (aptos ? { "--font-barlow": `${DIGITS}, ${APTOS}`, fontFeatureSettings: '"zero" 1' } : undefined) as CSSProperties | undefined;
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div data-type-specimen={aptos ? "after" : "before"} style={style} className="font-barlow flex flex-col gap-6 rounded-xl border border-secondary bg-primary p-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
          <h1 className="m-0 text-2xl font-semibold text-primary">Adelaide Hills Bushland Survey</h1>
          <p className="m-0 max-w-prose text-sm text-tertiary">{SPECIMEN_ABSTRACT}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-semibold text-primary">Overview</h2>
          <div className="rounded-lg border border-secondary p-4">
            <h3 className="m-0 mb-3 text-sm font-semibold text-primary">Project details</h3>
            <dl className="m-0 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-tertiary">Short title</dt>
              <dd className="m-0 text-primary">Adelaide Hills Bushland Survey</dd>
              <dt className="text-tertiary">Project ID</dt>
              <dd className="m-0 text-primary tabular-nums">BD-5039</dd>
              <dt className="text-tertiary">Start date</dt>
              <dd className="m-0 text-primary tabular-nums">2 Nov 2025</dd>
              <dt className="text-tertiary">Project manager</dt>
              <dd className="m-0 text-primary">Maya Dewitt</dd>
              <dt className="text-tertiary">Project records</dt>
              <dd className="m-0 text-primary tabular-nums">28</dd>
              <dt className="text-tertiary">Contact number</dt>
              <dd className="m-0 text-primary tabular-nums">(08) 8388 4188</dd>
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-sm font-semibold text-primary">Contact</h3>
          <Input label="Contact email" hint="Shown to people who request access." placeholder="E.g., olivia@example.com" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="md" color="primary" iconLeading={Plus}>
            Add dataset
          </Button>
          <Button size="md" color="secondary" iconLeading={Check}>
            Approve
          </Button>
          <Badge color="success" size="md">
            Active
          </Badge>
          <Badge color="warning" size="md">
            Details needed
          </Badge>
        </div>
      </div>
    </section>
  );
}

function SideBySide() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-2">
      <Specimen label="Before: Barlow throughout" aptos={false} />
      <Specimen label="After: Barlow headings, Aptos body, Aptos Mono numbers" aptos />
    </div>
  );
}

function Lab() {
  const params = useSearchParams();
  const requested = params.get("option");
  const option: Option = (["before", "after", "side"] as const).find((o) => o === requested) ?? "after";
  const screenId: ScreenId = SCREENS.find((s) => s.id === params.get("screen"))?.id ?? "project";
  const screen = SCREENS.find((s) => s.id === screenId)!;
  // Read from the browser, so the server draws nothing for it (null) and the client the answer.
  const aptosHere = useSyncExternalStore(
    () => () => {},
    () => hasFont("Aptos"),
    () => null,
  );
  const monoHere = useSyncExternalStore(
    () => () => {},
    () => hasFont("Aptos Mono"),
    () => null,
  );

  const router = useRouter();

  return (
    <div className="font-barlow flex h-screen flex-col gap-4 bg-secondary p-6" style={{ "--type-title": "var(--font-barlow)" } as CSSProperties}>
      <PrototypeTools />
      {/* Headings in the lab's own chrome stay as they are; only what is inside the frames or the "after" specimen changes. */}
      <style>{`${DIGIT_FACES}[data-type-specimen="after"] :is(h1, h2, h3, h4, h5, h6) { font-family: ${DIGITS}, var(--type-title) !important; }`}</style>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-lg font-semibold text-primary">Typography, before and after</h1>
          <p className="m-0 max-w-prose text-sm text-balance text-tertiary">
            Headings in Barlow, everything else in Aptos, numbers in Aptos Mono with a slashed zero, on the real screens. Switch the view on the Prototype tools bar.
          </p>
          {option !== "before" && aptosHere && (
            <p className="m-0 max-w-prose text-sm text-balance text-tertiary">
              Aptos has no Medium weight, so text set at 500 (labels, buttons, table names) draws at Regular. Aptos Mono has Regular and Bold only, so a number in 600 text draws Bold.
            </p>
          )}
          {aptosHere && monoHere === false && (
            <p className="m-0 max-w-prose text-sm text-balance text-error-primary">Aptos Mono is not installed on this machine, so numbers are drawn in Aptos.</p>
          )}
          {aptosHere === false && (
            <p className="m-0 max-w-prose text-sm text-balance text-error-primary">Aptos is not installed on this machine, so the &quot;after&quot; is drawn in the fallback (Segoe UI or the system font).</p>
          )}
        </div>
        {option !== "side" && (
          <SegmentedControl
            options={SCREENS.map((s) => ({ key: s.id, label: s.label }))}
            value={screenId}
            onChange={(next) => router.push(`/proto/typography?option=${option}&screen=${next}`)}
          />
        )}
      </div>
      {option === "side" ? <SideBySide /> : <div className="min-h-0 flex-1"><Frame key={`${screenId}-${option}`} path={screen.path} after={option === "after"} /></div>}
      <LayoutOptionSwitcher ariaLabel="Typography views" current={option} options={OPTIONS.map((o) => ({ ...o, href: `/proto/typography?option=${o.id}&screen=${screenId}` }))} />
    </div>
  );
}

export default function TypographyLab(): ReactNode {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
