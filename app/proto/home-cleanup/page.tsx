"use client";

import { Suspense, useState, type FC, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Focusable, type Key } from "react-aria-components";
import {
  ArrowNarrowRight,
  BookOpen01,
  Check,
  DownloadCloud02,
  Feather,
  FileCheck02,
  FileLock01,
  FileSearch01,
  Flag01,
  LayoutAlt01,
  LifeBuoy01,
  PieChart03,
  TrendUp02,
  User01,
  UserCheck01,
} from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { Accordion } from "@/components/base/accordion/accordion";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";
import { GuestAboutAside, GuestGradientCard } from "@/app/pages/_shared/guest-home";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { dashboardTasks, HomeDashboardContent, PENDING_DLA, PENDING_NOMINATION, USER_ACCESS_REQUESTS, useAdminPendingCounts } from "@/app/pages/_shared/home-dashboard";
import { agreementStatusMeta } from "@/app/pages/_shared/agreement-status";
import { formatShortDate } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { nominationStatusMeta, nominationSubject } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { waited } from "@/app/pages/project-detail/review-view";
import { projects } from "@/app/pages/_shared/project-list-content";
import { useOpenFlaggedConcepts } from "@/app/pages/project-detail/flagged-home-queue";
import { keyHref, navForRole } from "@/lib/registered-user-nav";
import { isBiodataAdmin, type UserRole } from "@/lib/user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// LAB: Home (the My BioData landing) for the three personas, as options on the real shell. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.
//
// History. The registered user's Home was audited on 5 Oct 2026 (`2026-10-05-08`): quick actions that repeat the Add menu, a heading ("Needs your attention") over things that need nothing, one count said three ways, one fact
// in three treatments, step labels under contrast, Title Case, link-coloured titles that link nowhere. That audit's cleaned version (its option B) is now the live page (`2026-10-25-03`), so it is not an option here any more
// (4.4: a chosen direction is not kept as a rival). This lab carries what is still open, for each role, read from the Prototype tools bar's "Viewing as":
//   Registered   A Live (the real Home)             B Leaner: no Quick actions (the Add menu has them), tighter lower blocks
//                                                    C Who is acting: what is waiting on you, what is waiting on DEW, what is decided (folded), after Mercor, Coinbase and Mercury
//   BioData Admin A Live (the real Home)            B Cleaned: platform numbers with no unrelated notes, every queue in one list with one total
//                                                    C Queue first: no banner; what is waiting is the page, the platform numbers a quiet row
//                                                    D Inbox: each queue a section with its oldest items and a count, after Graphite, Plain and Zendesk
//   Public        A Live (the real Home)            B Slim invitation: the sign-up ask as one line, so the dashboard is what a visitor reads first
//                                                    C Invitation after the value: the dashboard first, the ask at its foot, after Miro
// C for the registered user, D for the admin and C for the visitor are the Mobbin patterns proposed in `2026-10-25-05`, built on our components (the references gave structure, not styling, 2.6).
// What the admin audit found in the live page (the same foundations as 5 Oct): the notes under two of the three numbers are about something else ("128 active projects" under Registered users, "3 DLA requests pending"
// under Datasets this month); "Pending reviews 254" leaves out the 16 flagged concepts that are also waiting; the page's loudest element is 247 user access requests with a disabled button, because that queue is not
// built; the same kind of thing (a queue) is drawn four ways (a tile, two cards, a table); Quick actions repeat the rail. A signed-out visitor has no My BioData: their Home is the Flora and Fauna dashboard with the
// sign-up card (the role matrix), so their options are about the order of the two. Platform numbers (3,482 users, 128 projects, 340 datasets, 247 access requests) are the live page's own placeholders; the DLA,
// nomination and flagged counts are read from their stores, as the live page reads them.

type Persona = "registered" | "admin" | "public";
interface Option {
  id: string;
  label: string;
  short: string;
  description: string;
}
const OPTIONS: Record<Persona, Option[]> = {
  registered: [
    { id: "live", label: "A: Live", short: "A", description: "The real Home" },
    { id: "leaner", label: "B: Leaner", short: "B", description: "No Quick actions, lower blocks tightened" },
    { id: "actor", label: "C: Who is acting", short: "C", description: "Waiting on you, waiting on DEW, decided (folded)" },
  ],
  admin: [
    { id: "live", label: "A: Live", short: "A", description: "The real Home" },
    { id: "cleaned", label: "B: Cleaned", short: "B", description: "True notes, every queue in one list with one total" },
    { id: "queue", label: "C: Queue first", short: "C", description: "What is waiting is the page; platform numbers a quiet row" },
    { id: "inbox", label: "D: Inbox", short: "D", description: "Each queue a section with its oldest items and a count" },
  ],
  public: [
    { id: "live", label: "A: Live", short: "A", description: "The real Home" },
    { id: "slim", label: "B: Slim invitation", short: "B", description: "The sign-up ask as one line over the dashboard" },
    { id: "after", label: "C: Ask after the value", short: "C", description: "The dashboard first, the ask at its foot" },
  ],
};
const DEFAULT_OPTION: Record<Persona, string> = { registered: "actor", admin: "inbox", public: "after" };

const personaOf = (role: UserRole): Persona => (role === "public-user" ? "public" : isBiodataAdmin(role) ? "admin" : "registered");

function Heading({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-primary">{children}</h2>
      {trailing}
    </div>
  );
}

function Banner({ title, subtitle, stats }: { title: string; subtitle: string; stats: { value: string; label: string; note?: string; trend?: boolean }[] }) {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-8 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold text-white">{title}</h1>
          <p className="m-0 text-md text-white">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          {stats.map((s, i) => (
            <div key={s.label} className={cx("flex flex-col gap-2 pr-6", i < stats.length - 1 && "border-r border-white/20")}>
              <p className="m-0 text-2xl font-medium text-white tabular-nums">{s.value}</p>
              <p className="m-0 text-md font-medium text-white">{s.label}</p>
              {s.note && (
                <div className="flex items-center gap-1.5 text-sm text-white/80">
                  {s.trend && <TrendUp02 className="size-3.5 text-fg-success-primary" />}
                  <span>{s.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Registered: B Leaner ──
const knowledge = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
  { icon: DownloadCloud02, title: "Dataset templates", description: "Pre-built spreadsheets for common survey types." },
  { icon: LifeBuoy01, title: "Getting help and support", description: "Contact the DEW biodiversity team or browse FAQs." },
];
const featured = projects.filter((p) => p.status === "Active" || p.status === "Completed");

function Continue() {
  const roleHref = useRoleHref();
  const task = dashboardTasks.find((t) => t.actionLabel === "Continue");
  if (!task?.actionHref) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-primary">
        <FileSearch01 className="size-4 shrink-0 text-fg-brand-primary" />
        <span>
          Continue where you left off - <span className="font-semibold">{task.title}</span>
        </span>
      </div>
      <Button color="link-color" size="sm" href={roleHref(task.actionHref)} iconTrailing={ArrowNarrowRight}>
        Continue
      </Button>
    </div>
  );
}

function RequestCard({ task }: { task: (typeof dashboardTasks)[number] }) {
  const roleHref = useRoleHref();
  const Icon = task.icon;
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-secondary bg-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <FeaturedIcon icon={Icon} color="brand" theme="modern" size="md" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="m-0 text-base font-medium text-primary">{task.title}</p>
            <Badge size="sm" color={task.statusColor}>
              {task.status}
            </Badge>
          </div>
        </div>
        {task.actionHref && task.actionLabel ? (
          <Button color="link-color" size="sm" href={roleHref(task.actionHref)} iconTrailing={ArrowNarrowRight} className="shrink-0">
            {task.actionLabel}
          </Button>
        ) : null}
      </div>
      {task.progress ? (
        <div className="grid grid-cols-1 gap-4 border-t border-secondary pt-4 sm:grid-cols-3">
          {task.progress.steps.map((step) => {
            const done = step.percent === 100;
            const current = step.percent > 0 && step.percent < 100;
            return (
              <div key={step.label} className="flex flex-col gap-1.5">
                <span className={cx("flex items-center gap-1.5 text-sm", current ? "font-semibold text-primary" : done ? "font-medium text-secondary" : "text-tertiary")}>
                  {done && <Check className="size-3.5 shrink-0 text-fg-success-primary" />}
                  {!done && !current ? `Next: ${step.label}` : step.label}
                </span>
                <span className="text-xs text-tertiary">{step.detail}</span>
                <ProgressBarBase value={step.percent} />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="m-0 text-sm text-tertiary">{task.detail}</p>
      )}
    </div>
  );
}

// ── Registered: C Who is acting ──
// Each thing the person has put in sits under whoever has to act next, and what is decided folds under a count: the draft is on them, the nomination is with the panel, the approved request needs nothing. The group
// a task belongs to is read from its own status, so the page cannot say "waiting on you" about something that is not.
const ON_YOU = ["Draft"];
const DECIDED = ["Approved", "Rejected", "Accepted"];

function ActorTitle({ children, count }: { children: ReactNode; count: number }) {
  return (
    <span className="flex items-center gap-2">
      {children}
      <CountBadge count={count} color="brand" />
    </span>
  );
}

function WhoIsActing() {
  const onYou = dashboardTasks.filter((t) => ON_YOU.includes(t.status));
  const decided = dashboardTasks.filter((t) => DECIDED.includes(t.status));
  const withDew = dashboardTasks.filter((t) => !onYou.includes(t) && !decided.includes(t));
  const empty = (text: string) => <p className="m-0 text-sm text-tertiary">{text}</p>;
  const list = (tasks: typeof dashboardTasks, none: string) =>
    tasks.length ? (
      <div className="flex flex-col gap-3">
        {tasks.map((t) => (
          <RequestCard key={t.title} task={t} />
        ))}
      </div>
    ) : (
      empty(none)
    );
  return (
    <Accordion
      variant="boxed"
      defaultOpenKeys={["you", "dew"]}
      items={[
        { id: "you", title: <ActorTitle count={onYou.length}>Waiting on you</ActorTitle>, content: list(onYou, "Nothing is waiting on you.") },
        { id: "dew", title: <ActorTitle count={withDew.length}>Waiting on DEW</ActorTitle>, content: list(withDew, "Nothing is waiting on DEW.") },
        { id: "decided", title: <ActorTitle count={decided.length}>Decided</ActorTitle>, content: list(decided, "Nothing has been decided yet.") },
      ]}
    />
  );
}

function RegisteredHome({ actor }: { actor: boolean }) {
  const roleHref = useRoleHref();
  const rest = dashboardTasks.filter((t) => t.actionLabel !== "Continue");
  return (
    <>
      <Banner
        title="Hi, Olivia"
        subtitle="Your activity at a glance"
        stats={[
          { value: "15", label: "Species observed", note: "3 up from last week", trend: true },
          { value: "3", label: "Datasets contributed", note: "1 dataset under review" },
          { value: "2", label: "Completed checklists", note: "2 completed this month" },
        ]}
      />
      <div className="flex flex-col gap-8 px-6 pb-6">
        {actor ? (
          <WhoIsActing />
        ) : (
          <>
            <Continue />
            <div className="flex flex-col gap-3">
              <Heading>Your requests</Heading>
              <div className="flex flex-col gap-3">
                {rest.map((t) => (
                  <RequestCard key={t.title} task={t} />
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col gap-3">
          <Heading
            trailing={
              <Button color="link-color" size="sm" href={roleHref("/pages/project-list")} iconTrailing={ArrowNarrowRight}>
                View all projects
              </Button>
            }
          >
            Featured projects
          </Heading>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {featured.map((p) => {
              const body = (
                <BentoCard className={cx("flex-1 gap-3 p-4", p.href && "transition-colors duration-150 group-hover:border-primary")}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge size="sm" color={p.statusColor}>
                      {p.status}
                    </Badge>
                    <span className="text-xs whitespace-nowrap text-tertiary">{p.updated}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className={cx("m-0 text-base font-semibold text-primary", p.href && "group-hover:text-brand-700 group-hover:underline")}>{p.name}</p>
                    <p className="m-0 text-sm text-tertiary">{p.org}</p>
                  </div>
                </BentoCard>
              );
              return p.href ? (
                <Link key={p.id} href={roleHref(p.href)} className="group flex flex-1">
                  {body}
                </Link>
              ) : (
                <div key={p.id} className="flex flex-1">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Heading>Knowledge base</Heading>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-secondary bg-primary p-4 sm:grid-cols-2">
            {knowledge.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" />
                <div className="flex flex-col gap-0.5">
                  <p className="m-0 text-sm font-semibold text-primary">{title}</p>
                  <p className="m-0 text-sm text-tertiary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── BioData Admin: B Cleaned and C Queue first ──
interface Queue {
  id: string;
  label: string;
  count: number;
  icon: FC<{ className?: string }>;
  description: string;
  href?: string;
}

/** The four things that wait on an admin, counted where the live page counts them. One list, so one total. */
function useQueues(): { queues: Queue[]; total: number } {
  const roleHref = useRoleHref();
  const pending = useAdminPendingCounts();
  const flagged = useOpenFlaggedConcepts();
  const flaggedProjects = new Set(flagged.map((e) => e.projectCode)).size;
  const queues: Queue[] = [
    { id: "users", label: "User access requests", count: USER_ACCESS_REQUESTS, icon: UserCheck01, description: "Waiting for approval." },
    {
      id: "dla",
      label: "DLA requests",
      count: pending.dlas,
      icon: FileLock01,
      description: "Data licencing agreements waiting for a decision.",
      href: roleHref(`/pages/dla?scope=all&status=${PENDING_DLA.join(",")}`),
    },
    {
      id: "nominations",
      label: "Sensitive species nominations",
      count: pending.nominations,
      icon: Feather,
      description: "Nominations waiting for a panel decision.",
      href: roleHref(`/pages/nominations?scope=all&status=${PENDING_NOMINATION.join(",")}`),
    },
    {
      id: "flagged",
      label: "Flagged concepts",
      count: flagged.length,
      icon: Flag01,
      description: `Values marked questionable, across ${flaggedProjects} ${flaggedProjects === 1 ? "project" : "projects"}.`,
      href: roleHref("/pages/flagged-concepts"),
    },
  ];
  return { queues, total: queues.reduce((n, q) => n + q.count, 0) };
}

function QueueRow({ queue, first }: { queue: Queue; first: boolean }) {
  return (
    <div className={cx("flex items-center justify-between gap-4 p-4", !first && "border-t border-secondary")}>
      <div className="flex items-center gap-3">
        <FeaturedIcon icon={queue.icon} color="brand" theme="modern" size="md" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="m-0 text-base font-semibold text-primary">{queue.label}</p>
            <CountBadge count={queue.count} color="brand" />
          </div>
          <p className="m-0 text-sm text-tertiary">{queue.description}</p>
        </div>
      </div>
      {queue.href ? (
        <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} href={queue.href} className="shrink-0">
          Review
        </Button>
      ) : (
        <Tooltip title="Coming soon - the approvals queue isn't built yet">
          <Focusable>
            <span className="inline-flex shrink-0">
              <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} isDisabled>
                Review
              </Button>
            </span>
          </Focusable>
        </Tooltip>
      )}
    </div>
  );
}

function QueueList({ queues }: { queues: Queue[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-secondary bg-primary">
      {queues.map((q, i) => (
        <QueueRow key={q.id} queue={q} first={i === 0} />
      ))}
    </div>
  );
}

const PLATFORM = [
  { value: "3,482", label: "Registered users" },
  { value: "128", label: "Active projects" },
  { value: "340", label: "Datasets this month" },
];

// ── BioData Admin: D Inbox ──
// Each queue is a section: its name, its count, and the items that have waited longest, each with its own Review. Sections are in the order of what is waiting, the biggest first. The user access queue is not built, so its
// section says so and holds nothing; DLA requests and nominations are read from their stores, flagged concepts from the field notes and the portfolio, as the live page reads them.
const INBOX_ROWS = 5;

function InboxRow({ title, subtitle, badge, aside, href }: { title: string; subtitle: string; badge?: ReactNode; aside: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-secondary py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 truncate text-sm font-medium text-primary">{title}</p>
          {badge}
        </div>
        <p className="m-0 truncate text-sm text-tertiary">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="text-sm whitespace-nowrap text-tertiary">{aside}</span>
        <Button color="link-color" size="sm" href={href} iconTrailing={ArrowNarrowRight}>
          Review
        </Button>
      </div>
    </div>
  );
}

function useInboxSections() {
  const roleHref = useRoleHref();
  const dlas = useDlas();
  const nominations = useNominations();
  const flagged = useOpenFlaggedConcepts();
  const dlaRows = dlas
    .filter((d) => (PENDING_DLA as readonly string[]).includes(d.status))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const nominationRows = nominations
    .filter((n) => (PENDING_NOMINATION as readonly string[]).includes(n.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sections = [
    {
      id: "users",
      title: "User access requests",
      count: USER_ACCESS_REQUESTS,
      all: undefined as string | undefined,
      rows: null as ReactNode,
      note: "The approvals queue is not built yet.",
    },
    {
      id: "flagged",
      title: "Flagged concepts",
      count: flagged.length,
      all: roleHref("/pages/flagged-concepts"),
      note: "",
      rows: flagged.slice(0, INBOX_ROWS).map((e) => (
        <InboxRow
          key={e.id}
          title={`${e.recordCode} - ${e.recordName}`}
          subtitle={`${e.projectCode} - ${e.projectName}, ${e.reason}`}
          aside={`Waiting ${waited(e.daysWaiting).toLowerCase()}`}
          href={roleHref(`/pages/flagged-concepts?item=${encodeURIComponent(e.id)}`)}
        />
      )),
    },
    {
      id: "nominations",
      title: "Sensitive species nominations",
      count: nominationRows.length,
      all: roleHref(`/pages/nominations?scope=all&status=${PENDING_NOMINATION.join(",")}`),
      note: "",
      rows: nominationRows.slice(0, INBOX_ROWS).map((n) => (
        <InboxRow
          key={n.id}
          title={nominationSubject(n)}
          subtitle={[n.nominator.name, n.nominator.organisation].filter(Boolean).join(", ")}
          badge={
            <Badge size="sm" color={nominationStatusMeta[n.status].badgeColor}>
              {nominationStatusMeta[n.status].label}
            </Badge>
          }
          aside={`Submitted ${formatShortDate(n.createdAt)}`}
          href={roleHref(`/pages/nominations/${n.id}`)}
        />
      )),
    },
    {
      id: "dla",
      title: "DLA requests",
      count: dlaRows.length,
      all: roleHref(`/pages/dla?scope=all&status=${PENDING_DLA.join(",")}`),
      note: "",
      rows: dlaRows.slice(0, INBOX_ROWS).map((d) => (
        <InboxRow
          key={d.id}
          title={`${d.requestor.firstName} ${d.requestor.lastName}`}
          subtitle={[d.requestor.organisation, d.id].filter(Boolean).join(", ")}
          badge={
            <Badge size="sm" color={agreementStatusMeta[d.status].badgeColor}>
              {agreementStatusMeta[d.status].label}
            </Badge>
          }
          aside={`Submitted ${formatShortDate(d.submittedAt)}`}
          href={roleHref(`/pages/dla/${d.id}`)}
        />
      )),
    },
  ].sort((a, b) => b.count - a.count);
  return sections;
}

function AdminInbox() {
  const sections = useInboxSections();
  const total = sections.reduce((n, s) => n + s.count, 0);
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold text-primary">Hi, Jane</h1>
        <p className="m-0 text-md text-tertiary">
          <span className="font-semibold text-primary tabular-nums">{total.toLocaleString()}</span> waiting for you
        </p>
      </div>
      <Accordion
        variant="boxed"
        defaultOpenKeys={sections.filter((s) => s.rows && s.count > 0).map((s) => s.id)}
        items={sections.map((s) => ({
          id: s.id,
          title: (
            <span className="flex items-center gap-2">
              {s.title}
              <CountBadge count={s.count} color="brand" />
            </span>
          ),
          action: s.all ? (
            <Button color="link-color" size="sm" href={s.all} iconTrailing={ArrowNarrowRight}>
              Review all
            </Button>
          ) : undefined,
          content: s.rows ? <div className="flex flex-col">{s.rows}</div> : <p className="m-0 text-sm text-tertiary">{s.note}</p>,
        }))}
      />
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3 border-t border-secondary pt-6">
        {PLATFORM.map((p) => (
          <div key={p.label} className="flex flex-col gap-0.5">
            <dd className="m-0 text-lg font-medium text-primary tabular-nums">{p.value}</dd>
            <dt className="text-sm text-tertiary">{p.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AdminCleaned() {
  const { queues, total } = useQueues();
  return (
    <>
      <Banner title="Hi, Jane" subtitle="Platform activity at a glance" stats={PLATFORM} />
      <div className="flex flex-col gap-3 px-6 pb-6">
        <Heading>
          Waiting for you
          <CountBadge count={total} color="brand" />
        </Heading>
        <QueueList queues={queues} />
      </div>
    </>
  );
}

function AdminQueueFirst() {
  const { queues, total } = useQueues();
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold text-primary">Hi, Jane</h1>
        <p className="m-0 text-md text-tertiary">
          <span className="font-semibold text-primary tabular-nums">{total.toLocaleString()}</span> waiting for you
        </p>
      </div>
      <QueueList queues={queues} />
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3 border-t border-secondary pt-6">
        {PLATFORM.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <dd className="m-0 text-lg font-medium text-primary tabular-nums">{s.value}</dd>
            <dt className="text-sm text-tertiary">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── The shell: the real header and rail, and Home's own column 2 ──
function LabShell({ role, persona, children }: { role: UserRole; persona: Persona; children: ReactNode }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const goTo = (s: { key?: string; items?: { key?: string }[] }) => {
    const key = s.key ?? s.items?.find((i) => i.key)?.key;
    if (key) router.push(roleHref(keyHref(key as Parameters<typeof keyHref>[0])));
  };
  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={<MobileNavTrigger sections={nav} sectionIcons={sectionIcons} activeSection="Home" onSelectSection={(l) => { const s = nav.find((n) => n.label === l); if (s) goTo(s); }} />}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Home" onSelectSection={goTo} />
        {persona === "public" ? (
          <GuestAboutAside sectionLabel="Home" />
        ) : (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Home</p>
              <Tabs orientation="vertical" selectedKey="mine" onSelectionChange={() => {}}>
                <TabList aria-label="Home" orientation="vertical" type="button-brand" fullWidth className="w-full">
                  <Tab id="mine" label="My BioData" icon={User01} />
                  <Tab id="fauna" label="Flora and Fauna Dashboard" icon={PieChart03} />
                </TabList>
              </Tabs>
            </div>
          </aside>
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  );
}

function Lab() {
  const role = useUserRole();
  const persona = personaOf(role);
  const [chosen, setChosen] = useState<Record<Persona, string>>(DEFAULT_OPTION);
  // The visitor's dashboard tab is lifted here so it survives a switch of option, and both are judged on the same tab.
  const [tab, setTab] = useState<Key>("overview");
  const options = OPTIONS[persona];
  const current = options.find((o) => o.id === chosen[persona]) ?? options[0];
  useRegisterTool({
    id: "layout",
    label: "Home to show",
    barLabel: "Home",
    barValue: current.short,
    icon: LayoutAlt01,
    options: options.map(({ id, label, description }) => ({ id, label, description })),
    value: current.id,
    onChange: (id) => setChosen((c) => ({ ...c, [persona]: id })),
  });

  let content: ReactNode;
  if (persona === "registered") content = current.id === "leaner" ? <RegisteredHome actor={false} /> : current.id === "actor" ? <RegisteredHome actor /> : <HomeDashboardContent />;
  else if (persona === "admin") content = current.id === "cleaned" ? <AdminCleaned /> : current.id === "queue" ? <AdminQueueFirst /> : current.id === "inbox" ? <AdminInbox /> : <HomeDashboardContent />;
  else {
    const slim = current.id === "slim";
    const after = current.id === "after";
    content = (
      <>
        {!after && (
          <div className={slim ? "px-6 pt-6" : "p-6"}>
            <GuestGradientCard tab={tab} compact={slim} />
          </div>
        )}
        <DataOverviewContent activeTab={tab} onActiveTabChange={setTab} />
        {after && (
          <div className="p-6">
            <GuestGradientCard tab={tab} />
          </div>
        )}
      </>
    );
  }
  return (
    <LabShell role={role} persona={persona}>
      {content}
    </LabShell>
  );
}

export default function HomeCleanupLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
