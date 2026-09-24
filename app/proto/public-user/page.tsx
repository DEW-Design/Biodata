"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. The public-user (signed-out guest) Home landing,
// reached from /pages/biodata-home's "Explore" button. Supersedes the earlier
// /proto/public-user-explorations, whose banner and column-2 rounds fed into this brief.
//
// Decided by the user (not up for comparison here):
// - Flow: biodata-home -> "Explore" -> dashboard -> a gradient card whose message changes with the
//   dashboard tab (Overview / Flora / Fauna / Projects) and always offers account creation.
// - Same three-column shell as registered-user (icon rail, column 2, main), with stripped-back
//   content. Column 2 explains what BioData SA is and points to guides.
//
// Open here: what column 2 should DO. The variants share the header, rail, gradient card and real
// dashboard, and diverge only on column 2's job (the axis in each variant's name).
// The active dashboard tab is lifted to this page so it survives a variant switch, letting every
// variant be judged on the same tab.
//
// Features reduce, they don't change fundamentally (per direct feedback): this is the registered-user
// shell with features taken away, never a redesign. Header: same GlobalProjectSearch and Log in /
// Sign up, with "Add project" / "Upload dataset" removed. Home: the real Flora and Fauna Dashboard
// exactly as it ships (all four tabs, all four cards), under a gradient card. Projects: the real
// ProjectListContent. Only column 2 is new content, because the brief asks for it. An earlier
// species-first pass (Species tab, species search) changed the shape and was reverted.
//
// Guide rows use the real Knowledge Centre category names and descriptions from /pages/biodata-home.
// No guide pages exist yet, so the guides are plain rows plus ONE real link to that landing-page
// section, never fabricated per-guide links.

import { createContext, Suspense, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Focusable, type Key } from "react-aria-components";
import {
  HomeLine,
  Folder,
  ArrowNarrowRight,
  Map01,
  UserPlus01,
  BookOpen01,
  PlayCircle,
  ShieldTick,
  Download02,
  CheckVerified01,
  ArrowNarrowUpRight,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { ProjectListContent } from "@/app/pages/_shared/project-list-content";
import { registeredUserFooterLinks } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

const GUIDES_HREF = "/pages/biodata-home#knowledge-centre";

// ── Shared chrome: real public-user header shape and icon rail (Home, Projects, Explore) ──

function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      {["Log in", "Sign up"].map((label, i) => (
        <Tooltip key={label} title="Coming soon - authentication isn't built yet">
          <Focusable>
            <span className="inline-flex">
              <Button color={i === 0 ? "secondary" : "primary"} isDisabled>
                {label}
              </Button>
            </span>
          </Focusable>
        </Tooltip>
      ))}
    </div>
  );
}

function GuestHeader() {
  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pages/dashboard/gov-sa-dew-lockup.png"
          alt="Government of South Australia, Department for Environment and Water"
          className="h-[37px] w-auto"
        />
        <div className="h-6 w-px bg-secondary" />
        <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64 lg:w-[395px]">
          <Suspense fallback={null}>
            <GlobalProjectSearch />
          </Suspense>
        </div>
        <GuestAuthActions />
      </div>
    </header>
  );
}

type Section = "home" | "projects";

const railSections: { id: Section | "explore"; label: string; icon: FC<{ className?: string }>; href?: string }[] = [
  { id: "home", label: "Home", icon: HomeLine },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "explore", label: "Explore", icon: Map01, href: "/pages/observations?userRole=public-user" },
];

function IconRail({ section, onSection }: { section: Section; onSection: (s: Section) => void }) {
  const base = "flex size-12 items-center justify-center rounded-lg outline-focus-ring transition-colors duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {railSections.map(({ id, label, icon: Icon, href }) => {
        const inactive = "text-quaternary hover:bg-tertiary hover:text-primary";
        return href ? (
          <a key={id} href={href} aria-label={label} title={label} className={cx(base, inactive)}>
            <Icon className="size-5" />
          </a>
        ) : (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            aria-current={section === id ? "page" : undefined}
            onClick={() => onSection(id as Section)}
            className={cx(base, section === id ? "bg-brand-solid text-white" : inactive)}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </nav>
  );
}

// ── The gradient card: same surface as registered-user's "Hi, Olivia" card. One ask per tab,
// phrased around what a guest is looking at, warm and specific but never hype: every claim is one
// BioData SA already makes about itself (who contributes, what records are for, that every record
// belongs to a project), with no invented numbers or social proof - this is a government service. `min-h` reserves a headline plus two body lines so a tab switch never shifts the dashboard below. ──

interface TabAsk {
  headline: string;
  body: string;
  modalTitle: string;
  modalDescription: string;
}

const tabAsks: Record<string, TabAsk> = {
  overview: {
    headline: "Every species record starts with a sighting",
    body: "Researchers use sightings from people like you to see where species live and how that's changing. Create a free account and add yours.",
    modalTitle: "Add your sightings to the record",
    modalDescription: "Create a free BioData SA account to log sightings, upload datasets and register projects alongside South Australia's researchers and citizen scientists.",
  },
  flora: {
    headline: "Found a plant that isn't on the map?",
    body: "Log it with a location and a photo, and help researchers track how South Australia's flora is changing. A free account is all you need.",
    modalTitle: "Log a plant sighting",
    modalDescription: "Create a free BioData SA account to record a plant sighting with its location and a photo, and add it to the state's flora record.",
  },
  fauna: {
    headline: "Spotted a bird, mammal or reptile? Log it.",
    body: "Add the sighting, pin where you saw it and attach a photo. Every record helps scientists understand where species occur.",
    modalTitle: "Log an animal sighting",
    modalDescription: "Create a free BioData SA account to record an animal sighting with its location and photos, and add it to the state's fauna record.",
  },
  projects: {
    headline: "Give your survey a home in the record",
    body: "Every record in BioData SA belongs to a project. Create a free account to register yours and add its data.",
    modalTitle: "Register a project",
    modalDescription: "Create a free BioData SA account to register a project and add its records to South Australia's biodiversity record.",
  },
};

function useSwap() {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const } };
}

function GuestGradientCard({ tab }: { tab: string }) {
  const ask = tabAsks[tab] ?? tabAsks.overview;
  const swap = useSwap();
  return (
    <div className="rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
      <motion.div key={tab} {...swap} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="flex min-h-[84px] max-w-[640px] flex-col gap-1">
          <h1 className="text-2xl font-medium text-balance text-white">{ask.headline}</h1>
          <p className="text-base text-pretty text-white/80">{ask.body}</p>
        </div>
        <GuestActionButton icon={UserPlus01} label="Create a free account" color="secondary" isGuest modalTitle={ask.modalTitle} modalDescription={ask.modalDescription} />
      </motion.div>
    </div>
  );
}

function GuestMain({ section, tab, onTabChange }: { section: Section; tab: string; onTabChange: (key: Key) => void }) {
  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      {section === "projects" ? (
        <Suspense fallback={null}>
          <ProjectListContent />
        </Suspense>
      ) : (
        <>
          <div className="p-6">
            <GuestGradientCard tab={tab} />
          </div>
          <DataOverviewContent activeTab={tab} onActiveTabChange={onTabChange} />
        </>
      )}
    </main>
  );
}

// ── Column 2: the 286px contextual sidebar registered-user's Home uses for its view switcher.
// Same shell and footer links here; the variants below differ only in what fills it. ──

const SectionLabelContext = createContext("Home");

function GuestAside({ children }: { children: ReactNode }) {
  const label = useContext(SectionLabelContext);
  return (
    <aside aria-label="About BioData SA" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
        {children}
      </div>
      <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
        {registeredUserFooterLinks.map((link) => (
          <p key={link}>{link}</p>
        ))}
      </div>
    </aside>
  );
}

interface Guide {
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
}

// Real Knowledge Centre categories from /pages/biodata-home (titles and descriptions verbatim).
const guideCatalog = {
  gettingStarted: { icon: BookOpen01, title: "Getting Started", description: "Orientation guides for new users of Biodata and NatureMaps." },
  videos: { icon: PlayCircle, title: "Video tutorials", description: "Short walkthroughs of key workflows and tools." },
  policies: { icon: ShieldTick, title: "Policies", description: "Access, privacy and sensitive records policies." },
  standards: { icon: CheckVerified01, title: "Standards", description: "Data quality, taxonomy and spatial standards." },
  downloads: { icon: Download02, title: "Downloads", description: "Templates, field forms and reference datasets." },
} satisfies Record<string, Guide>;

function GuideRow({ icon: Icon, title, description }: Guide) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-sm text-pretty text-tertiary">{description}</p>
      </div>
    </li>
  );
}

function GuideList({ guides }: { guides: Guide[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {guides.map((g) => (
        <GuideRow key={g.title} {...g} />
      ))}
    </ul>
  );
}

function GuidesLink() {
  return (
    <Button color="link-color" size="sm" href={GUIDES_HREF} iconTrailing={ArrowNarrowUpRight} className="self-start">
      Open resources and user guides
    </Button>
  );
}

const aboutParagraphs = [
  "South Australia's primary biodiversity information platform. It supports conservation, research, environmental planning and evidence-based decision making.",
  "Records date back to 1974 and come from government surveys, universities, conservation organisations and citizen scientists.",
];

// Variant 1 - Reference. Axis: everything visible at once, two plain sections, no interaction.
function ReferenceAside() {
  return (
    <GuestAside>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-primary">What is BioData SA?</h2>
        {aboutParagraphs.map((p) => (
          <p key={p} className="text-sm text-pretty text-tertiary">
            {p}
          </p>
        ))}
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">Guides</h2>
        <GuideList guides={[guideCatalog.gettingStarted, guideCatalog.videos, guideCatalog.policies, guideCatalog.downloads]} />
        <GuidesLink />
      </section>
    </GuestAside>
  );
}

// Variant 2 - Disclosure. Axis: structured questions in the real boxed Accordion, one open by
// default, so the column can hold more without reading as a wall.
const disclosureItems: AccordionItemType[] = [
  {
    id: "about",
    title: "What is BioData SA?",
    content: (
      <div className="flex flex-col gap-2">
        {aboutParagraphs.map((p) => (
          <p key={p} className="text-sm text-pretty text-tertiary">
            {p}
          </p>
        ))}
      </div>
    ),
  },
  {
    id: "contributors",
    title: "Who contributes the data?",
    content: (
      <p className="text-sm text-pretty text-tertiary">
        Government surveys, universities, conservation organisations such as BirdLife Australia and Birds SA, the South Australian Museum, and citizen scientists.
      </p>
    ),
  },
  {
    id: "access",
    title: "What can I see without an account?",
    content: (
      <p className="text-sm text-pretty text-tertiary">
        Public (Level 1) records, projects and the Flora and Fauna dashboard. Sensitive species locations and licensed (Level 2) data need a Data Licencing Agreement, which registered users can request.
      </p>
    ),
  },
  {
    id: "guides",
    title: "Guides and resources",
    content: (
      <div className="flex flex-col gap-4">
        <GuideList guides={[guideCatalog.gettingStarted, guideCatalog.videos, guideCatalog.policies]} />
        <GuidesLink />
      </div>
    ),
  },
];

function DisclosureAside() {
  return (
    <GuestAside>
      <Accordion items={disclosureItems} defaultOpenKeys={["about"]} variant="boxed" className="gap-3!" />
    </GuestAside>
  );
}

// Variant 3 - How it works. Axis: explain by process. Column 2 tells how a sighting becomes a public
// species record (spotted, joins a project, published) instead of listing topics, which is also where
// the "projects organise species" idea is stated. Every claim is one BioData SA already makes: every
// record is assigned to a project, published projects are open by default, and sensitive species
// locations are withheld.
const recordSteps = [
  { title: "Someone spots a species", body: "Surveys, researchers and citizen scientists record what they saw, and where and when." },
  { title: "It joins a project", body: "Every record belongs to a project, which keeps one survey's records together.", linksToProjects: true },
  { title: "Published records appear here", body: "Once a project is published, its records show on this dashboard. Sensitive species locations are held back." },
];

function HowItWorksAside({ onBrowseProjects }: { onBrowseProjects: () => void }) {
  return (
    <GuestAside>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-primary">What is BioData SA?</h2>
        <p className="text-sm text-pretty text-tertiary">{aboutParagraphs[0]}</p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">How a record gets here</h2>
        <ol className="flex flex-col">
          {recordSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-brand-tertiary tabular-nums">{i + 1}</span>
                {i < recordSteps.length - 1 && <span aria-hidden="true" className="my-1 w-px flex-1 bg-[var(--ui-border-secondary)]" />}
              </div>
              <div className={cx("flex flex-col gap-1", i < recordSteps.length - 1 && "pb-5")}>
                <p className="text-sm font-semibold text-primary">{step.title}</p>
                <p className="text-sm text-pretty text-tertiary">{step.body}</p>
                {step.linksToProjects && (
                  <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} onClick={onBrowseProjects} className="self-start">
                    Browse public projects
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">Learn more</h2>
        <GuideList guides={[guideCatalog.gettingStarted, guideCatalog.videos]} />
        <GuidesLink />
      </section>
    </GuestAside>
  );
}

const variants: { name: string; aside: (actions: { openProjects: () => void }) => ReactNode }[] = [
  { name: "Reference", aside: () => <ReferenceAside /> },
  { name: "Disclosure", aside: () => <DisclosureAside /> },
  { name: "How it works", aside: (actions) => <HowItWorksAside onBrowseProjects={actions.openProjects} /> },
];

// ── Picker chrome - verbatim from the prototype skill's PICKER.md (no replay: nothing here is an
// entrance animation worth re-triggering) ──
function Picker({ current, setCurrent }: { current: number; setCurrent: (i: number) => void }) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlightStyle, setHighlightStyle] = useState({ width: 0, x: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = itemRefs.current[current];
    if (el) setHighlightStyle({ width: el.offsetWidth, x: el.offsetLeft });
  }, [current]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(raf);
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
export default function PublicUserPage() {
  return (
    <Suspense fallback={null}>
      <PublicUserProto />
    </Suspense>
  );
}

function PublicUserProto() {
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState<Key>("overview");
  const [section, setSection] = useState<Section>("home");

  // Single read-then-write effect keyed on `current` (the two-effect pattern in older labs races
  // on mount and stamps ?v=1 over a requested deeper variant).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
      if (v >= 1 && v <= variants.length && v - 1 !== current) {
        // One-time correction from a browser-only source (the URL) SSR can't read.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrent(v - 1);
        return;
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
  }, [current]);

  const tabKey = String(tab);

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <GuestHeader />
      <div className="flex flex-1 overflow-hidden">
        <IconRail section={section} onSection={setSection} />
        <SectionLabelContext.Provider value={section === "projects" ? "Projects" : "Home"}>{variants[current].aside({ openProjects: () => setSection("projects") })}</SectionLabelContext.Provider>
        <GuestMain section={section} tab={tabKey} onTabChange={setTab} />
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}
