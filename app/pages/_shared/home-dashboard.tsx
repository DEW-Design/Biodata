"use client";

import type { FC } from "react";
import { Focusable } from "react-aria-components";
import Link from "next/link";
import {
  TrendUp02,
  ArrowNarrowRight,
  Folder,
  FileLock01,
  Feather,
  FileSearch01,
  BookOpen01,
  FileCheck02,
  DownloadCloud02,
  LifeBuoy01,
  Check,
  Users01,
  UserCheck01,
  BarChartSquare01,
  Database01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { projects } from "@/app/pages/_shared/project-list-content";
import { cx } from "@/utils/cx";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// The real Home/BioData Dashboard content - the single source every option-1 sidebar shell
// (dashboard, project-list, project-detail) renders for the "Home" section, instead of the
// generic SectionPlaceholder. Home is real, built content, not an unscoped section - clicking the
// Home icon (or the Home breadcrumb) from any of those three screens must always show this exact
// content, not a "this lives on another page, go there" placeholder. Flagged directly by the user
// off a screenshot of this content, after a placeholder was shown instead on project-list/
// project-detail. Not shared with dashboard/option-2 (top-nav shell) - clicking Home there is a
// real page navigation to its own dashboard, which already renders this correctly; the bug this
// fixes is specific to option-1's in-place, no-navigation section switching.
//
// The "This is where alerts go" banner used to live here, with its own local dismiss state - moved
// out to app/pages/_shared/home-tab-panels.tsx instead, since it also needs to show on the Data
// Overview tab and dismissing it on either tab must dismiss it on both (one shared piece of state
// above both tab panels, not two independent copies) - flagged directly by the user.
//
// Quick actions used to also repeat "Add project"/"Upload dataset" here, duplicating the
// persistent header actions every option-1 page already has - flagged directly by the user
// (`/pages/project-list/option-1`) as redundant, so they're removed from this row rather than
// kept "flagged, not hidden" as before. "Manage projects & datasets" and the two disabled actions
// below aren't duplicates of anything in the header, so they stay. That button group's gap is
// `gap-2` (the 8px token), not `gap-3` (12px) - flagged directly by the user off a screenshot.
//
// TaskItem's action ("Continue", "Go to X") uses `iconTrailing={ArrowNarrowRight}`, not a literal
// "→" appended to the label text - Button already supports a trailing icon on every color variant
// including `link-color`, so the arrow is a real icon like everywhere else, not a text character
// standing in for one. See CONTEXT.md's "Final check" list.

function KpiStat({
  value,
  label,
  note,
  trend,
  last = false,
}: {
  value: string;
  label: string;
  note: string;
  trend?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 pr-6 ${last ? "" : "border-r border-secondary"}`}>
      <p className="text-2xl font-medium text-primary tabular-nums">{value}</p>
      <p className="text-md font-medium text-primary">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-tertiary">
        {trend && <TrendUp02 className="size-3.5 text-fg-success-primary" />}
        <span>{note}</span>
      </div>
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
// rather than either a dead link or leaving it out of the row entirely. See dashboard/option-2's
// copy of this pattern for why the tooltip is wired to a `Focusable` wrapper instead of straight to
// the disabled button (its own hover is suppressed while disabled).
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

// One row in the "needs your attention" list. `actionHref` is only set when there's a real page
// behind it (project-list, project-detail); DLA requests and species nominations don't have one
// yet, so those rows are status-only, no fake link, same "honest, not a placeholder" convention as
// everywhere else in this build.
// A leading FeaturedIcon per task, colour="brand" - flagged directly by the user off a page
// screenshot ("what if these cards were more visual?" / "what if the icons were primary colour?").
// Real component (components/foundations/featured-icon/featured-icon.tsx), the same one
// ContinueCard already uses in this file - not a second hand-rolled icon-in-a-box treatment.
// A task's progress through a real, but currently-invented, 2-step flow: the step it's on now
// (a filled ProgressBarBase, warning-coloured since it's the thing genuinely in motion) and what
// comes after (an empty ProgressBarBase, greyed - nothing to report yet). Content here is a
// placeholder per the user directly ("invent a reasonable 2-step flow... clearly a placeholder,
// refine later") - the real DLA/nomination review steps and timelines haven't been confirmed.
interface TaskProgressStep {
  label: string;
  detail: string;
  // 100 = done, 0 < n < 100 = the step actually in motion right now, 0 = not started yet.
  // Which of those three a step is drives its own display (see TaskItem below) - not a separate
  // enum to keep in sync with the number.
  percent: number;
}

interface TaskProgress {
  steps: TaskProgressStep[];
}

// Rebuilt from a reference card the user shared (a different project's "action required" pattern:
// coloured banner + title/subtitle + a 2-step progress tracker) - pulled apart into what already
// exists in this design system vs. what didn't. The banner (AlertFullWidth, color="warning") is
// real but deliberately not used here: neither DLA requests nor species nominations need the
// user's action right now - both are "submitted, waiting on someone else's review" - so an
// "Action required" banner would misrepresent their actual state. `ProgressBarBase` (the piece
// that didn't exist in this codebase before the user pulled it in) is what's new here - used bare
// (no built-in label), since ProgressBar's own label positions only show a percentage, not custom
// step text like "Your action"/"Next: X".
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
    <div className="flex flex-col gap-4 rounded-lg border border-secondary p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={icon} color="brand" theme="modern" size="md" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-medium text-primary">{title}</p>
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
                  {/* Small tick on the done step - flagged directly by the user as a UX tweak on
                      the "Submitted" step specifically, but keyed off isDone (not the label) so any
                      step that reaches 100% gets the same treatment, not just the first one. */}
                  {isDone && <Check className="size-3.5 shrink-0 text-fg-success-primary" />}
                  {isUpcoming ? `Next: ${step.label}` : step.label}
                </span>
                {/* Detail always renders, every step - a tooltip-only detail on just the upcoming
                    step (the reference card's own treatment) left that column one row shorter
                    than the other two, so its progress bar sat higher than theirs in the shared
                    grid row. Flagged directly by the user: "Outcome bar isn't aligned properly."
                    Showing the same real detail text plainly for all three keeps every column's
                    height identical, so the bars line up by construction instead of needing a
                    flex/height patch to force it. */}
                <span className="text-xs text-tertiary">{step.detail}</span>
                {/* No progressClassName override - ProgressBarBase's own default fill
                    (bg-fg-brand-primary) is already our primary colour. The reference card's
                    orange fill was a detail of that other project's own styling, not something to
                    copy - flagged directly by the user: it was a pattern reference, not a style
                    one, same "extract pattern, not pixels" rule this build already follows for
                    every external reference (Mobbin, Figma, screenshots). */}
                <ProgressBarBase value={step.percent} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// "Continue where you left off" - pulled out of the flat Needs-your-attention list into its own
// strip, decided via /get-creative at /proto/dashboard-options (Alert/Card/Banner/Strip explored;
// Strip won for being the lightest-weight, most elegant option). The task shown here is
// deliberately left out of the Needs-your-attention list below it (see `otherTasks` in
// HomeDashboardContent) - stating the same task in two treatments on one page is exactly the
// redundancy bug this pattern replaced (an earlier pass had it as a giant duplicate hero banner
// instead of this strip).
//
// Background is bg-brand-50 (a light brand tint), not bg-brand-solid (a solid brand fill) - the
// first pass used bg-brand-solid with the trailing action overridden to white text to stay
// legible, which the user flagged directly as violating the design system (patching a real
// component's colours instead of using it as shipped - see `color="link-color"` below, no
// overrides). Reverting the button to its plain, unmodified form made the real problem visible:
// `link-color`'s text token (`--color-brand-700`) has almost no contrast against `bg-brand-solid`
// (`--color-brand-600`) - "Continue button not visible now, haha," per the user directly. Fixed by
// changing the strip's background to `bg-brand-50` instead of touching the button at all - the
// lightest tint on the same brand scale `link-color`'s text already belongs to, so the pairing
// works because the tokens were designed to sit together, not because anything was overridden.
function ContinueStrip({ title, actionLabel, actionHref }: { title: string; actionLabel: string; actionHref: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-primary">
        {/* text-fg-brand-primary - see KnowledgeBaseCard's comment below for why not
            text-fg-brand-secondary (a non-existent class - resolves to nothing). */}
        <FileSearch01 className="size-4 shrink-0 text-fg-brand-primary" />
        <span>
          Continue where you left off - <span className="font-semibold">{title}</span>
        </span>
      </div>
      {/* color="link-color", used exactly as-is - same as "View all projects" below, no className
          overrides needed. Its text token is --color-brand-700; this strip's own bg-brand-50 is
          the lightest tint on that same brand scale (the same pairing already used elsewhere in
          this codebase, e.g. the filter chips' old selected state: bg-brand-50 + text-brand-700) -
          real contrast because the two tokens were designed to sit together, not because either
          was overridden. */}
      <Button color="link-color" size="sm" href={actionHref} iconTrailing={ArrowNarrowRight}>
        {actionLabel}
      </Button>
    </div>
  );
}

// ── Featured Projects + Knowledge Base - the rest of the /proto/dashboard-options exploration,
// decided alongside the Strip (the user: "the entire exploration... not just that strip
// component"). Cards only for Knowledge Base, per the user - the real guide/template content and
// download flow come later; icons distinguish "read this" (BookOpen01) from "fill this in
// correctly" (FileCheck02) from "get a file" (DownloadCloud02) from "get help" (LifeBuoy01) rather
// than reusing one generic icon four times. Titles at text-base (not text-sm, not text-lg) - a
// step up from this codebase's dense metadata-card convention since these are discovery cards
// meant to invite a click, but not the same size as the text-lg section heading above them - see
// /proto/dashboard-options's own comment trail for the two rounds that landed on this size. ──
const knowledgeBaseItems = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
  { icon: DownloadCloud02, title: "Dataset templates", description: "Pre-built spreadsheets for common survey types." },
  { icon: LifeBuoy01, title: "Getting help & support", description: "Contact the DEW biodiversity team or browse FAQs." },
];

// Draft and Under review projects are excluded regardless of recency - neither is
// published/verified yet, so neither belongs in "Featured". Flagged directly by the user: "Featured
// projects won't have drafts / under review projects in there, would it?" - they would have, on a
// naive `slice(0, n)` by array position.
const featuredProjects = projects.filter((project) => project.status === "Active" || project.status === "Completed");

function KnowledgeBaseCard({ icon: Icon, title, description }: { icon: FC<{ className?: string }>; title: string; description: string }) {
  return (
    <BentoCard className="flex-1 gap-4">
      {/* text-fg-brand-primary, not text-fg-brand-secondary - flagged directly by the user: the
          icons weren't reading as coloured at all. Checked why: `--color-fg-brand-secondary`
          (no suffix) is never defined in app/globals.css - only `_alt` and `_hover` variants
          exist - so the class compiled to nothing, same category of gap as `text-md`.
          `--color-fg-brand-primary` (brand-600) is the real, defined "fg" token for this - a real
          `@theme` colour entry, not a hand-written @utility, so bg-/text-/border-/ring- variants
          and opacity modifiers all work on it for free (see globals.css's own "Foreground"
          comment). */}
      <Icon className="size-6 text-fg-brand-primary" />
      <div className="flex flex-col gap-1.5">
        {/* text-brand-secondary, not text-primary - flagged directly by the user: title text
            should be primary colour too, same as the icon above it. Different token family on
            purpose - text-fg-brand-primary is the "fg" token (shared across bg-/text-/border-/
            ring- for icon-like uses); text-brand-secondary (--ui-text-brand-secondary, brand-700)
            is this codebase's dedicated *text* colour token, already used everywhere brand-
            coloured text appears (e.g. the "View all projects" link button). */}
        <p className="text-base font-semibold text-brand-secondary">{title}</p>
        <p className="text-sm text-tertiary">{description}</p>
      </div>
    </BentoCard>
  );
}

function FeaturedProjectCard({ project }: { project: (typeof projects)[number] }) {
  const content = (
    <BentoCard className={`flex-1 gap-4 ${project.href ? "transition-colors duration-150 group-hover:border-secondary_hover" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <Badge size="sm" color={project.statusColor}>
          {project.status}
        </Badge>
        <span className="text-xs whitespace-nowrap text-quaternary">{project.updated}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={`text-base font-semibold text-primary ${project.href ? "group-hover:text-brand-700 group-hover:underline" : ""}`}>{project.name}</p>
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

function FeaturedProjectsSection({ roleHref }: { roleHref: (path: string) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-primary">Featured Projects</h2>
        <Button color="link-color" size="sm" href={roleHref("/pages/project-list/option-1")} iconTrailing={ArrowNarrowRight}>
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
        {knowledgeBaseItems.map((item) => (
          <KnowledgeBaseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}

// ── biodata-admin's Home content - the "Triage" direction decided at
// /proto/admin-dashboard-options (5 variants explored: Baseline/Operational Overview/Queue-First/
// Triage/Command Center - Triage won). Renders through the exact same shell every other role's
// Home content does (the same `border-b p-6` header block + `gap-8 p-6` content block below,
// inside the same page.tsx header/icon-rail/breadcrumb chrome) - deliberately not a bespoke
// admin-only layout, so the two personas stay one codebase to maintain, not two. Flagged directly
// by the user: "we need to keep a consistent shell - that's so that development is easier."
// Content grounded in the real admin IA (project_biodata_admin_scope memory: User Management, DLA
// approve/reject, Reports, Control Vocal) - numbers are realistic-scale placeholders (247 pending
// user access requests, not 3), the same "worst content survives" rule used everywhere else in
// this build, since an admin's cognitive-overload risk is different from a registered user's.
//
// None of User Management/Reports/Control Vocal/the approvals queue have a real page yet - every
// action here is disabled with a "Coming soon" tooltip, same honest-gap convention as
// DisabledQuickAction above, not a dead link.
const adminApprovalQueues: { id: string; label: string; count: number; icon: FC<{ className?: string }>; description: string }[] = [
  { id: "users", label: "User access requests", count: 247, icon: Users01, description: "New accounts awaiting approval before they can sign in." },
  { id: "dla", label: "DLA requests", count: 12, icon: FileLock01, description: "Data licencing agreements pending admin review." },
  { id: "nominations", label: "Sensitive species nominations", count: 5, icon: Feather, description: "Nominations awaiting a panel decision." },
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

function AdminHomeDashboardContent() {
  return (
    <>
      <div className="flex flex-col border-b border-secondary p-6">
        {/* "Jane" - the sanctioned placeholder persona for the biodata-admin role, parallel to
            "Olivia Wyatt" for registered-user (see CONTEXT.md's "Placeholder person convention") -
            never the real current user's name. */}
        <h1 className="mb-4 text-2xl font-medium text-primary">Hi, Jane</h1>
        <div className="mb-6 flex flex-wrap items-start gap-x-6 gap-y-4">
          <KpiStat value="3,482" label="Registered users" note="128 active projects" />
          <KpiStat value="340" label="Datasets this month" note="12 DLA requests pending" />
          <KpiStat value={totalPendingReviews.toLocaleString()} label="Pending reviews" note="Across users, DLA, nominations" last />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DisabledQuickAction icon={UserCheck01} label="User Management" note="Coming soon - user management isn't built yet" />
          <DisabledQuickAction icon={BarChartSquare01} label="Reports" note="Coming soon - reporting isn't built yet" />
          <DisabledQuickAction icon={Database01} label="Control Vocal" note="Coming soon - controlled vocabulary management isn't built yet" />
        </div>
      </div>

      <div className="flex flex-col gap-8 p-6">
        <div className="flex flex-col gap-4 rounded-lg bg-brand-50 p-6">
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
          <h2 className="text-lg font-medium text-primary">Also pending</h2>
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

// One array driving both the rendered list and its count badge, so the heading can never drift
// out of sync with what's actually shown. Exported so the icon rail (dashboard/project-list/
// project-detail option-1) can badge the Home icon with this same count instead of a second,
// possibly-stale copy of it.
export const dashboardTasks: {
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
    // Same icon as the "Request new DLA" quick action above - one icon per concept, not a
    // different one depending on where that concept shows up on the page.
    icon: FileLock01,
    // Placeholder 3-step flow, not the real DLA review process - see TaskProgress's own comment.
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
    statusColor: "gray",
    icon: Feather,
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
    statusColor: "gray",
    icon: Folder,
    actionLabel: "Continue",
    actionHref: "/pages/project-detail/option-1",
    // No progress data - this task renders via ContinueStrip, not TaskItem, so there's no tracker
    // to show it in.
  },
];

export function HomeDashboardContent() {
  // A plain `href="/pages/project-list/option-1"` (or `task.actionHref` below) drops the active
  // role - there's no real auth/session in this build, so the URL is the only place it lives (see
  // lib/use-role-href.ts). Flagged directly by the user as a dead end: navigating away as
  // `public-user` silently landed back on `registered-user`'s view.
  const roleHref = useRoleHref();

  // biodata-admin gets entirely different content (see AdminHomeDashboardContent above) - a
  // registered user's own species-observed/DLA-request activity means nothing to an admin managing
  // the whole platform. Branches here, inside the one shared Home content component, rather than
  // as a separate admin page/shell - the surrounding chrome (header, icon rail, breadcrumb) in
  // dashboard/project-list/project-detail's option-1 shells stays identical for every role;
  // flagged directly by the user as a "keep a consistent shell" requirement, for development ease.
  const role = useUserRole();
  if (role === "biodata-admin") {
    return <AdminHomeDashboardContent />;
  }

  // The one task with somewhere real to go gets pulled into its own ContinueStrip above; the
  // Needs-your-attention list below shows the rest, so it isn't stated twice. The icon rail's own
  // notification dot (and project-detail's sidebar copy of it) still badges off the full
  // `dashboardTasks.length` (3) - that's a different, correctly-scoped question ("how many things
  // need attention across the app"), not this list's own "how many rows am I showing" count.
  const continueTask = dashboardTasks.find((task) => task.actionHref);
  const otherTasks = dashboardTasks.filter((task) => task !== continueTask);

  return (
    <>
      <div className="flex flex-col border-b border-secondary p-6">
        <h1 className="mb-4 text-2xl font-medium text-primary">Hi, Olivia</h1>
        <div className="mb-6 flex flex-wrap items-start gap-x-6 gap-y-4">
          <KpiStat value="15" label="Species Observed" note="3 up from last week" trend />
          <KpiStat value="3" label="Datasets contributed" note="1 dataset under review" />
          <KpiStat value="2" label="Completed Checklists" note="2 completed this month" last />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickAction icon={Folder} label="Manage projects & datasets" href={roleHref("/pages/project-list/option-1")} />
          <DisabledQuickAction icon={FileLock01} label="Request new DLA" note="Coming soon - the DLA request flow isn't built yet" />
          <DisabledQuickAction icon={Feather} label="Nominate Sensitive Species" note="Coming soon - the nomination flow isn't built yet" />
        </div>
      </div>

      <div className="flex flex-col gap-8 p-6">
        {continueTask?.actionHref && continueTask.actionLabel && (
          <ContinueStrip title={continueTask.title} actionLabel={continueTask.actionLabel} actionHref={roleHref(continueTask.actionHref)} />
        )}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-primary">Needs your attention</h2>
            {/* CountBadge, not Badge - a padding-tuned Badge still rendered as an oval, not a
                circle. Flagged directly by the user: bring in the true-circle counter pattern
                already used elsewhere (the icon rail's notification dot) instead of another
                padding tweak. color="error" matches that same icon-rail dot - flagged directly by
                the user as too low-contrast in gray. See components/base/badges/badges.tsx's
                CountBadge. Counts `otherTasks`, not the full list - see the comment above on why. */}
            <CountBadge count={otherTasks.length} color="error" />
          </div>
          <div className="flex flex-col gap-3">
            {otherTasks.map((task) => (
              <TaskItem key={task.title} {...task} actionHref={task.actionHref ? roleHref(task.actionHref) : undefined} />
            ))}
          </div>
        </div>
        <FeaturedProjectsSection roleHref={roleHref} />
        <KnowledgeBaseSection />
      </div>
    </>
  );
}
