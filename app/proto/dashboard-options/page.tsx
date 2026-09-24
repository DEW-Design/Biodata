"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Started as an exploration of how much more the
// registered-user dashboard (app/pages/_shared/home-dashboard.tsx's HomeDashboardContent) should
// say beyond "Hi, Olivia" + 3 KPI numbers + a quick-actions row + a task list - the dashboard
// "looks largely unfinished... looks empty." That question converged on a real baseline layout
// (Needs your attention, Featured Projects, Knowledge Base, three real type-scale tiers, no
// redundant CTAs - see VariantInline's comment for the full history). The earlier rounds of layout
// variants (Grouped Sections, the Combo A-E set, Clear Hierarchy, etc.) have been removed from this
// file per the user directly, once the layout question was settled and they were no longer
// relevant - the decision itself (chosen direction + what was rejected and why) belongs in
// CONTEXT.md once this page is promoted, not preserved as dead code in the lab indefinitely.
//
// Current round: where the "Continue where you left off" action should live and how it should
// look - inline within its own task row (the current baseline), or pulled out as its own alert/
// card/banner. Every variant below shares the identical Welcome/KPI/Quick Actions block and the
// identical Featured Projects/Knowledge Base sections - only the Continue treatment differs, so
// none of them can regress into "which variant has no clear focus" the way a full-layout rewrite
// could.

import type { FC } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowNarrowRight,
  HomeLine,
  Folder,
  Eye,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  User01,
  PieChart03,
  TrendUp02,
  Plus,
  Upload01,
  BookOpen01,
  FileCheck02,
  DownloadCloud02,
  LifeBuoy01,
} from "@untitledui/icons";
import { AlertFloating, AlertFullWidth } from "@/components/application/alerts/alerts";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { projects } from "@/app/pages/_shared/project-list-content";
import { cx } from "@/utils/cx";

// ── Real content - reused, not invented in parallel. dashboardTasks and projects are the same
// exported data the shipped dashboard/project list already use, so every variant below stays
// consistent with what's actually live elsewhere rather than drifting into its own fake numbers. ──
const kpis = [
  { value: "15", label: "Species Observed", note: "3 up from last week", trend: true },
  { value: "3", label: "Datasets contributed", note: "1 dataset under review" },
  { value: "2", label: "Completed Checklists", note: "2 completed this month" },
];

// Cards only, per the user - the real guide/template content and download flow come later. Icons
// distinguish "read this" (BookOpen01) from "fill this in correctly" (FileCheck02) from "get a
// file" (DownloadCloud02) rather than reusing one generic icon three times.
const knowledgeBaseItems = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
  { icon: DownloadCloud02, title: "Dataset templates", description: "Pre-built spreadsheets for common survey types." },
];
const denseKnowledgeBaseItems = [
  ...knowledgeBaseItems,
  { icon: LifeBuoy01, title: "Getting help & support", description: "Contact the DEW biodiversity team or browse FAQs." },
];

// "Recently active" among projects worth showcasing - Draft and Under review items are excluded
// regardless of recency, since neither is published/verified yet. Flagged directly by the user:
// "Featured projects won't have drafts / under review projects in there, would it?" - they were,
// since `slice(0, 2)` picked by array position only, and Coorong Wetlands (Under review) is the
// array's 2nd entry. Filtering by status first means a newly-added Draft project can never
// accidentally show up "featured" just by being recent.
const featuredProjects = projects.filter((project) => project.status === "Active" || project.status === "Completed");

// The one task with somewhere real to go - used by every "pulled out" Continue treatment below so
// it isn't also duplicated inline in Needs your attention (the exact redundancy bug fixed in the
// baseline: the old hero banner repeated a task the list already showed).
const continueTask = dashboardTasks.find((task) => task.actionHref);
const otherTasks = dashboardTasks.filter((task) => task !== continueTask);

function KpiStat({ value, label, note, trend, last = false }: { value: string; label: string; note: string; trend?: boolean; last?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-2 pr-6", !last && "border-r border-secondary")}>
      <p className="text-2xl font-medium text-primary tabular-nums">{value}</p>
      {/* text-sm, not text-md - `--text-md` is never defined in app/globals.css (see
          KnowledgeBaseCard's comment below), so that class silently rendered as whatever the
          surrounding markup happened to inherit instead of an intentional size. */}
      <p className="text-sm font-medium text-primary">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-tertiary">
        {trend && <TrendUp02 className="size-3.5 text-fg-success-primary" />}
        <span>{note}</span>
      </div>
    </div>
  );
}

function KpiRow() {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
      {kpis.map((kpi, i) => (
        <KpiStat key={kpi.label} {...kpi} last={i === kpis.length - 1} />
      ))}
    </div>
  );
}

function QuickActionsRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button color="primary" iconLeading={Plus}>
        Add project
      </Button>
      <Button color="secondary" iconLeading={Upload01}>
        Upload dataset
      </Button>
      <Button color="secondary" iconLeading={Folder}>
        Manage projects & datasets
      </Button>
    </div>
  );
}

// Restored the real per-task action button (home-dashboard.tsx's shipped TaskItem already has
// this) instead of leaving it out and re-inventing the same "continue this task" idea as a
// separate page-level hero banner.
function TaskItem({
  title,
  detail,
  status,
  actionLabel,
  actionHref,
}: {
  title: string;
  detail: string;
  status: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* text-base, not text-md - same broken-utility fix as KpiStat's label above. */}
          <p className="text-base font-medium text-primary">{title}</p>
          <Badge size="sm" color="gray">
            {status}
          </Badge>
        </div>
        <p className="text-sm text-tertiary">{detail}</p>
      </div>
      {actionHref && actionLabel && (
        <Button color="link-color" size="sm" href={actionHref} iconTrailing={ArrowNarrowRight} className="shrink-0">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// `tasks` defaults to the full list (the "Inline" variant), but a "Continue" alert/card/banner
// variant passes `otherTasks` instead, so the pulled-out task isn't also repeated in this list.
function NeedsAttentionSection({ tasks = dashboardTasks }: { tasks?: typeof dashboardTasks }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-primary">Needs your attention</h2>
        <Badge size="sm" color="gray" className="min-w-5 justify-center py-1 -my-px">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskItem key={task.title} title={task.title} detail={task.detail} status={task.status} actionLabel={task.actionLabel} actionHref={task.actionHref} />
        ))}
      </div>
    </div>
  );
}

// Titles at text-base, not the text-sm every dense metadata card in this codebase uses
// (ProjectDetailsCard/TeamRolesCard/ContactCard headers) - those are reference cards you scan for
// one fact; these are discovery cards meant to invite a click, so they get a step up from the
// metadata-card convention. Originally bumped straight to text-lg (flagged as too small at
// text-sm), then brought back down to text-base once a second pass found text-lg made card titles
// the same size as the section headings containing them - text-base keeps titles clearly larger
// than the old text-sm while staying a full step below the text-lg section heading above them.
// `text-md` deliberately avoided throughout this file - it's a known, pre-existing sitewide gap
// (see components/application/table/table.tsx's TableCardHeader comment) where `--text-md` is
// never defined, so the class compiles to no font-size at all.
function KnowledgeBaseCard({ icon: Icon, title, description }: { icon: FC<{ className?: string }>; title: string; description: string }) {
  return (
    <BentoCard className="flex-1 gap-4">
      <Icon className="size-6 text-fg-brand-primary" />
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-primary">{title}</p>
        <p className="text-sm text-tertiary">{description}</p>
      </div>
    </BentoCard>
  );
}

function FeaturedProjectCard({ project }: { project: (typeof projects)[number] }) {
  const content = (
    <BentoCard className={cx("flex-1 gap-4", project.href && "transition-colors duration-150 group-hover:border-primary")}>
      <div className="flex items-center justify-between gap-2">
        <Badge size="sm" color={project.statusColor}>
          {project.status}
        </Badge>
        <span className="text-xs whitespace-nowrap text-quaternary">{project.updated}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={cx("text-base font-semibold text-primary", project.href && "group-hover:text-brand-700 group-hover:underline")}>{project.name}</p>
        <p className="text-sm text-tertiary">{project.org}</p>
      </div>
    </BentoCard>
  );
  // Only "Adelaide Hills Bushland Survey" has a real detail page - same "only wire what has a real
  // page" convention as the Projects table/global search, not a fake link on every card.
  return project.href ? (
    <Link href={project.href} className="group flex flex-1">
      {content}
    </Link>
  ) : (
    content
  );
}

function WelcomeBanner() {
  return (
    <div className="flex flex-col gap-1">
      {/* text-3xl, not text-2xl - the page title was tied with the KPI numbers below it at the
          same size, so the two read as equally important. One real type ladder now: text-3xl
          (page title) > text-2xl (KPI numbers) > text-lg (section headings) > text-base (card/
          item titles) > text-sm (supporting text) > text-xs (meta) - 6 distinct real sizes, no two
          semantic roles sharing one. */}
      <h1 className="text-3xl font-medium text-primary">Hi, Olivia</h1>
      <p className="text-sm text-tertiary">
        Welcome to BioData SA - this is where you create projects, upload datasets, and find the templates and guides you need for field research.
      </p>
    </div>
  );
}

function FeaturedProjectsSection() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-primary">Featured Projects</h2>
        <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight}>
          View all projects
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {featuredProjects.map((project) => (
          <FeaturedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function KnowledgeBaseSection() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-primary">Knowledge Base</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {denseKnowledgeBaseItems.map((item) => (
          <KnowledgeBaseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}

// ── "Continue where you left off" - 4 real ways to pull the one actionable, personalized task out
// of the flat list, each a genuinely different component, not a restyled div. All 4 render nothing
// if there's no continuable task (an empty-state, not a placeholder) - a real "?" gap marker rather
// than always showing a card with nothing behind it. ──

// Alert (compact, dismissible) - components/application/alerts/alerts.tsx's real AlertFloating.
function ContinueAlert() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  if (!continueTask?.actionHref || dismissed) return null;

  return (
    <AlertFloating
      title="Continue where you left off"
      description={`${continueTask.title} - ${continueTask.detail}`}
      confirmLabel={continueTask.actionLabel ?? "Continue"}
      dismissLabel="Not now"
      color="brand"
      onConfirm={() => router.push(continueTask.actionHref!)}
      onClose={() => setDismissed(true)}
    />
  );
}

// Card - a BentoCard like every other card on this page, distinguished with a brand-accent left
// border and a FeaturedIcon rather than a different card shape entirely, so it reads as "this page's
// cards, one of them promoted" rather than a one-off component.
function ContinueCard() {
  if (!continueTask?.actionHref) return null;

  return (
    <BentoCard className="flex-row items-center justify-between gap-4 border-l-4 border-l-brand-solid">
      <div className="flex items-center gap-4">
        <FeaturedIcon icon={FileSearch01} color="brand" theme="modern" size="md" />
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold text-primary">Continue where you left off</p>
          <p className="text-sm text-tertiary">
            {continueTask.title} - {continueTask.detail}
          </p>
        </div>
      </div>
      <Button color="primary" size="sm" href={continueTask.actionHref} iconTrailing={ArrowNarrowRight} className="shrink-0">
        {continueTask.actionLabel ?? "Continue"}
      </Button>
    </BentoCard>
  );
}

// Banner (full-width, dismissible) - components/application/alerts/alerts.tsx's real
// AlertFullWidth. `className` overrides its default centered max-w-container treatment (meant for
// standalone full-viewport placements) so it aligns with this page's own p-6 padding instead.
function ContinueBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  if (!continueTask?.actionHref || dismissed) return null;

  return (
    <AlertFullWidth
      title="Continue where you left off"
      description={`${continueTask.title} - ${continueTask.detail}`}
      confirmLabel={continueTask.actionLabel ?? "Continue"}
      dismissLabel="Not now"
      actionType="link"
      color="brand"
      className="px-6"
      onConfirm={() => router.push(continueTask.actionHref!)}
      onClose={() => setDismissed(true)}
    />
  );
}

// Strip - the lightest-weight option: one line, no card border, no dismiss control. Not a real
// named DEW component (there isn't a "highlighted strip" primitive in this codebase), but built
// from the same tokens/Button as everything else here, not a hand-rolled lookalike of a real
// component that does exist.
// bg-brand-solid, not bg-secondary - flagged directly by the user: style it in the primary colour
// so it actually catches the eye, rather than blending in as another neutral surface on the page.
// Same real brand-solid token Button's own `color="primary"` and the active icon-rail item already
// use. The trailing action switches to `color="secondary"` (a light/white button) since `link-
// color`'s brand-on-brand text would have no contrast against a solid brand background.
function ContinueStrip() {
  if (!continueTask?.actionHref) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-solid px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-white">
        <FileSearch01 className="size-4 shrink-0 text-white" />
        <span>
          Continue where you left off - <span className="font-semibold">{continueTask.title}</span>
        </span>
      </div>
      <Button color="secondary" size="sm" href={continueTask.actionHref} iconTrailing={ArrowNarrowRight}>
        {continueTask.actionLabel ?? "Continue"}
      </Button>
    </div>
  );
}

// ── Shared chrome - faithful static reproductions of the real page's icon rail and Home's own
// My BioData/Flora and Fauna Dashboard sidebar tabs. The dashboard content is what's under test
// here, not these two, so they stay static context. ──
const sectionIcons = [HomeLine, Folder, Eye, FileLock01, Feather, BarChart01, FileSearch01];

function IconRailStub() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {sectionIcons.map((Icon, i) => (
        <div key={i} className={cx("flex size-12 items-center justify-center rounded-lg", i === 0 ? "bg-brand-solid text-white" : "text-quaternary")}>
          <Icon className="size-5" />
        </div>
      ))}
    </nav>
  );
}

function HomeSidebarStub() {
  return (
    <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Home</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary shadow-xs">
          <User01 className="size-4 text-fg-brand-primary" />
          My BioData
        </div>
        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-tertiary">
          <PieChart03 className="size-4" />
          Flora and Fauna Dashboard
        </div>
      </div>
    </aside>
  );
}

function TopBlock() {
  return (
    <div className="flex flex-col gap-4 border-b border-secondary p-6">
      <WelcomeBanner />
      <KpiRow />
      <QuickActionsRow />
    </div>
  );
}

// ── Variant 1: Inline (current baseline) - "Continue" lives as a per-task action button inside its
// own Needs-your-attention card, same list as every other pending task. Nothing pulled out,
// nothing repeated. ──
function VariantInline() {
  return (
    <>
      <TopBlock />
      <div className="flex flex-col gap-8 p-6">
        <NeedsAttentionSection />
        <FeaturedProjectsSection />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}

// ── Variant 2: Alert - a dismissible AlertFloating sits above Needs your attention (which drops to
// showing only the other 2 tasks, so the pulled-out one isn't listed twice). Alerts read as
// "something worth a decision," which fits a specific, actionable nudge. ──
function VariantAlert() {
  return (
    <>
      <TopBlock />
      <div className="flex flex-col gap-8 p-6">
        <ContinueAlert />
        <NeedsAttentionSection tasks={otherTasks} />
        <FeaturedProjectsSection />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}

// ── Variant 3: Card - a BentoCard styled as one of this page's own cards (brand-accent border),
// not a different visual language borrowed from elsewhere. Reads as "part of the page" rather than
// "an interruption," at the cost of being easier to skim past than an alert. ──
function VariantCard() {
  return (
    <>
      <TopBlock />
      <div className="flex flex-col gap-8 p-6">
        <ContinueCard />
        <NeedsAttentionSection tasks={otherTasks} />
        <FeaturedProjectsSection />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}

// ── Variant 4: Banner - a full-width AlertFullWidth sits above the entire Welcome block, spanning
// edge to edge. The most prominent placement of the four; also the most "site notice"-like, which
// may overstate a single personal task's importance. ──
function VariantBanner() {
  return (
    <>
      <ContinueBanner />
      <TopBlock />
      <div className="flex flex-col gap-8 p-6">
        <NeedsAttentionSection tasks={otherTasks} />
        <FeaturedProjectsSection />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}

// ── Variant 5: Strip - the lightest option, one line, no dismiss, no card chrome. Cheapest to
// scan past if irrelevant, but also the easiest to miss entirely. ──
function VariantStrip() {
  return (
    <>
      <TopBlock />
      <div className="flex flex-col gap-8 p-6">
        <ContinueStrip />
        <NeedsAttentionSection tasks={otherTasks} />
        <FeaturedProjectsSection />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}

const variants = [
  { name: "Inline (current)", render: VariantInline },
  { name: "Alert", render: VariantAlert },
  { name: "Card", render: VariantCard },
  { name: "Banner", render: VariantBanner },
  { name: "Strip", render: VariantStrip },
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

export default function DashboardOptionsProto() {
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
        <IconRailStub />
        <HomeSidebarStub />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <Variant />
        </main>
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}
