"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Exploring where project owner/contact info and
// the Events/Occurrences/Observations/Attached Resources counts should live on
// project-detail/option-1's "Projects" header - currently all of it sits inside the Overview tab
// body, below the persistent title/meta header. KEPT after promotion (per the user: never delete
// explorations - they're the evidence that all the options were actually considered, not just the
// one that shipped). See CONTEXT.md's entry for where "Meta Under Title, Full Rail" landed in the
// real page.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowNarrowLeft,
  HomeLine,
  Folder,
  Eye,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  Calendar,
  MarkerPin01,
  Paperclip,
  Mail01,
  Phone01,
  ChevronDown,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { BentoCard, MetricCard } from "@/app/pages/_shared/bento-card";
import { MapView } from "@/app/pages/_shared/map-view";

// ── Real example data, reused verbatim from project-detail/option-1 (same project, same numbers) ──
const project = {
  title: "Adelaide Hills Bushland Survey",
  id: "BD-5039",
  startDate: "3 Feb 2025",
  endDate: "—",
  status: "Active" as const,
  publishedBy: "Adelaide Hills Landcare",
};

const dataOwner = { name: "Olivia Wyatt", initials: "OW", email: "olivia.wyatt@adelaidehillslandcare.org.au", phone: "(08) 8388 4188" };
const projectManager = { name: "Maya Dewitt", initials: "MD", role: "DEW Ecologist", email: "maya.dewitt@sa.gov.au", phone: "(08) 8204 1910" };

const stats = [
  { label: "Events", value: "6" },
  { label: "Occurrences", value: "18" },
  { label: "Observations", value: "42" },
  { label: "Attached Resources", value: "04" },
];

// ── Shared chrome - faithful static reproductions of the real page's icon rail, contextual
// sidebar, and tab row. The header/Overview layout is what's under test here, not these, so they
// stay static context. ──
const sectionIcons = [HomeLine, Folder, Eye, FileLock01, Feather, BarChart01, FileSearch01];

function IconRail() {
  return (
    <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4 lg:flex">
      {sectionIcons.map((Icon, i) => (
        <div key={i} className={"flex size-12 items-center justify-center rounded-lg " + (i === 1 ? "bg-brand-solid text-white" : "text-quaternary")}>
          <Icon className="size-5" />
        </div>
      ))}
    </nav>
  );
}

function SidebarStub() {
  const items = ["Site SU00501", "Visit VU00501", "Observation OBS094", "Observation OBS095", "Occurrence OBS094 · Individual"];
  return (
    <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Adelaide Hills Bushland Survey</p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <p key={item} className="rounded-md py-2 text-sm text-primary">
            {item}
          </p>
        ))}
      </div>
    </aside>
  );
}

function TabsRowStub() {
  const tabs = ["Overview", "Datasets", "Details", "Restrictions", "Additional Information"];
  return (
    <div className="flex gap-6 border-b border-secondary px-6 pt-4">
      {tabs.map((tab, i) => (
        <span key={tab} className={"pb-2.5 text-md font-semibold " + (i === 0 ? "border-b-2 border-brand-600 text-brand-secondary" : "text-quaternary")}>
          {tab}
        </span>
      ))}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function BackLink() {
  return (
    <div className="p-6 pb-0">
      <button type="button" className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary">
        <ArrowNarrowLeft className="size-4" />
        Back to projects
      </button>
    </div>
  );
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-secondary p-6 text-center">
      <p className="max-w-xs text-sm text-tertiary">{label}</p>
    </div>
  );
}

function ContactRow({ contact, role, org }: { contact: typeof dataOwner | typeof projectManager; role: string; org?: string }) {
  return (
    <BentoCard className="flex-1 gap-3">
      <div className="flex items-center gap-2">
        <Avatar size="sm" initials={contact.initials} alt={contact.name} />
        <div className="flex flex-col">
          <p className="text-sm font-medium text-primary">{contact.name}</p>
          <p className="text-xs text-tertiary">
            {role}
            {org ? ` · ${org}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 border-t border-secondary pt-3 text-xs text-tertiary">
        <span>{contact.email}</span>
        <span>{contact.phone}</span>
      </div>
    </BentoCard>
  );
}

// ── Variant 1: Baseline - the real, current implementation, unchanged ──
function VariantBaseline() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1 p-6 pb-0">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
        <MetaField label="Project ID">{project.id}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.publishedBy}</MetaField>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <MetricCard key={s.label} size="sm" value={s.value} label={s.label} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ContactRow contact={dataOwner} role="Data Owner" org={project.publishedBy} />
          <ContactRow contact={projectManager} role="Project Manager" />
        </div>
        <PlaceholderCard label="Abstract + geographic map card (unchanged, further down the same Overview tab)" />
      </div>
    </>
  );
}

// ── The user's AI-generated reference (not our tokens, but the right structural idea): a real
// 2-column split for the whole Overview tab, not just the header - a wide left column (stat cards
// + Overview/Abstract/Map) and a narrower persistent right rail (Project Details, Team Roles) that
// runs the full height of the tab. Rebuilt below with our real components/tokens (BentoCard,
// BadgeWithDot, real Untitled UI icons for each stat, our type scale) - never the reference's own
// colours/spacing - per "Adopting UX patterns from external references" in CONTEXT.md. Several
// variations on where things sit within that column split, since "breaking the content out further
// into columns" was the open question, not just "copy the one layout". ──
function StatCard({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <BentoCard className="gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-tertiary">{label}</span>
        <Icon className="size-4 text-quaternary" />
      </div>
      <span className="text-3xl font-semibold text-primary tabular-nums">{value}</span>
    </BentoCard>
  );
}

const statIcons = { Events: Calendar, Occurrences: MarkerPin01, Observations: Eye, "Attached Resources": Paperclip } as const;

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-tertiary">{label}</span>
      <span className="font-medium text-primary">{children}</span>
    </div>
  );
}

function ProjectDetailsCard() {
  return (
    <BentoCard className="gap-3">
      <h2 className="text-sm font-semibold text-primary">Project Details</h2>
      <div className="flex flex-col gap-3 border-t border-secondary pt-3">
        <PropertyRow label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </PropertyRow>
        <PropertyRow label="Project ID">{project.id}</PropertyRow>
        <PropertyRow label="Start Date">{project.startDate}</PropertyRow>
        <PropertyRow label="End Date">{project.endDate}</PropertyRow>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-tertiary">Published By</span>
          <span className="text-sm font-medium text-primary">{project.publishedBy}</span>
        </div>
      </div>
    </BentoCard>
  );
}

function TeamRolesCard() {
  return (
    <BentoCard className="gap-4">
      <h2 className="text-sm font-semibold text-primary">Team Roles</h2>
      <div className="flex flex-col gap-4 border-t border-secondary pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Data Owner</p>
          <p className="text-sm font-medium text-primary">
            {dataOwner.name} <span className="font-normal text-tertiary">· {project.publishedBy}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tertiary">
            <span className="flex items-center gap-1.5">
              <Mail01 className="size-3.5 text-quaternary" />
              {dataOwner.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone01 className="size-3.5 text-quaternary" />
              {dataOwner.phone}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project Manager</p>
          <p className="text-sm font-medium text-primary">
            {projectManager.name} <span className="font-normal text-tertiary">· {projectManager.role}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tertiary">
            <span className="flex items-center gap-1.5">
              <Mail01 className="size-3.5 text-quaternary" />
              {projectManager.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone01 className="size-3.5 text-quaternary" />
              {projectManager.phone}
            </span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

function OverviewCard() {
  return (
    <BentoCard>
      <h2 className="text-md font-medium text-primary">Overview</h2>
      <div className="flex flex-col gap-2 border-t border-secondary pt-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
        <p className="line-clamp-3 text-sm text-secondary">
          Ongoing flora and fauna monitoring across the Adelaide Hills reserve network, tracking indicator species before and after
          prescribed burns.
        </p>
        <Button color="link-color" size="sm" className="w-fit">
          Read more
        </Button>
      </div>
      <div className="flex flex-col gap-2 border-t border-secondary pt-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic Scope</p>
        <div className="min-h-[200px] flex-1 rounded-lg">
          <MapView />
        </div>
      </div>
    </BentoCard>
  );
}

// ── Variant 2: Full-Width Stats - the 4 stat cards span the full width as a headline row (all 4
// treated as equally important, not competing with the 2-column split below), then Overview/rail
// split beneath. ──
function VariantFullWidthStats() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1 p-6 pb-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={statIcons[s.label as keyof typeof statIcons]} label={s.label} value={s.value} />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <OverviewCard />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <ProjectDetailsCard />
            <TeamRolesCard />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Variant 3: Meta Under Title, Clean Rail - restores the plain meta row under the title exactly
// as it exists today, and removes "Project Details" from the rail so nothing repeats - the rail
// becomes Team Roles only. ──
function VariantMetaUnderTitleCleanRail() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1 p-6 pb-0">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
        <MetaField label="Project ID">{project.id}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.publishedBy}</MetaField>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <MetricCard key={s.label} size="sm" value={s.value} label={s.label} />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <OverviewCard />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <TeamRolesCard />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Variant 4: Meta Under Title, Full Rail - same restored meta row under the title, but the rail
// deliberately keeps "Project Details" too - some duplication, on the theory that a fact worth
// showing once is worth being scannable in both the header and the rail without scrolling back up.
// This is the direction promoted into the real page (see CONTEXT.md). ──
function VariantMetaUnderTitleFullRail() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1 p-6 pb-0">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
        <MetaField label="Project ID">{project.id}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.publishedBy}</MetaField>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={statIcons[s.label as keyof typeof statIcons]} label={s.label} value={s.value} />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <OverviewCard />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <ProjectDetailsCard />
            <TeamRolesCard />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Variant 5: Status Up, Rest in Rail - doesn't restore the full meta row - just promotes Status
// to sit directly beside the title (the one fact worth seeing without looking anywhere else),
// leaving Project ID/dates/Published By to live only in the rail's Project Details card. ──
function VariantStatusUp() {
  return (
    <>
      <BackLink />
      <div className="flex items-center justify-between gap-4 p-6 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
          <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
        </div>
        <BadgeWithDot size="sm" color="success">
          {project.status}
        </BadgeWithDot>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={statIcons[s.label as keyof typeof statIcons]} label={s.label} value={s.value} />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <OverviewCard />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <ProjectDetailsCard />
            <TeamRolesCard />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Variant 6: No Rail, Card Grid - meta row restored under the title (so the rail's asymmetric
// column is no longer needed to hold it), stats full-width, then Overview/Team Roles flow as
// equal-weight cards in a responsive grid - no tall persistent rail at all. ──
function VariantCardGrid() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1 p-6 pb-0">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
        <MetaField label="Project ID">{project.id}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.publishedBy}</MetaField>
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={statIcons[s.label as keyof typeof statIcons]} label={s.label} value={s.value} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OverviewCard />
          </div>
          <TeamRolesCard />
        </div>
      </div>
    </>
  );
}

// Linear's project-overview pattern (https://mobbin.com/screens/87265f9f-1dc4-4e94-a7b5-a8acf2192db3):
// a one-line property summary under the title, plus the full field list collapsed by default behind
// a "Properties" disclosure in the rail - the metadata still exists, but isn't rendered as a fixed
// block competing for space, so cognitive load drops without hiding the data entirely. Our tokens
// throughout, not Linear's own styling - never our styles/components mixed with a reference's.
function CompactMetaSummary() {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-tertiary">
      <BadgeWithDot size="sm" color="success">
        {project.status}
      </BadgeWithDot>
      <span aria-hidden="true">·</span>
      <span>Published by {project.publishedBy}</span>
      <span aria-hidden="true">·</span>
      <span>
        {project.startDate} – {project.endDate}
      </span>
    </p>
  );
}

function PropertiesDisclosureCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BentoCard className="gap-3">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <h2 className="text-sm font-semibold text-primary">Properties</h2>
        <ChevronDown className={`size-4 shrink-0 text-fg-quaternary transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="flex flex-col gap-3 border-t border-secondary pt-3">
          <PropertyRow label="Status">
            <BadgeWithDot size="sm" color="success">
              {project.status}
            </BadgeWithDot>
          </PropertyRow>
          <PropertyRow label="Project ID">{project.id}</PropertyRow>
          <PropertyRow label="Start Date">{project.startDate}</PropertyRow>
          <PropertyRow label="End Date">{project.endDate}</PropertyRow>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-tertiary">Published By</span>
            <span className="text-sm font-medium text-primary">{project.publishedBy}</span>
          </div>
        </div>
      )}
    </BentoCard>
  );
}

// ── Variant 7: Collapsible Properties - Linear's pattern: a compact one-line status/publisher/date
// summary sits directly under the title (always visible, no click required), and the full field
// list lives behind a "Properties" disclosure in the rail, collapsed by default - so the metadata
// is one click away rather than a fixed block competing with Overview/Team Roles for space. ──
function VariantCollapsibleProperties() {
  return (
    <>
      <BackLink />
      <div className="flex flex-col gap-1.5 p-6 pb-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{project.title}</h1>
        <CompactMetaSummary />
      </div>
      <TabsRowStub />
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={statIcons[s.label as keyof typeof statIcons]} label={s.label} value={s.value} />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <OverviewCard />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <PropertiesDisclosureCard />
            <TeamRolesCard />
          </div>
        </div>
      </div>
    </>
  );
}

const variants = [
  { name: "Baseline", render: VariantBaseline },
  { name: "Full-Width Stats", render: VariantFullWidthStats },
  { name: "Meta Under Title, Clean Rail", render: VariantMetaUnderTitleCleanRail },
  { name: "Meta Under Title, Full Rail", render: VariantMetaUnderTitleFullRail },
  { name: "Status Up", render: VariantStatusUp },
  { name: "No Rail, Card Grid", render: VariantCardGrid },
  { name: "Collapsible Properties", render: VariantCollapsibleProperties },
];

// ── Picker chrome - copied verbatim from the prototype skill's PICKER.md, React-ified ──
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

export default function ProjectHeaderProto() {
  // Always 0 on first render (server and client match, no hydration mismatch) - corrected from
  // the URL right after mount, a browser-only source of truth SSR can't see.
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
    // One-time correction from a browser-only source (the URL) SSR can't read - not the
    // cascading-render case this rule normally guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v >= 1 && v <= variants.length) setCurrent(v - 1);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
  }, [current]);

  const Variant = variants[current].render;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <div className="flex flex-1 overflow-hidden">
        <IconRail />
        <SidebarStub />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <Variant />
        </main>
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}
