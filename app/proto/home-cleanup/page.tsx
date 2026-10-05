"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowRight, BookOpen01, Check, DownloadCloud02, FileCheck02, FileSearch01, LayoutAlt01, LifeBuoy01, PieChart03, TrendUp02, User01 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { dashboardTasks, HomeDashboardContent } from "@/app/pages/_shared/home-dashboard";
import { projects } from "@/app/pages/_shared/project-list-content";
import { keyHref, navForRole } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// LAB: the registered user's Home, audited with /emil-design-foundations (5 Oct 2026). The page today has six blocks
// (greeting and numbers, quick actions, a continue strip, "needs your attention", featured projects, knowledge base). What
// the audit found, in the foundations' own terms:
//   - Quick actions repeat the header's Add menu (Project, Data licence request, Sensitive species nomination): the same
//     redundancy already removed for Add project and Upload dataset (the file's own comment). "Request new DLA" is jargon
//     where the Add menu says "Data licence request"; "Manage projects & datasets" says nothing about the outcome.
//   - "Needs your attention" holds an approved request and a nomination waiting on a panel: nothing for the person to do.
//     A red count and a tab row (For you 2, Approved 1, Under review 1) count the same two items three times.
//   - Each card states one fact three ways: a status badge, a sentence ("Approved. Becomes active on 1 Dec 2026."), and the
//     step list ("Approved by DEW", "Next: Active"). The done steps' labels are the lightest text on the card (quaternary,
//     3.4:1 on white, under the 4.5:1 floor for 14px text) while their dates are the smaller, darker line: the hierarchy runs backwards.
//   - The notes under the numbers are white at 60%: 4.7:1 on the gradient's middle, 4.0:1 at its foot, under 4.5:1. White at 80% is
//     7.1:1 and 5.8:1.
//   - Title Case headings ("Featured Projects", "Knowledge Base") against sentence case everywhere else; "Species Observed",
//     "Completed Checklists" the same.
//   - Knowledge base titles are link-coloured but link nowhere: an affordance for something that does not exist yet.
// Three directions, on the real shell:
//   A  Today      the real component
//   B  Cleaned    the same six blocks, the findings above fixed (nothing removed but the duplicate counts and the tab row)
//   C  Leaner     B, with Quick actions gone (the Add menu has them) and the lower blocks tightened
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file. Numbers, names and copy are the page's own.
type Option = "today" | "cleaned" | "leaner";
const OPTIONS: { id: Option; label: string; short: string; description: string }[] = [
  { id: "today", label: "A: Today", short: "A", description: "The real Home content" },
  { id: "cleaned", label: "B: Cleaned", short: "B", description: "Same blocks, the audit's findings fixed" },
  { id: "leaner", label: "C: Leaner", short: "C", description: "B without Quick actions, lower blocks tightened" },
];

const knowledge = [
  { icon: BookOpen01, title: "How to run a bird survey", description: "Point-count and transect methodology, step by step." },
  { icon: FileCheck02, title: "Data collection standards", description: "Formatting and metadata your dataset needs before upload." },
  { icon: DownloadCloud02, title: "Dataset templates", description: "Pre-built spreadsheets for common survey types." },
  { icon: LifeBuoy01, title: "Getting help and support", description: "Contact the DEW biodiversity team or browse FAQs." },
];
const featured = projects.filter((p) => p.status === "Active" || p.status === "Completed");

// ── Shared pieces (B and C) ──
function Heading({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="m-0 text-lg font-semibold text-primary">{children}</h2>
      {trailing}
    </div>
  );
}

function Hero() {
  const stat = (value: string, label: string, note: string, last = false, trend = false) => (
    <div className={cx("flex flex-col gap-2 pr-6", !last && "border-r border-white/20")}>
      <p className="m-0 text-2xl font-medium text-white tabular-nums">{value}</p>
      <p className="m-0 text-md font-medium text-white">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-white/80">
        {trend && <TrendUp02 className="size-3.5 text-fg-success-primary" />}
        <span>{note}</span>
      </div>
    </div>
  );
  return (
    <div className="p-6">
      <div className="flex flex-col gap-8 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold text-white">Hi, Olivia</h1>
          <p className="m-0 text-md text-white">Your activity at a glance</p>
        </div>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          {stat("15", "Species observed", "3 up from last week", false, true)}
          {stat("3", "Datasets contributed", "1 dataset under review")}
          {stat("2", "Completed checklists", "2 completed this month", true)}
        </div>
      </div>
    </div>
  );
}

function QuickActionsB() {
  const roleHref = useRoleHref();
  // The Add menu's own names for the same actions (lib/create-menu.ts), so one thing has one name.
  const actions = [
    { label: "Your projects and datasets", href: "/pages/project-list" },
    { label: "Data licence request", href: "/pages/dla/new" },
    { label: "Sensitive species nomination", href: "/pages/nominations/new" },
  ];
  return (
    <div className="flex flex-col gap-3 px-6 pb-6">
      <Heading>Quick actions</Heading>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <Button key={a.label} color="secondary" iconTrailing={ArrowNarrowRight} href={roleHref(a.href)}>
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

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

// A request or nomination: its name and its one status, then where it has got to. The sentence that restated the status is
// gone (the step list says it), the done steps read in the secondary colour with their tick, and the date is the quiet line.
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

function Requests() {
  const rest = dashboardTasks.filter((t) => t.actionLabel !== "Continue");
  return (
    <div className="flex flex-col gap-3">
      <Heading>Your requests</Heading>
      <div className="flex flex-col gap-3">
        {rest.map((t) => (
          <RequestCard key={t.title} task={t} />
        ))}
      </div>
    </div>
  );
}

function Featured({ compact }: { compact: boolean }) {
  const roleHref = useRoleHref();
  return (
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
            <BentoCard className={cx("flex-1", compact ? "gap-3 p-4" : "gap-4", p.href && "transition-colors duration-150 group-hover:border-primary")}>
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
  );
}

// The titles are plain text: none of these links anywhere yet, so none is link-coloured.
function KnowledgeBase({ compact }: { compact: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Heading>Knowledge base</Heading>
      {compact ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {knowledge.map(({ icon: Icon, title, description }) => (
            <BentoCard key={title} className="flex-1 gap-4">
              <Icon className="size-6 text-fg-brand-primary" />
              <div className="flex flex-col gap-1.5">
                <p className="m-0 text-base font-semibold text-primary">{title}</p>
                <p className="m-0 text-sm text-tertiary">{description}</p>
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}

function Cleaned({ lean }: { lean: boolean }) {
  return (
    <>
      <Hero />
      {lean ? null : <QuickActionsB />}
      <div className="flex flex-col gap-8 px-6 pb-6">
        <Continue />
        <Requests />
        <Featured compact={lean} />
        <KnowledgeBase compact={lean} />
      </div>
    </>
  );
}

// ── The shell: the real header and rail, and Home's own column 2 ──
function LabShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nav = navForRole("registered-user");
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
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  );
}

function Lab() {
  const [option, setOption] = useState<Option>("cleaned");
  const current = OPTIONS.find((o) => o.id === option)!;
  useRegisterTool({
    id: "layout",
    label: "Home to show",
    barLabel: "Home",
    barValue: current.short,
    icon: LayoutAlt01,
    options: OPTIONS.map(({ id, label, description }) => ({ id, label, description })),
    value: option,
    onChange: (id) => setOption(id as Option),
  });
  return <LabShell>{option === "today" ? <HomeDashboardContent /> : <Cleaned lean={option === "leaner"} />}</LabShell>;
}

export default function HomeCleanupLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
