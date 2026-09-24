"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable } from "react-aria-components";
import {
  Bell01,
  ChevronDown,
  Upload01,
  Plus,
  TrendUp02,
  ArrowNarrowRight,
  Folder,
  FileLock01,
  Flag01,
  Check,
  FileSearch01,
  BookOpen01,
  FileCheck02,
  DownloadCloud02,
  LifeBuoy01,
  Users01,
  UserCheck01,
  BarChartSquare01,
  Database01,
} from "@untitledui/icons";
import type { FC } from "react";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Tabs } from "@/components/application/tabs/tabs";
import { Popover } from "@/components/base/select/popover";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { DataOverviewContent } from "@/app/pages/dashboard/option-2/data-overview";
import { BentoCard } from "@/app/pages/dashboard/option-2/bento-card";
import { projects } from "@/app/pages/_shared/project-list-content";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, registeredUserFooterLinks, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";
import { assetPath } from "@/lib/base-path";

// NOTE: "option-1" in the comments below means the sidebar-shell dashboard that is now the canonical
// /pages/dashboard route (its /option-1 suffix was dropped - see CONTEXT.md, Sept 2026 route
// normalisation). This option-2 folder is kept as a record of the explored top-nav direction.
// Option 2 of 2: same task-first dashboard as option-1 (see that file's comment for the full
// rationale) on the top-nav shell instead of the sidebar shell. Personal activity stats (KPI row)
// stay in the greeting banner at the top - fixed convention - "Needs your attention" is the
// primary content below it.
//
// The two options are also a shell convention meant to carry over to future explorations of the
// same kind: option-1 is the sidebar-nav shell (primary icon rail + contextual sidebar), option-2
// is the top-nav shell (header + primary nav bar). Same underlying screen content, ported between
// both, just hung off a different chrome.
//
// Figma source: https://www.figma.com/design/bgksKvmSaVR7ZptB98LzGr/-HI-FI--Dashboard-Explorations?node-id=53-568
// "SCREEN" - per CONTEXT.md's "Exploratory page layouts (/pages/<page-name>,
// /pages/<page-name>/<variant>)" section. The Figma frame only specifies the header, primary
// nav, and greeting/KPI banner (nothing below y=473 is drawn) - the body below the banner was
// data-heavy metric cards ported from option-1 until the dashboard's actual goals got scoped (see
// CONTEXT.md's "Registered User dashboard scope"); now it's the task list instead.
//
// Note: the account menu in Figma reads "Dewitt, Maya" while the banner greets "Hi, Olivia" -
// an inconsistency in the source file, not something reconciled here; both are rendered verbatim,
// same convention as rendering "[Location]" literally elsewhere.
//
// The primary nav renders the real Registered User IA (lib/registered-user-nav.ts): each
// top-level section is a nav bar item, sections with children open a dropdown on click instead of
// option-1's sidebar accordion - same content, shell-appropriate idiom. Only the two items with a
// real page (`key` set) are actual links.

// This screen's own page key, so its own entry in the dropdown (Home > BioData Dashboard) can show
// a selected state - same fix as dashboard's "BioData Dashboard" link.
// Only these keys have an option-2 page; any other keyed nav node (e.g. `observations`, which only exists as the
// canonical sidebar-shell page) renders as a plain label instead of a dead /option-2 link.
const OPTION_2_KEYS: ReadonlySet<string> = new Set(["dashboard", "project-list"]);
const CURRENT_KEY = "dashboard";

function NavDropdownItem({ node, depth = 0 }: { node: NavNode; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.items?.length;
  // roleHref, not a bare path - a plain `/pages/...` string drops the active role, silently
  // falling back to `registered-user` on the destination page. Flagged directly by the user as a
  // dead end: switching sections as `public-user` landed back on `registered-user`'s view. See
  // lib/use-role-href.ts.
  const roleHref = useRoleHref();
  const href = node.key && OPTION_2_KEYS.has(node.key) ? roleHref(`/pages/${node.key}/option-2`) : undefined;
  const isCurrent = !!node.key && node.key === CURRENT_KEY;
  const indent = { paddingLeft: 12 + depth * 12 };

  if (!hasChildren) {
    return href ? (
      <Link
        href={href}
        style={indent}
        aria-current={isCurrent ? "page" : undefined}
        className={cx(
          "block rounded-md py-1.5 pr-3 text-sm",
          isCurrent ? "bg-secondary font-medium text-primary" : "text-primary hover:bg-secondary",
        )}
      >
        {node.label}
      </Link>
    ) : (
      <p style={indent} className="py-1.5 pr-3 text-sm text-tertiary">
        {node.label}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={indent}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-3 text-left text-sm font-medium text-primary hover:bg-secondary"
      >
        {node.label}
        <ChevronDown className={cx("size-3.5 shrink-0 text-quaternary transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="flex flex-col">
          {node.items!.map((child) => (
            <NavDropdownItem key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavTopItem({ node, active = false }: { node: NavNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.items?.length;
  const roleHref = useRoleHref();
  const href = node.key && OPTION_2_KEYS.has(node.key) ? roleHref(`/pages/${node.key}/option-2`) : undefined;
  const labelClassName = cx("relative flex items-center gap-1 px-4 text-sm", active ? "font-medium text-brand-700" : "text-primary");

  if (!hasChildren) {
    const content = (
      <span className={labelClassName}>
        {node.label}
        {active && <span className="absolute inset-x-4 bottom-0 h-0.5 bg-brand-700" />}
      </span>
    );
    return href ? (
      <Link href={href} className="flex items-stretch">
        {content}
      </Link>
    ) : (
      <div className="flex items-stretch">{content}</div>
    );
  }

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className={cx(labelClassName, "outline-hidden")}>
        {node.label}
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
        {active && <span className="absolute inset-x-4 bottom-0 h-0.5 bg-brand-700" />}
      </AriaButton>
      <Popover size="sm" className="w-72 p-2">
        <Dialog className="outline-hidden">
          {node.items!.map((child) => (
            <NavDropdownItem key={child.label} node={child} />
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-2 rounded-[10px] bg-secondary py-1 pr-3 pl-1 outline-hidden">
        <Avatar size="xs" initials="OW" alt="Maya Dewitt" />
        <span className="text-sm text-primary">Dewitt, Maya</span>
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
      </AriaButton>
      <Popover size="sm" className="w-48 p-1">
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}


// Light-themed - this used to live inside the dark gradient banner, now it's secondary content
// White-on-dark - lives inside the gradient greeting banner at the top of the page, a fixed
// convention (personal stats stay at the top, "Needs your attention" is the primary content below
// it, not the other way around).
function KpiStat({
  value,
  label,
  note,
  trend,
  action,
  last = false,
}: {
  value: string;
  label: string;
  note: string;
  trend?: boolean;
  action?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 pr-6 ${last ? "" : "border-r border-white/20"}`}>
      <p className="text-2xl font-medium text-white tabular-nums">{value}</p>
      <p className="text-md font-medium text-white">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-white/60">
        {trend && <TrendUp02 className="size-3.5 text-fg-success-primary" />}
        <span>{note}</span>
        {action && <ArrowNarrowRight className="size-3.5 text-white/60" />}
      </div>
    </div>
  );
}

// One row in the "needs your attention" list - the dashboard's primary content now. `actionHref`
// is only set when there's a real page behind it (project-list, project-detail); DLA requests and
// species nominations don't have one yet, so those rows are status-only, no fake link, same
// "honest, not a placeholder" convention as everywhere else in this build.
//
// Shadow instead of a border - same "cards read as raised, not stamped onto the page" treatment
// as the Data Dashboard's BentoCard fork (see app/pages/dashboard/option-2/bento-card.tsx), kept
// here rather than pulled into that shared shell since this card has its own row layout, not the
// bento column shape. Mirrored from dashboard's own TaskItem (app/pages/_shared/
// home-dashboard.tsx) once that shell added a leading FeaturedIcon and a real 3-step progress
// tracker (ProgressBarBase) - same content/feature, kept in this shell's own shadow-card idiom
// rather than switching to option-1's bordered card.
interface TaskProgressStep {
  label: string;
  detail: string;
  // 100 = done, 0 < n < 100 = in motion now, 0 = not started yet - see home-dashboard.tsx's copy
  // of this same interface for the full reasoning.
  percent: number;
}

interface TaskProgress {
  steps: TaskProgressStep[];
}

function TaskItem({
  title,
  detail,
  status,
  statusColor,
  icon,
  actionLabel,
  actionHref,
  progress,
}: {
  title: string;
  detail: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  icon: FC<{ className?: string }>;
  actionLabel?: string;
  actionHref?: string;
  progress?: TaskProgress;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-primary p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={icon} color="brand" theme="modern" size="md" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-md font-medium text-primary">{title}</p>
              <Badge size="sm" color={statusColor}>{status}</Badge>
            </div>
            <p className="text-sm text-tertiary">{detail}</p>
          </div>
        </div>
        {actionHref && actionLabel && (
          <Button color="link-color" size="sm" href={actionHref} iconTrailing={ArrowNarrowRight} className="shrink-0">
            {actionLabel}
          </Button>
        )}
      </div>
      {progress && (
        <div className="grid grid-cols-1 gap-4 border-t border-secondary pt-4 sm:grid-cols-3">
          {progress.steps.map((step) => {
            const isUpcoming = step.percent === 0;
            const isCurrent = step.percent > 0 && step.percent < 100;
            const isDone = step.percent === 100;
            return (
              <div key={step.label} className="flex flex-col gap-2">
                <span className={cx("flex items-center gap-1.5 text-sm", isCurrent ? "font-semibold text-primary" : "text-quaternary")}>
                  {isDone && <Check className="size-3.5 shrink-0 text-fg-success-primary" />}
                  {isUpcoming ? `Next: ${step.label}` : step.label}
                </span>
                <span className="text-xs text-tertiary">{step.detail}</span>
                <ProgressBarBase value={step.percent} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// "Continue where you left off" - same strip decided at /proto/dashboard-options and folded into
// option-1's HomeDashboardContent, pulled out here into option-2's own idiom (bg-brand-50 strip,
// no bordered/gradient chrome of its own). The draft task's action stays disabled with a
// "Coming soon" tooltip rather than a real link - there's no project-detail/option-2 page yet, and
// linking out to option-1's project-detail would shell-switch a top-nav user into the sidebar shell
// mid-browse, the exact bug already flagged and avoided in project-list/option-2's own Projects
// table (see that file's comment on why its rows are deliberately unlinked).
function ContinueStrip({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-primary">
        <FileSearch01 className="size-4 shrink-0 text-fg-brand-primary" />
        <span>
          Continue where you left off - <span className="font-semibold">{title}</span>
        </span>
      </div>
      <Tooltip title="Coming soon - there's no project detail page on this shell yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} isDisabled>
              Continue
            </Button>
          </span>
        </Focusable>
      </Tooltip>
    </div>
  );
}

// A quick-actions button pointing at a real, already-built destination.
function QuickAction({ icon, label, href }: { icon: FC<{ className?: string }>; label: string; href: string }) {
  return (
    <Button color="secondary" iconLeading={icon} href={href}>
      {label}
    </Button>
  );
}

// A quick-actions button for an operation that's scoped (it's a real item in
// lib/registered-user-nav.ts) but doesn't have a page yet - disabled with a tooltip explaining why,
// rather than either a dead link or leaving it out of the row entirely. `isDisabled` on our Button
// renders `aria-disabled`, not the native `disabled` attribute (see react-aria's useButton), so
// hover still fires on the button itself - but its own internal `useHover` is intentionally
// suppressed while disabled (so it doesn't show a hover/press visual state), which also blocks the
// tooltip from wiring up if it were placed directly on the button. Wrapping in `Focusable` (from
// react-aria-components) gives the tooltip its own independent hover/focus target on the wrapping
// span instead, verified working via Playwright before landing this pattern.
function DisabledQuickAction({ icon, label, note }: { icon: FC<{ className?: string }>; label: string; note: string }) {
  return (
    <Tooltip title={note}>
      <Focusable>
        <span className="inline-flex">
          <Button color="secondary" iconLeading={icon} isDisabled>
            {label}
          </Button>
        </span>
      </Focusable>
    </Tooltip>
  );
}

// Same underlying tasks as dashboard, but with status colors option-1 doesn't have -
// this fork gives each status its own semantic color instead of the flat gray every row used
// before, so the list is scannable by urgency at a glance instead of requiring reading every
// label: "Draft" is the one thing still in the user's own hands (warning - unfinished, needs
// action), "Awaiting review"/"Under review" are both out of the user's hands right now (gray -
// informational, nothing to do), kept visually distinct from each other with blue on the one
// that's actively being worked rather than just queued.
const dashboardTasks: {
  title: string;
  detail: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  icon: FC<{ className?: string }>;
  actionLabel?: string;
  actionHref?: string;
  progress?: TaskProgress;
}[] = [
  {
    title: "DLA request - Coorong Wetlands Bird Count",
    detail: "Submitted 5 days ago, awaiting DEW review.",
    status: "Awaiting review",
    statusColor: "gray",
    icon: FileLock01,
    progress: {
      steps: [
        { label: "Submitted", detail: "5 days ago", percent: 100 },
        { label: "DEW is currently reviewing", detail: "Typically takes up to 10 business days.", percent: 55 },
        { label: "Outcome", detail: "You'll be notified by email once a decision is made.", percent: 0 },
      ],
    },
  },
  {
    title: "Sensitive species nomination - Southern Bell Frog",
    detail: "Submitted 1 week ago, under review by the sensitive species panel.",
    status: "Under review",
    statusColor: "blue",
    icon: Flag01,
    progress: {
      steps: [
        { label: "Submitted", detail: "1 week ago", percent: 100 },
        { label: "Panel is currently reviewing", detail: "Reviewed by the sensitive species panel.", percent: 40 },
        { label: "Outcome", detail: "Nomination is accepted or returned for more information.", percent: 0 },
      ],
    },
  },
  {
    title: "Flinders Ranges Reptile Atlas",
    detail: "Project draft - not yet submitted.",
    status: "Draft",
    statusColor: "warning",
    icon: Folder,
    // No progress data - this task renders via ContinueStrip, not TaskItem (see continueTask
    // below), same split as dashboard.
  },
];

// The one task with somewhere to "continue" gets pulled into its own ContinueStrip above the
// filter tabs; the rest drive both the tab list and its panels, same "state it once, not twice"
// rule as option-1's continueTask/otherTasks split (app/pages/_shared/home-dashboard.tsx).
// taskStatuses/CountBadge are derived from `otherTasks`, not the full `dashboardTasks` - deriving
// from the full list would leave a "Draft" filter tab with zero rows once its one task moves into
// the strip.
const continueTask = dashboardTasks.find((task) => task.status === "Draft");
const otherTasks = dashboardTasks.filter((task) => task !== continueTask);

// Derived from otherTasks itself, not a separately maintained list - the same "one array
// drives everything" rule as dataDashboardTabs/ProjectsTable elsewhere in this file, so a status
// can't appear as a filter tab without a real task behind it (or vice versa). Brings in two ideas
// from the Mobbin dashboard research: Deel's "For you today" framing for the all-items default
// view, and Asana's status-filtered task tabs - both real, both built on the same tasks already
// in dashboardTasks, nothing invented. Per-tab counts use Tabs.Item's own `badge` prop rather than
// a separate Badge element, same as the Table docs page's demo.
const taskStatuses = Array.from(new Set(otherTasks.map((task) => task.status)));

// ── Featured Projects + Knowledge Base - mirrored from dashboard's HomeDashboardContent
// (app/pages/_shared/home-dashboard.tsx), same content/data, rebuilt on this shell's own shadow
// BentoCard instead of switching to option-1's bordered one. Reuses the one real `projects` export
// (app/pages/_shared/project-list-content.tsx) rather than inventing a third copy of this data -
// dashboard/option-2/data-overview.tsx already has its own separate example rows for its own
// Projects tab, so this is deliberately the shared, canonical list, same one option-1 uses. ──
const featuredProjects = projects.filter((project) => project.status === "Active" || project.status === "Completed");

const knowledgeBaseItems = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
  { icon: DownloadCloud02, title: "Dataset templates", description: "Pre-built spreadsheets for common survey types." },
  { icon: LifeBuoy01, title: "Getting help & support", description: "Contact the DEW biodiversity team or browse FAQs." },
];

function FeaturedProjectCard({ project }: { project: (typeof projects)[number] }) {
  // No Link here, unlike option-1's copy of this card - the shared `projects` array's one `href`
  // points at /pages/project-detail, and there's no project-detail/option-2 yet. Linking
  // out to option-1's chrome from this top-nav shell would be the exact jarring shell-switch bug
  // already flagged and avoided in project-list/option-2's own Projects table.
  return (
    <BentoCard className="flex-1 gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge size="sm" color={project.statusColor}>
          {project.status}
        </Badge>
        <span className="text-xs whitespace-nowrap text-quaternary">{project.updated}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-primary">{project.name}</p>
        <p className="text-sm text-tertiary">{project.org}</p>
      </div>
    </BentoCard>
  );
}

function FeaturedProjectsSection({ roleHref }: { roleHref: (path: string) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-medium text-primary">Featured Projects</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/project-list/option-2")} iconTrailing={ArrowNarrowRight}>
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

function KnowledgeBaseCard({ icon: Icon, title, description }: { icon: FC<{ className?: string }>; title: string; description: string }) {
  return (
    <BentoCard className="flex-1 gap-4">
      <Icon className="size-6 text-fg-brand-primary" />
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-brand-secondary">{title}</p>
        <p className="text-sm text-tertiary">{description}</p>
      </div>
    </BentoCard>
  );
}

function KnowledgeBaseSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-medium text-primary">Knowledge Base</p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {knowledgeBaseItems.map((item) => (
          <KnowledgeBaseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}

// ── biodata-admin's "My Dashboard" content - mirrored from dashboard's
// AdminHomeDashboardContent (app/pages/_shared/home-dashboard.tsx), same "Triage" direction
// decided at /proto/admin-dashboard-options, same data/copy, rebuilt in this shell's own idiom
// (gradient greeting banner, shadow BentoCard queue cards) instead of switching to option-1's
// bordered-card/icon-rail chrome - "keep a consistent shell" per the user meant *within* each
// shell's own established visual language, not forcing option-1's exact markup onto option-2. ──
const adminApprovalQueues: { id: string; label: string; count: number; icon: FC<{ className?: string }>; description: string }[] = [
  { id: "users", label: "User access requests", count: 247, icon: Users01, description: "New accounts awaiting approval before they can sign in." },
  { id: "dla", label: "DLA requests", count: 12, icon: FileLock01, description: "Data licencing agreements pending admin review." },
  { id: "nominations", label: "Sensitive species nominations", count: 5, icon: Flag01, description: "Nominations awaiting a panel decision." },
];

const totalPendingReviews = adminApprovalQueues.reduce((sum, queue) => sum + queue.count, 0);

function AdminQueueCard({ queue }: { queue: (typeof adminApprovalQueues)[number] }) {
  return (
    <BentoCard className="flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <FeaturedIcon icon={queue.icon} color="brand" theme="modern" size="md" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-primary">{queue.label}</p>
            <CountBadge count={queue.count} color="brand" />
          </div>
          <p className="text-sm text-tertiary">{queue.description}</p>
        </div>
      </div>
      <Tooltip title="Coming soon - the approvals queue isn't built yet">
        <Focusable>
          <span className="inline-flex shrink-0">
            <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} isDisabled>
              Review
            </Button>
          </span>
        </Focusable>
      </Tooltip>
    </BentoCard>
  );
}

function AdminDashboardPanel() {
  return (
    <>
      <div className="bg-secondary px-9 pt-8">
        <div className="flex flex-col gap-10 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
          <div className="flex flex-col gap-2">
            {/* "Jane" - the sanctioned placeholder persona for biodata-admin, parallel to
                "Olivia Wyatt"/"Maya Dewitt" for registered-user (see CONTEXT.md's "Placeholder
                person convention"). */}
            <p className="text-2xl font-medium text-white">Hi, Jane</p>
            <p className="text-md text-white">Platform activity at a glance</p>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            <KpiStat value="3,482" label="Registered users" note="128 active projects" />
            <KpiStat value="340" label="Datasets this month" note="12 DLA requests pending" />
            <KpiStat value={totalPendingReviews.toLocaleString()} label="Pending reviews" note="Across users, DLA, nominations" last />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-secondary px-9 pt-8">
        <p className="text-lg font-medium text-primary">Quick actions</p>
        <div className="flex flex-wrap items-center gap-3">
          <DisabledQuickAction icon={UserCheck01} label="User Management" note="Coming soon - user management isn't built yet" />
          <DisabledQuickAction icon={BarChartSquare01} label="Reports" note="Coming soon - reporting isn't built yet" />
          <DisabledQuickAction icon={Database01} label="Control Vocal" note="Coming soon - controlled vocabulary management isn't built yet" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 bg-secondary px-9 pt-8 pb-8">
        <div className="flex flex-col gap-4 rounded-2xl bg-brand-50 p-6">
          <p className="text-sm font-medium text-brand-secondary">Needs your review</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-medium text-primary tabular-nums">{adminApprovalQueues[0].count.toLocaleString()}</p>
              <p className="text-base text-secondary">User access requests awaiting approval</p>
            </div>
            <Tooltip title="Coming soon - the approvals queue isn't built yet">
              <Focusable>
                <span className="inline-flex">
                  <Button color="primary" iconTrailing={ArrowNarrowRight} isDisabled>
                    Review requests
                  </Button>
                </span>
              </Focusable>
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-lg font-medium text-primary">Also pending</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {adminApprovalQueues.slice(1).map((queue) => (
              <AdminQueueCard key={queue.id} queue={queue} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Home's two views, same pairing as option-1's sidebar Tabs (My Dashboard / Data Overview, see
// app/pages/_shared/home-tab-panels.tsx). "Data Dashboard" was originally that same
// DataOverviewContent shared with option-1 verbatim; now renders this shell's own fork instead
// (app/pages/dashboard/option-2/data-overview.tsx) - shadow-based cards, hoverable pie legends,
// tab fade transitions - a visual polish pass scoped to option-2 only, so option-1's Data
// Dashboard is untouched. Its own sub-tabs (Overview/Flora/Fauna/Projects) were already built
// reusing this shell's NavTopItem underline style (see that file's comment), so this outer switch
// reuses the same visual language rather than option-1's sidebar tab-list treatment, which has no
// equivalent in a top-nav shell with no sidebar column to put it in.
const homeViewTabs = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "overview", label: "Data Dashboard" },
];

// Wrapped in Suspense - DataOverviewContent (this page's Data Dashboard tab) now reads the active
// role via useFeatureAccess -> useUserRole -> useSearchParams, which opts a page out of static
// rendering unless something above it suspends, same requirement option-1's dashboard already
// has (see that file's own Suspense wrapper). Role-awareness wasn't wired into option-2 at all
// before this - per the user directly ("build out userRole=biodata-admin"), option-2 needed the
// same `?userRole=` support option-1 already has, not a separate mechanism.
export default function DashboardOption2Page() {
  return (
    <Suspense fallback={null}>
      <DashboardOption2 />
    </Suspense>
  );
}

function DashboardOption2() {
  // public-user ("Guest User") reads a different, smaller nav tree entirely - not a filtered view
  // of registeredUserNav, since whole sections don't exist for a signed-out visitor, not just
  // individual leaves inside them. Ported from option-1's dashboard/project-list pages, same
  // reasoning - see lib/registered-user-nav.ts's publicUserNav.
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  // roleHref, not a bare path - see NavTopItem's comment above for the dead-end this fixes.
  const roleHref = useRoleHref();

  return (
    <div className="font-barlow flex min-h-screen flex-col">
      <RoleSwitcher />
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary pr-9 pl-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")}
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <Button color="secondary" iconLeading={Bell01} />
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold text-white">
              3
            </span>
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      {/* ── Primary nav (nav chrome - not pixel-matched) ── */}
      <nav className="flex h-11 shrink-0 items-stretch border-b border-secondary bg-primary px-6" aria-label="Primary">
        {nav.map((section) => (
          <NavTopItem key={section.label} node={section} active={section.label === "Home"} />
        ))}
      </nav>

      {/* ── Home views: My Dashboard (personal tasks) / Data Dashboard (org-wide numbers). Built
          on the real design-system Tabs component (components/application/tabs/tabs.tsx) instead
          of hand-rolled react-aria-components markup - flagged directly by the user once that
          component existed to use. `type="button-border"` is its segmented-control style (a
          bg-secondary track, the selected item raised on bg-primary_alt with a shadow), not the
          `underline` type the primary nav above it or the Data Dashboard's own
          Overview/Flora/Fauna/Projects sub-tabs below use - a second underline bar directly under
          the primary nav read as another nav level, not a content view switcher (same reasoning
          as the no-wrapper-bar fix below). No border/background bar around the tab list either -
          flagged separately by the user: just the toggle control itself sitting above the
          greeting card, not another full-width chrome section. No wrapping container div for it
          either (removed per the user, flagged repeatedly) - `mx-9 mt-6` lives directly on
          Tabs.List's own className instead, positioning the track itself without an extra DOM
          layer just to hold padding. Only the selected TabPanel mounts, and each is itself `flex
          flex-1 flex-col` so whichever one is active still fills the remaining height and keeps
          the footer pinned to the bottom (same fix as the plain "Needs your attention" div had
          before this became tabbed).

          public-user skips this toggle and its "My Dashboard" personal panel entirely, rendering
          only Data Dashboard content directly - a signed-out guest has no personal tasks/projects
          for "My Dashboard" to show, so a two-tab switcher with only one honest tab would be
          dishonest UI (a control implying a choice that doesn't exist), same principle option-1
          already applies to its own Home/Projects for this role. ── */}
      {isPublicUser ? (
        <div className="flex flex-1 flex-col">
          <DataOverviewContent />
        </div>
      ) : (
      <Tabs defaultSelectedKey="dashboard" className="flex-1">
        {/* mt-6, no mb - every section below only pads its own top (see the banner/Quick
            actions/Needs your attention comments), so the gap to whatever follows is always that
            next section's own top padding, never two paddings stacked. Kept this one at mt-6 (24px)
            rather than the 32px rhythm used between content sections below, since this sits right
            under the primary nav's border - a harder visual break that doesn't need as much air as
            two content sections meeting mid-page. mx-9 (not px-9, since there's no wrapping div to
            hold padding anymore) lines its left edge up with every section below. w-fit -
            Tabs.List's horizontal layout is a block-level flex, not inline-flex, so without this it
            stretches to fill the row instead of hugging the two tabs, undoing the compact-toggle
            look. */}
        <Tabs.List aria-label="Home views" type="button-border" size="sm" className="mx-9 mt-6 w-fit">
          {homeViewTabs.map((tab) => (
            <Tabs.Item key={tab.id} id={tab.id} label={tab.label} />
          ))}
        </Tabs.List>

        <Tabs.Panel id="dashboard" className="flex flex-1 flex-col animate-in fade-in duration-200 ease-out">
          {role === "biodata-admin" ? (
            <AdminDashboardPanel />
          ) : (
            <>
              {/* ── Greeting/KPI banner: personal activity stats stay at the top, fixed convention -
                  not the dashboard's primary content (that's "Needs your attention" below), but
                  always first. pt-8 only (no pb) - see the toggle wrapper's comment above: each
                  section provides its own top gap, so the next section's own pt-8 is what creates the
                  space, not this one's trailing padding stacked on top of it. ── */}
              <div className="bg-secondary px-9 pt-8">
                <div className="flex flex-col gap-10 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <p className="text-2xl font-medium text-white">Hi, Olivia</p>
                      <p className="text-md text-white">Your activity at a glance</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button color="secondary" iconLeading={Plus}>Add project</Button>
                      <Button color="secondary" iconLeading={Upload01}>Upload dataset</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <KpiStat value="15" label="Species Observed" note="3 up from last week" trend />
                    <KpiStat value="3" label="Datasets contributed" note="1 dataset under review" />
                    <KpiStat value="2" label="Completed Checklists" note="View all checklists" action last />
                  </div>
                </div>
              </div>

              {/* ── Quick actions: real, intentional entry points a registered user actually takes
                  from here - not the old generic "Quick action 3"/"Quick action 4" placeholders this
                  replaces (see git history on this file). "Manage projects & datasets" links to the
                  real project-list page; "Request new DLA" and "Nominate a species" are real items in
                  lib/registered-user-nav.ts that don't have a page yet, so they're disabled with a
                  tooltip rather than a dead link - same "honest, not a placeholder link" rule as
                  TaskItem below, applied to a disabled control instead of an omitted one. "Add
                  project"/"Upload dataset" already cover project/dataset creation up in the banner, so
                  they're not repeated here. ── */}
              <div className="flex flex-col gap-3 bg-secondary px-9 pt-8">
                <p className="text-lg font-medium text-primary">Quick actions</p>
                <div className="flex flex-wrap items-center gap-3">
                  <QuickAction icon={Folder} label="Manage projects & datasets" href={roleHref("/pages/project-list/option-2")} />
                  <DisabledQuickAction icon={FileLock01} label="Request new DLA" note="Coming soon - the DLA request flow isn't built yet" />
                  <DisabledQuickAction icon={Flag01} label="Nominate a species" note="Coming soon - the nomination flow isn't built yet" />
                </div>
              </div>

              {/* ── Continue where you left off - mirrored from option-1's ContinueStrip (see that
                  component's own comment above for why its action is disabled here). Sits between
                  Quick actions and Needs your attention, same placement as option-1. ── */}
              {continueTask && (
                <div className="bg-secondary px-9 pt-8">
                  <ContinueStrip title={continueTask.title} />
                </div>
              )}

              {/* ── Needs your attention: the dashboard's primary content (nav chrome - not
                  pixel-matched). pt-8 matches the same section-gap rhythm as above; gap-3 (not gap-4) for
                  the heading-to-content gap matches Quick actions' own heading-to-buttons gap just
                  above - these two "label directly over its content" gaps used to be 16px/12px,
                  flagged as part of the same inconsistent-spacing pass.

                  Filter tabs bring in two ideas from the Mobbin dashboard research the user asked to
                  incorporate: a "For you" all-items default (Deel's "For you today" framing) plus
                  per-status tabs (Asana's Upcoming/Overdue/Completed pattern), rebuilt on our own real
                  statuses (taskStatuses, derived from otherTasks above) since we have no due-date
                  data to build Asana's exact Upcoming/Overdue split honestly. Nested `Tabs` (inside
                  the outer Home views Tabs) - react-aria's Tabs each keep their own independent
                  collection, so this doesn't collide with the outer tab switcher, same as the Data
                  Dashboard's own sub-tabs nest inside it without conflict. ── */}
              <div className="flex flex-col gap-3 bg-secondary px-9 pt-8">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium text-primary">Needs your attention</p>
                  {/* CountBadge, not Badge - see app/pages/_shared/home-dashboard.tsx's copy of this
                      same fix (components/base/badges/badges.tsx's CountBadge) for why. color="error"
                      matches the icon rail's notification dot - flagged directly by the user as too
                      low-contrast in gray. Counts `otherTasks`, not the full `dashboardTasks` - see
                      that array's own comment on why. */}
                  <CountBadge count={otherTasks.length} color="error" />
                </div>
                <Tabs defaultSelectedKey="all" className="flex flex-col gap-3">
                  <Tabs.List aria-label="Filter by status" type="underline" size="sm">
                    <Tabs.Item id="all" label="For you" badge={otherTasks.length} />
                    {taskStatuses.map((status) => (
                      <Tabs.Item key={status} id={status} label={status} badge={otherTasks.filter((task) => task.status === status).length} />
                    ))}
                  </Tabs.List>
                  <Tabs.Panel id="all" className="flex flex-col gap-3">
                    {otherTasks.map((task) => (
                      <TaskItem key={task.title} {...task} />
                    ))}
                  </Tabs.Panel>
                  {taskStatuses.map((status) => (
                    <Tabs.Panel key={status} id={status} className="flex flex-col gap-3">
                      {otherTasks
                        .filter((task) => task.status === status)
                        .map((task) => (
                          <TaskItem key={task.title} {...task} />
                        ))}
                    </Tabs.Panel>
                  ))}
                </Tabs>
              </div>

              {/* ── Featured Projects + Knowledge Base - mirrored from option-1's
                  HomeDashboardContent (see the top-level comment on this file's own copy of these
                  sections for what's reused vs. rebuilt). flex-1 on this last section (not the
                  Needs-your-attention one above it) keeps the footer pinned to the bottom of the
                  viewport when content is short, same fix this file already had, just moved to
                  whichever section is now actually last. ── */}
              <div className="flex flex-1 flex-col gap-8 bg-secondary px-9 pt-8 pb-8">
                <FeaturedProjectsSection roleHref={roleHref} />
                <KnowledgeBaseSection />
              </div>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="overview" className="flex flex-1 flex-col animate-in fade-in duration-200 ease-out">
          <DataOverviewContent />
        </Tabs.Panel>
      </Tabs>
      )}

      {/* ── Footer (nav chrome - not pixel-matched) ── */}
      <footer className="flex flex-wrap items-center gap-6 border-t border-secondary bg-primary px-9 py-4 text-[10px] font-semibold tracking-wide text-quaternary uppercase">
        {registeredUserFooterLinks.map((link) => (
          <p key={link}>{link}</p>
        ))}
      </footer>
    </div>
  );
}
