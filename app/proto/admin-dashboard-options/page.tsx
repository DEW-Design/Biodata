"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Exploring what the `biodata-admin` role should
// actually see on Home, instead of the registered-user dashboard it currently gets by default
// (HomeDashboardContent has no role branching yet - every role sees the same "Hi, Olivia / 15
// species observed" community-facing content). Flagged directly by the user: admin wouldn't see
// "You've observed 15 species" - they need operational content instead (user access approvals at
// platform scale, DLA/nomination review queues, system-level stats), and their experience needs
// the same care against cognitive overload registered-user's dashboard got, not less - "think
// 1000s of users. How can we reduce an admin's cognitive overload?"
//
// Content grounded in the real BioData Admin IA (User Management, DLA approve/reject, Reports,
// Control Vocal - see the project_biodata_admin_scope memory), not invented from scratch. Numbers are
// realistic-scale placeholders (247 pending user access requests, not "3") since the whole point
// is proving the layout survives the volume admin actually deals with, the same "worst content"
// rule used everywhere else in this build.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  HomeLine,
  Folder,
  Eye,
  FileLock01,
  Feather,
  BarChart01,
  BarChartSquare01,
  Database01,
  Users01,
  UserCheck01,
  ArrowNarrowRight,
  TrendUp02,
} from "@untitledui/icons";
import { Table, TableCard } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { CountBadge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { MetricCard, BentoCard } from "@/app/pages/_shared/bento-card";
import { cx } from "@/utils/cx";

// ── Real content, grounded in the admin IA shared directly by the user (User Management, DLA
// approve/reject, Reports, Control Vocal), not invented from scratch. Counts are realistic-scale
// placeholders - the whole exercise is proving the layout survives admin's actual volume, not a
// tidy demo number. ──
const approvalQueues = [
  {
    id: "users",
    label: "User access requests",
    count: 247,
    icon: Users01,
    description: "New accounts awaiting approval before they can sign in.",
  },
  {
    id: "dla",
    label: "DLA requests",
    count: 12,
    icon: FileLock01,
    description: "Data licencing agreements pending admin review.",
  },
  {
    id: "nominations",
    label: "Sensitive species nominations",
    count: 5,
    icon: Feather,
    description: "Nominations awaiting a panel decision.",
  },
];

const totalPending = approvalQueues.reduce((sum, q) => sum + q.count, 0);

const systemStats = [
  { label: "Registered users", value: "3,482" },
  { label: "Active projects", value: "128" },
  { label: "Datasets this month", value: "340" },
  { label: "Pending reviews", value: totalPending.toLocaleString() },
];

// Two real example rows (Phoenix Baker, Lana Steiner - this codebase's sanctioned multi-person
// placeholder names, not invented ones) plus honest pagination reflecting the real queue size -
// same "show a couple of real rows, admit the rest with a real control" pattern as the Projects
// table and global search's "Show N more results", not a fabricated 247-row list.
const pendingUsers = [
  { id: "1", name: "Phoenix Baker", email: "phoenix.baker@example.com", org: "Flinders University", requested: "2 hours ago" },
  { id: "2", name: "Lana Steiner", email: "lana.steiner@example.com", org: "Independent researcher", requested: "5 hours ago" },
];

function QuickLinksRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button color="secondary" iconLeading={UserCheck01}>
        User Management
      </Button>
      <Button color="secondary" iconLeading={BarChartSquare01}>
        Reports
      </Button>
      <Button color="secondary" iconLeading={Database01}>
        Control Vocal
      </Button>
    </div>
  );
}

function ApprovalQueueCard({ queue }: { queue: (typeof approvalQueues)[number] }) {
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
      <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight} className="shrink-0">
        Review
      </Button>
    </BentoCard>
  );
}

// ── Shared chrome - a static reproduction of the admin icon rail (real IA sections: Home,
// Projects, Observations, DLA, User Management, Reports, Control Vocal), not registered-user's own
// nav. Chrome, not the focus of this exploration. ──
const adminSectionIcons = [HomeLine, Folder, Eye, FileLock01, Users01, BarChart01, Database01];

function AdminIconRailStub() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {adminSectionIcons.map((Icon, i) => (
        <div key={i} className={cx("flex size-12 items-center justify-center rounded-lg", i === 0 ? "bg-brand-solid text-white" : "text-quaternary")}>
          <Icon className="size-5" />
        </div>
      ))}
    </nav>
  );
}

function AdminHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-medium text-primary">Admin Overview</h1>
      <p className="text-sm text-tertiary">Platform-wide activity and pending reviews across BioData SA.</p>
    </div>
  );
}

// ── Variant 1: Baseline (current, wrong) - a static reproduction of what biodata-admin actually
// sees today: HomeDashboardContent has no role branching yet, so admin gets the exact same
// community-facing "Hi, Olivia / 15 species observed" content a registered user does. Kept as the
// anchor to make the contrast concrete, not because it's a real direction. ──
function VariantBaseline() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-lg border border-dashed border-secondary bg-secondary p-3 text-center text-xs text-tertiary">
        This is what `biodata-admin` currently sees - the registered-user dashboard, unchanged. Not a real direction, kept for contrast.
      </div>
      <h1 className="text-3xl font-medium text-primary">Hi, Olivia</h1>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="flex flex-col gap-2 border-r border-secondary pr-6">
          <p className="text-2xl font-medium text-primary tabular-nums">15</p>
          <p className="text-sm font-medium text-primary">Species Observed</p>
          <div className="flex items-center gap-1.5 text-sm text-tertiary">
            <TrendUp02 className="size-3.5 text-fg-success-primary" />
            <span>3 up from last week</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-medium text-primary tabular-nums">3</p>
          <p className="text-sm font-medium text-primary">Datasets contributed</p>
          <span className="text-sm text-tertiary">1 dataset under review</span>
        </div>
      </div>
    </div>
  );
}

// ── Variant 2: Operational Overview (Grouped Sections) - mirrors the tiering that already worked
// for registered-user's own dashboard (quiet stats, one clear primary section, demoted secondary
// links) applied to admin's real content instead. ──
function VariantOperationalOverview() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <AdminHeader />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {systemStats.map((stat) => (
          <MetricCard key={stat.label} size="sm" value={stat.value} label={stat.label} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-primary">Needs your review</h2>
        <div className="flex flex-col gap-3">
          {approvalQueues.map((queue) => (
            <ApprovalQueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      </div>
      <QuickLinksRow />
    </div>
  );
}

// ── Variant 3: Queue-First (Table-Centric) - "think 1000s of users" taken literally. The user
// access queue is a real, sortable-shaped TableCard (same pattern as the Projects table fix), not
// a summary card - the thing admin actually has to work through, front and centre. Real
// pagination (25 pages at 10/page) instead of a fabricated 247-row list. ──
function VariantQueueFirst() {
  const [page, setPage] = useState(1);
  const dlaAndNominations = approvalQueues.filter((q) => q.id !== "users");

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <TableCard.Root>
            <TableCard.Header title="User access requests" badge={approvalQueues[0].count.toLocaleString()} description="Newest first." />
            <Table aria-label="Pending user access requests">
              <Table.Header>
                <Table.Head id="name" isRowHeader>
                  Name
                </Table.Head>
                <Table.Head id="org">Organisation</Table.Head>
                <Table.Head id="requested">Requested</Table.Head>
                <Table.Head id="actions" />
              </Table.Header>
              <Table.Body items={pendingUsers}>
                {(user) => (
                  <Table.Row id={user.id} textValue={user.name}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" initials={user.name.split(" ").map((n) => n[0]).join("")} alt={user.name} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-primary">{user.name}</span>
                          <span className="text-sm text-tertiary">{user.email}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{user.org}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{user.requested}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <Button color="secondary" size="sm">
                          Reject
                        </Button>
                        <Button color="primary" size="sm">
                          Approve
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <TableCard.Pagination page={page} pageCount={Math.ceil(approvalQueues[0].count / 10)} onPageChange={setPage} />
          </TableCard.Root>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {systemStats.slice(0, 2).map((stat) => (
              <MetricCard key={stat.label} size="sm" value={stat.value} label={stat.label} />
            ))}
          </div>
          {dlaAndNominations.map((queue) => (
            <ApprovalQueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Variant 4: Triage (one clear focal point) - the single biggest, most actionable number (247
// user access requests) gets hero treatment - one real stat + one primary action, everything else
// demoted to a quiet row beneath. Applies the same hierarchy fix registered-user's dashboard
// needed, checked up front this time instead of caught after the fact. ──
function VariantTriage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-4 rounded-lg bg-brand-50 p-6">
        <p className="text-sm font-medium text-brand-secondary">Needs your review</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-4xl font-medium text-primary tabular-nums">{approvalQueues[0].count.toLocaleString()}</p>
            <p className="text-base text-secondary">User access requests awaiting approval</p>
          </div>
          <Button color="primary" iconTrailing={ArrowNarrowRight}>
            Review requests
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-primary">Also pending</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {approvalQueues.slice(1).map((queue) => (
            <ApprovalQueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {systemStats.map((stat) => (
          <MetricCard key={stat.label} size="sm" value={stat.value} label={stat.label} />
        ))}
      </div>
      <QuickLinksRow />
    </div>
  );
}

// ── Variant 5: Command Center (dense grid) - tests the opposite instinct from registered-user's
// spacious, welcoming tone: admin is a power user doing this daily, so a tighter, console-like
// density might serve them better than more whitespace. Same real components throughout, just a
// tighter grid, smaller gaps. ──
function VariantCommandCenter() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <AdminHeader />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {systemStats.map((stat) => (
              <MetricCard key={stat.label} size="sm" value={stat.value} label={stat.label} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {approvalQueues.map((queue) => (
              <BentoCard key={queue.id} className="gap-3">
                <div className="flex items-center justify-between">
                  <queue.icon className="size-5 text-fg-brand-primary" />
                  <CountBadge count={queue.count} color="brand" />
                </div>
                <p className="text-sm font-semibold text-primary">{queue.label}</p>
                <Button color="link-color" size="sm" iconTrailing={ArrowNarrowRight}>
                  Review
                </Button>
              </BentoCard>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-primary">Quick links</h2>
          <div className="flex flex-col gap-2">
            <Button color="secondary" iconLeading={UserCheck01} className="justify-start">
              User Management
            </Button>
            <Button color="secondary" iconLeading={BarChartSquare01} className="justify-start">
              Reports
            </Button>
            <Button color="secondary" iconLeading={Database01} className="justify-start">
              Control Vocal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const variants = [
  { name: "Baseline (current, wrong)", render: VariantBaseline },
  { name: "Operational Overview", render: VariantOperationalOverview },
  { name: "Queue-First", render: VariantQueueFirst },
  { name: "Triage", render: VariantTriage },
  { name: "Command Center", render: VariantCommandCenter },
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

export default function AdminDashboardOptionsProto() {
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
        <AdminIconRailStub />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <Variant />
        </main>
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}
