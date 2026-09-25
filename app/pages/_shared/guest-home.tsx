"use client";

import type { FC, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Key } from "react-aria-components";
import { ArrowNarrowUpRight, BookOpen01, CheckVerified01, Download02, PlayCircle, ShieldTick, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";

// public-user's Home/Projects content, folded in from `/proto/public-user` (the "Reference" column-2
// variant the user picked, of the three compared there - Disclosure and How it works are the other
// two, still live in the lab as the record of what was considered). Two pieces:
//
//   GuestGradientCard  the same gradient surface the registered-user/admin "Hi, X" card uses
//                       (home-dashboard.tsx), one ask per Flora and Fauna Dashboard tab, always
//                       ending in "Create a free account".
//   GuestAboutAside    column 2 for a signed-out guest - "What is BioData SA?" plus a Guides list,
//                       always visible (Reference's own axis - no accordion, no stepped narrative -
//                       see the lab for the two variants not picked).
//
// Wired into both `/pages/dashboard` (Home) and `/pages/project-list` (Projects) - the lab mounts
// this same aside for both sections (only the eyebrow label differs), so both real shells do too.
// Only Home gets the gradient card - Projects renders the real `ProjectListContent` directly under
// it, same as the lab and the "features reduce, they don't change fundamentally" decision this
// whole persona follows (CONTEXT.md).
//
// Every claim in the card copy is one BioData SA already makes about itself (who contributes, what
// records are for, that every record belongs to a project) - no invented numbers, no urgency, no
// exclamation marks. This is a government service, not a growth-marketing surface.

const GUIDES_HREF = "/pages/biodata-home#knowledge-centre";

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

function useCardSwap() {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const } };
}

// `min-h` on the text column reserves a headline plus two body lines so switching tabs never
// shifts the dashboard content below (caught live in the lab: one message once wrapped an extra
// line and moved the tab row 8px).
export function GuestGradientCard({ tab }: { tab: Key }) {
  const ask = tabAsks[String(tab)] ?? tabAsks.overview;
  const swap = useCardSwap();
  return (
    <div className="rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-8">
      <motion.div key={String(tab)} {...swap} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="flex min-h-[84px] max-w-[640px] flex-col gap-1">
          <h1 className="text-2xl font-medium text-balance text-white">{ask.headline}</h1>
          <p className="text-base text-pretty text-white/80">{ask.body}</p>
        </div>
        <GuestActionButton icon={UserPlus01} label="Create a free account" color="secondary" isGuest modalTitle={ask.modalTitle} modalDescription={ask.modalDescription} />
      </motion.div>
    </div>
  );
}

interface Guide {
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
}

// Real Knowledge Centre categories from /pages/biodata-home (titles and descriptions verbatim) -
// no guide pages exist yet, so these are honest, non-interactive rows, not fabricated links.
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

const aboutParagraphs = [
  "South Australia's primary biodiversity information platform. It supports conservation, research, environmental planning and evidence-based decision making.",
  "Records date back to 1974 and come from government surveys, universities, conservation organisations and citizen scientists.",
];

// The "Reference" variant from `/proto/public-user` - everything visible at once, no interaction,
// picked over Disclosure (a boxed Accordion) and How it works (a 3-step narrative), both still in
// the lab as the record of what else was considered.
export function GuestAboutAside({ sectionLabel, actions }: { sectionLabel: string; /** An "Actions" group shown first, above the About copy - the Projects section passes its own. */ actions?: ReactNode }): ReactNode {
  return (
    <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{sectionLabel}</p>
        {actions && <div className="border-b border-secondary pb-6">{actions}</div>}
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
          <Button color="link-color" size="sm" href={GUIDES_HREF} iconTrailing={ArrowNarrowUpRight} className="self-start">
            Open resources and user guides
          </Button>
        </section>
      </div>
      <SidebarFooterLinks />
    </aside>
  );
}
