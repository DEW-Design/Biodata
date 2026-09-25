"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Exploring how public-user's ("Guest User")
// dashboard becomes an account-creation nudge surface, per the user directly: "public-user is due
// in two days... the Hi Olivia gradient card on the registered user could be reused for guest
// users as well - as a way to nudge them to create an account... everything's gated. They can poke
// around the data, but not bring it over."
//
// Real base, real gate: renders the actual `DataOverviewContent` (app/pages/_shared/
// data-overview.tsx) unmodified - guests already see this exact "Flora and Fauna Dashboard" today
// (dashboard/page.tsx's own public-user branch), so "poke around the data" is a real, working
// screen here, not an invented one. The gating mechanism is the real `GuestActionButton`
// (app/pages/_shared/guest-action-gate.tsx) - already shipping for the header's "Add project"/
// "Upload dataset" - extended here with a third gated action, "Export data", which doesn't exist
// anywhere in the codebase yet. All three variants below reuse both real pieces verbatim; nothing
// in `app/pages/**` is touched by this lab.
//
// Icon rail/header are local stubs matching public-user's real IA (lib/registered-user-nav.ts's
// publicUserNav: Home, Projects, Observations, confirmed directly by the user against the real
// "Guest User" IA screenshot - Header: Login/Sign up, Home: BioData Dashboard, Projects: View
// Level 1 Public Project Data, Observations: View Level 1 Public Observation Data, Footer) and
// dashboard/page.tsx's real public-user header shape - same "each screen/lab keeps its own local
// copy of chrome" convention this codebase already follows.
//
// ROUND 3 (per the user directly, 2026-09-16): "the single hook bit is really nice... let's ditch
// the other two variants and keep exploring the single hook bit." Preview of Yours and Minimal Ask
// (round 2) are deleted, not just hidden - the picker only compares live directions. Single Hook
// (header + gradient banner + real `DataOverviewContent`) is now the fixed, shared base - see
// `SingleHookMain` below - and this round's own axis of variation is column 2, the contextual
// sidebar `registered-user` gets but `public-user` currently doesn't (per CONTEXT.md's "no aside
// for single-view guest sections" convention - true when that column had nothing to hold, not a
// permanent rule). Per the user directly: "the column 2 bit could have some elements that nudge
// the user to create a registered account... what's the incentive... let's look at patterns across
// other similar apps from /mobbin."
//
// Three column-2 treatments, each extracted as a pattern (not pixels) from a real Mobbin reference,
// each its own variant rather than folded into one design, per the user directly ("bring this in as
// separate variants"):
// - Benefits Checklist (https://mobbin.com/screens/5cc77338-12e6-4790-8eac-eacff1e0c4fe, komoot's
//   Premium panel; https://mobbin.com/screens/47bd1bfc-0bb4-4880-9300-58df8b978e9e, Fabric's Free-
//   plan panel): a scannable checklist of concrete, specific benefits - not marketing prose. The 4
//   items here are each a real gated action already on this page or its header (log an observation,
//   upload a dataset, register a project, export data), not invented capabilities.
// - Compact Promo (https://mobbin.com/screens/c271f591-c10b-4511-9690-a2825989fdf9, Codecademy's
//   sidebar trial card): a small, self-contained bordered card sized to the real 286px column,
//   one line of copy + one CTA - the lightest-weight of the three.
// - Curated + Convert (https://mobbin.com/screens/6695372c-4a24-4efc-ba07-2346f97f131e, Substack's
//   signed-out right column): pairs the Compact Promo card with real content underneath it (2 of
//   the same real Knowledge Base guides `home-dashboard.tsx` already shows registered-user - copied
//   locally, not exported, per this codebase's "each page/lab keeps its own local chrome" convention)
//   so the column earns its space even before anyone converts, not just holding a pitch.
//
// ROUND 4 (per the user directly): asked to explore "user delight" further after picking Curated +
// Convert as the strongest column-2 direction. Corrected mid-round - "Remember, this is a
// government service" - one of three proposed ideas (a "Join 3,482 people already contributing"
// social-proof pitch) was dropped for being a consumer growth-marketing pattern, not a fit for a
// government service's voice (see the `feedback_government_service_tone` memory). What shipped
// instead, both restrained/functional rather than "delightful":
// - The banner headline (`tabHeadlines` below) now reacts to whichever real `DataOverviewContent`
//   sub-tab a guest is actually browsing - relevance, not persuasion. Required a small, backward-
//   compatible extension to the real `DataOverviewContent` (app/pages/_shared/data-overview.tsx):
//   optional controlled `activeTab`/`onActiveTabChange` props, defaulting to its existing internal
//   `useState` when omitted, so every other current caller is unaffected.
// - Benefits Checklist's checkmarks and Curated + Convert's guide list get a minimal stagger-in
//   (`motion-safe:` only, so `prefers-reduced-motion` gets the static end-state immediately, no
//   animation) - one subtle pass, not a flourish.
//
// Known, deliberately NOT fixed in this proto: `DataOverviewContent` (rendered unmodified below
// every banner, real base per the brief) still shows its own "Projects" tab as an unscoped
// placeholder ("This tab hasn't been scoped yet") - an internal admission that shouldn't reach a
// public guest, banner choice aside. Also open: whether a guest's data view should be structurally
// smaller (fewer tabs/sections), not just gated - genuinely "sees less," not "sees the same, minus
// permission." Both are real, separate decisions from "which banner"/"what's in column 2" - flagged
// here, not solved by forking the whole shared component inside a throwaway proto.

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { Focusable, type Key } from "react-aria-components";
import { HomeLine, Folder, Eye, DownloadCloud02, ArrowNarrowRight, Camera01, Check, BookOpen01, FileCheck02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { GlobalSearch } from "@/app/pages/_shared/global-search";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { cx } from "@/utils/cx";
import { assetPath } from "@/lib/base-path";

// ── Shared stubs - real IA/header shape, not a design decision this lab is exploring ──

const publicSectionIcons = [HomeLine, Folder, Eye];

function GuestIconRailStub() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {publicSectionIcons.map((Icon, i) => (
        <div key={i} className={cx("flex size-12 items-center justify-center rounded-lg", i === 0 ? "bg-brand-solid text-white" : "text-quaternary")}>
          <Icon className="size-5" />
        </div>
      ))}
    </nav>
  );
}

interface GatedAction {
  icon: FC<{ className?: string }>;
  label: string;
  color: "primary" | "secondary";
  modalTitle: string;
  modalDescription: string;
}

// Real IA's actual header entry point (Header > Login / Sign up) - present on every variant below.
// Missing entirely from round 1's header stub, an oversight against both the source screenshot and
// the shipped `dashboard/page.tsx` (which renders this exact component for `isPublicUser`). Copied
// locally (it's a small, page-local component there too, not exported) - both disabled with a
// tooltip, same "no real auth flow yet, honest gap" convention as everywhere else in this build.
function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="secondary" isDisabled>Log in</Button>
          </span>
        </Focusable>
      </Tooltip>
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="primary" isDisabled>Sign up</Button>
          </span>
        </Focusable>
      </Tooltip>
    </div>
  );
}

// `actions` defaults to none - Minimal Ask passes nothing, relying on `GuestAuthActions` (always
// rendered) plus the banner as the only asks.
function GuestHeaderStub({ actions = [] }: { actions?: GatedAction[] }) {
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")}
          alt="Government of South Australia, Department for Environment and Water"
          className="h-[37px] w-auto"
        />
        <div className="h-6 w-px bg-secondary" />
        <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64 lg:w-[395px]">
          <GlobalSearch />
        </div>
        {actions.map((a) => (
          <GuestActionButton key={a.label} icon={a.icon} label={a.label} color={a.color} isGuest modalTitle={a.modalTitle} modalDescription={a.modalDescription} />
        ))}
        <GuestAuthActions />
      </div>
    </header>
  );
}

// "Add project"/"Upload dataset" removed from the global header per the user directly ("too many
// buttons at the top... let's get rid of create a project and upload a dataset here. We could have
// these when the user clicks on projects") - 5 controls plus search crowded the header on every
// single view, for actions that only make sense once a guest is actually looking at Projects.
// Not built yet: a real Projects section for this proto to surface them in contextually - flagged
// as the next step, not fabricated ahead of being asked. "Export data" stays here for now (not
// mentioned in the feedback) since it's a Home-level action (exporting the org-wide dashboard
// view), not Projects-specific the way the other two are.
const commonActions: GatedAction[] = [
  {
    icon: DownloadCloud02,
    label: "Export data",
    color: "secondary",
    modalTitle: "Sign up to export data",
    modalDescription: "Create a free BioData SA account to export records from South Australia's biodiversity dataset.",
  },
];

// ── Single Hook banner + real `DataOverviewContent` - the fixed base every column-2 variant below
// shares unchanged. Answers "what's the ONE thing a guest wants" directly with one concrete,
// IA-grounded action instead of abstract stats. Logging an observation is the actual core citizen-
// science action this IA's own "Observations" section exists for (View Level 1 Public Observation
// Data, in the real Guest User screenshot). Kept from round 2 per the user directly: "the single
// hook bit is really nice." Open question, still not resolved by this copy: does "spotted
// something? log it" speak to every guest, or just the field-observer persona?
//
// Flattened per the user directly ("thinking of removing box inside box design - you've violated
// the contract"): the hook used to wrap its icon+copy in its own bordered/bg-white/5 tile, itself
// sitting inside the gradient card - a card nested inside a card, real surface-stacking with no
// justification. Removed that tile and its own inner circular icon chip entirely; the icon and
// copy now sit directly on the gradient, the same way the heading above it already does - one
// surface, not two. ──
// Headline reacts to whichever real `DataOverviewContent` sub-tab a guest is actually looking at -
// relevance, not persuasion (see the government-service-tone note below). The underlying ask (log
// an observation) and its CTA stay fixed across tabs - only the opening line changes, so this
// doesn't fragment Single Hook into 4 different asks, it just sounds aware of what's on screen.
const tabHeadlines: Record<string, string> = {
  overview: "Spotted something out there?",
  flora: "Curious about local flora?",
  fauna: "Spotted a bird or mammal out there?",
  projects: "Curious about a project near you?",
};

function SingleHookMain() {
  // Lifted out of `DataOverviewContent` via its new optional controlled `activeTab`/
  // `onActiveTabChange` props (app/pages/_shared/data-overview.tsx) - added there as a backward-
  // compatible extension (every other caller still works unmodified, uncontrolled) rather than
  // forking the whole component just to read which tab is active.
  const [activeTab, setActiveTab] = useState<Key>("overview");

  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      <div className="p-6">
        <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-medium text-white">{tabHeadlines[String(activeTab)] ?? tabHeadlines.overview}</p>
            <p className="text-md text-white/80">You&apos;re browsing public data - sign up to log your own sightings.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5 text-md font-medium text-white">
                <Camera01 className="size-4 text-white/70" />
                Log an observation
              </span>
              <span className="text-sm text-white/60">Record a sighting, tag its location, attach a photo.</span>
            </div>
            <GuestActionButton
              icon={ArrowNarrowRight}
              label="Create a free account"
              color="secondary"
              isGuest
              modalTitle="Log your own observations"
              modalDescription="Create a free BioData SA account to start recording species sightings and attaching them to South Australia's biodiversity record."
            />
          </div>
        </div>
      </div>
      <DataOverviewContent activeTab={activeTab} onActiveTabChange={setActiveTab} />
    </main>
  );
}

// Same 286px contextual-sidebar shape `registered-user` already gets (dashboard/page.tsx's own
// `<aside>`) - `public-user` never had one, since Home/Projects are single-view sections with no
// switcher to hold (see CONTEXT.md). Repurposed here to hold the account-creation nudge instead of
// nav content, since that's the one real thing this column has to offer a guest right now.
function GuestSidebarStub({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Create an account" className="hidden w-[286px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
      {children}
    </aside>
  );
}

// ── Column 2, variant 1: Benefits Checklist - pattern from komoot's Premium panel
// (https://mobbin.com/screens/5cc77338-12e6-4790-8eac-eacff1e0c4fe) and Fabric's Free-plan panel
// (https://mobbin.com/screens/47bd1bfc-0bb4-4880-9300-58df8b978e9e): a scannable checklist of
// concrete, specific benefits, not marketing prose. Every item here is a real gated action already
// on this page or its header - none invented. ──
const accountBenefits = ["Log your own species observations", "Upload datasets to existing projects", "Register and manage your own projects", "Export records you find"];

// No CTA button in this card - the main banner's own "Create a free account" (next to "Log an
// observation") is already the one actionable ask on screen. Flagged directly by the user off a
// screenshot: this card's earlier copy ("Create a free account to contribute...") plus its own
// button duplicated the banner's identical pitch and button, both visible in the same viewport at
// once - exactly the "never restate the same fact in two different treatments" principle this
// codebase already documents elsewhere (CONTEXT.md's cognitive-load section). This card now states
// the "why" only; the "where you actually do it" stays singular, in the banner.
function SidebarBenefitsChecklist() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">Why create an account?</p>
        <p className="text-sm text-tertiary">A free BioData SA account unlocks:</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {accountBenefits.map((benefit, i) => (
          <li
            key={benefit}
            className="flex items-start gap-2 text-sm text-secondary motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:ease-out"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <Check className="mt-0.5 size-4 shrink-0 text-fg-success-primary" />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Column 2, variant 2: Compact Promo - pattern from Codecademy's sidebar trial card
// (https://mobbin.com/screens/c271f591-c10b-4511-9690-a2825989fdf9): a small, self-contained
// bordered card sized to the column, one line of copy, no second CTA (see the comment on
// `SidebarBenefitsChecklist` above - the banner's own button is the one actionable ask). Exported
// as its own component (not inlined) since Curated + Convert below reuses it verbatim, rather than
// repeating the same card with different values. ──
function SidebarCompactPromo() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-secondary bg-primary p-4">
      <p className="text-sm font-semibold text-primary">Get more from BioData SA</p>
      <p className="text-sm text-tertiary">A free account unlocks contributing your own observations, datasets, and projects.</p>
    </div>
  );
}

// Same two real Knowledge Base guides `home-dashboard.tsx` already shows registered-user - copied
// locally (that file doesn't export its own list), per this codebase's "each page/lab keeps its own
// local chrome" convention. Real, existing content, not invented for this column.
const guideLinks = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
];

// ── Column 2, variant 3: Curated + Convert - pattern from Substack's signed-out right column
// (https://mobbin.com/screens/6695372c-4a24-4efc-ba07-2346f97f131e): pairs the sign-up card with
// real content underneath it, so the column earns its space even before anyone converts, rather
// than holding only a pitch. ──
function SidebarCuratedConvert() {
  return (
    <div className="flex flex-col gap-6">
      <SidebarCompactPromo />
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Guides</p>
        {guideLinks.map((guide, i) => (
          <div
            key={guide.title}
            className="flex items-start gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:ease-out"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <guide.icon className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-primary">{guide.title}</p>
              <p className="text-xs text-tertiary">{guide.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantBenefitsChecklist() {
  return (
    <>
      <GuestSidebarStub>
        <SidebarBenefitsChecklist />
      </GuestSidebarStub>
      <SingleHookMain />
    </>
  );
}

function VariantCompactPromo() {
  return (
    <>
      <GuestSidebarStub>
        <SidebarCompactPromo />
      </GuestSidebarStub>
      <SingleHookMain />
    </>
  );
}

function VariantCuratedConvert() {
  return (
    <>
      <GuestSidebarStub>
        <SidebarCuratedConvert />
      </GuestSidebarStub>
      <SingleHookMain />
    </>
  );
}

const variants = [
  { name: "Benefits Checklist", render: VariantBenefitsChecklist },
  { name: "Compact Promo", render: VariantCompactPromo },
  { name: "Curated + Convert", render: VariantCuratedConvert },
];

// ── Picker chrome - copied verbatim from the prototype skill's PICKER.md, React-ified (same
// implementation as every other /proto lab in this codebase, e.g. admin-dashboard-options) ──
function Picker({ current, setCurrent }: { current: number; setCurrent: (i: number) => void }) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlightStyle, setHighlightStyle] = useState({ width: 0, x: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = itemRefs.current[current];
    if (el) setHighlightStyle({ width: el.offsetWidth, x: el.offsetLeft });
  }, [current]);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(raf1);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) setCurrent(num - 1);
      else if (e.key === "ArrowRight") setCurrent((current + 1) % variants.length);
      else if (e.key === "ArrowLeft") setCurrent((current - 1 + variants.length) % variants.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <nav
      aria-label="Prototype variants"
      data-ready={ready ? "" : undefined}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        borderRadius: 999,
        background: "rgba(10, 10, 10, 0.82)",
        backdropFilter: "blur(12px) saturate(1.4)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.12)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 4,
          left: 0,
          height: 28,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          width: highlightStyle.width,
          transform: `translateX(${highlightStyle.x}px)`,
          transition: ready ? "transform 250ms cubic-bezier(0.23,1,0.32,1), width 250ms cubic-bezier(0.23,1,0.32,1)" : "none",
        }}
      />
      {variants.map((v, i) => (
        <button
          key={v.name}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          data-active={i === current ? "" : undefined}
          aria-current={i === current ? "true" : undefined}
          onClick={() => setCurrent(i)}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: 28,
            padding: "0 12px",
            border: 0,
            borderRadius: 999,
            background: "transparent",
            color: i === current ? "#fff" : "rgba(255,255,255,0.55)",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          {v.name}
        </button>
      ))}
    </nav>
  );
}

// GuestActionButton reads the active role via useSearchParams, so the whole page needs a Suspense
// boundary to prerender (same pattern as the /pages/** shells).
export default function PublicUserExplorationsPage() {
  return (
    <Suspense fallback={null}>
      <PublicUserExplorationsProto />
    </Suspense>
  );
}

function PublicUserExplorationsProto() {
  const [current, setCurrent] = useState(0);
  // A single effect, not the read-then-write pair other /proto labs in this codebase copy
  // (e.g. admin-dashboard-options) - that pair races on mount: the "write current to the URL"
  // effect fires once with the still-stale `current` (0) *before* the "read from the URL" effect's
  // `setCurrent` correction has re-rendered, permanently stamping the URL back to `?v=1` even when
  // a deeper variant was requested (confirmed live: `?v=3` on admin-dashboard-options itself lands
  // on variant 1). Merging into one effect keyed on `current`, gated by a mount ref, avoids the
  // race: the *first* invocation only reads-and-corrects (returning before writing, so a correction
  // can re-run this same effect once `current` updates); every later invocation - including the
  // corrected first-mount pass and every real click/keyboard change - just writes. Scoped to this
  // file only, not backported to the other labs' already-decided harnesses.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
      if (v >= 1 && v <= variants.length && v - 1 !== current) {
        // One-time correction from a browser-only source (the URL) SSR can't read - not the
        // cascading-render case this rule normally guards against.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrent(v - 1);
        return;
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
  }, [current]);

  const Variant = variants[current].render;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <GuestHeaderStub actions={commonActions} />
      <div className="flex flex-1 overflow-hidden">
        <GuestIconRailStub />
        <Variant />
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}
