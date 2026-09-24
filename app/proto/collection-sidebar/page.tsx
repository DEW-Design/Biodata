"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download01, FileCheck02, FileLock01, Plus } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Button } from "@/components/base/buttons/button";
import { Table, TableCard } from "@/components/application/table/table";
import { dsaStatusMeta, dsaStatusOrder } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { dlaStatusMeta, dlaStatusOrder } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { cx } from "@/utils/cx";

// /proto/collection-sidebar - what column 2 should show for a List -> deep dive collection (DSA,
// DLA) now that the status-bucket filter doesn't have to live there by default. Real DSA/DLA data
// throughout (dsa-store.ts/dla-store.ts) - no fabricated records.
//
// Started as four competing directions (Needs Attention / At a Glance / Grouped By / Navigation).
// Needs Attention, At a Glance, and Grouped By were cut - none of them held up once "Navigation"
// landed, per direct feedback. What's left is the one direction being built on: a real, grouped
// nav sidebar (Supabase's own shape - plain small-caps group labels, count-badged rows, no
// unrelated actions), built from a Mobbin pass on Supabase/Docusign/Obvious/Fibery. That pass also
// showed no product keeps a flat "actions" list bolted onto a nav sidebar - the create/utility
// actions ("New agreement", "Export CSV") live in the content's own header instead, right next to
// what they act on (Docusign's "Add Group", Obvious's "+ Add").
//
// "Views" (the status buckets - Active/Under Review/... - as real, count-badged nav rows
// switching what column 3 shows) is the "PRODUCT"-equivalent group; "Recent" (record shortcuts)
// is the "Pinned"-equivalent second group (Whop). Column 2 owns status switching, so column 3 has
// no separate status-filter UI of its own any more.

type Dataset = "dsa" | "dla";

interface NormalizedRecord {
  id: string;
  org: string;
  statusKey: string;
  statusLabel: string;
  statusColor: BadgeColors;
  date: string; // ISO - created/submitted date, used for "waiting X days"
  expiresOn?: string; // ISO - only set for a currently-active record with a real grant period
  href: string;
}

interface StatusOption {
  key: string;
  label: string;
  color: BadgeColors;
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function relativeDays(iso: string): string {
  const days = daysBetween(iso, new Date().toISOString());
  if (days === 0) return "today";
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  return `in ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
}

function downloadCsv(filename: string, rows: NormalizedRecord[]) {
  const header = ["ID", "Organisation", "Status", "Date"];
  const lines = rows.map((r) => [r.id, r.org, r.statusLabel, r.date].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Column 3: the table, plus the collection's own primary/utility actions in its own header -
// not the sidebar. See the file-header comment for the Mobbin research this follows.

function CollectionTable({
  dataset,
  label,
  records,
  statusFilter,
}: {
  dataset: Dataset;
  label: string;
  records: NormalizedRecord[];
  statusFilter: string | "all";
}) {
  const filtered = statusFilter === "all" ? records : records.filter((r) => r.statusKey === statusFilter);
  const newHref = `/pages/${dataset}/new?userRole=biodata-admin`;
  const newLabel = dataset === "dsa" ? "New agreement" : "New request";

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-balance text-primary">{label}</h1>
          <CountBadge count={records.length} color="gray" />
        </div>
        <div className="flex items-center gap-2">
          <Button color="secondary" size="sm" iconLeading={Download01} onClick={() => downloadCsv(`${label.toLowerCase().replace(/\s+/g, "-")}.csv`, records)}>
            Export CSV
          </Button>
          <Button color="primary" size="sm" iconLeading={Plus} href={newHref}>
            {newLabel}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-secondary p-12 text-center">
            <p className="text-sm font-medium text-primary">No matching records</p>
            <p className="text-sm text-balance text-tertiary">Nothing in this collection matches the current view.</p>
          </div>
        ) : (
          <TableCard.Root size="sm">
            <Table aria-label={label}>
              <Table.Header>
                <Table.Head id="id" label="Record" isRowHeader />
                <Table.Head id="org" label="Organisation" />
                <Table.Head id="status" label="Status" />
                <Table.Head id="date" label="Date" />
              </Table.Header>
              <Table.Body items={filtered}>
                {(record) => (
                  <Table.Row id={record.id} href={record.href} textValue={record.id} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{record.id}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{record.org}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={record.statusColor}>
                        {record.statusLabel}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{record.date ? relativeDays(record.date) : "-"}</span>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </TableCard.Root>
        )}
      </div>
    </div>
  );
}

// ── Column 2: Navigation - a real grouped nav sidebar, Supabase's own shape ──

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{children}</p>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-quaternary uppercase">{children}</p>;
}

function AttentionRow({ record }: { record: NormalizedRecord }) {
  return (
    <Link
      href={record.href}
      className="flex flex-col gap-0.5 rounded-md px-2 py-2 outline-focus-ring transition-colors duration-100 ease-linear hover:bg-tertiary focus-visible:outline-2"
    >
      <span className="text-sm font-semibold text-primary">{record.id}</span>
      <span className="text-xs text-tertiary">{record.org}</span>
    </Link>
  );
}

function NavRow({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold outline-focus-ring transition-colors duration-100 ease-linear focus-visible:outline-2",
        active ? "bg-brand-secondary text-brand-secondary" : "text-quaternary hover:bg-tertiary hover:text-primary",
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      <CountBadge count={count} color={active ? "brand" : "gray"} />
    </button>
  );
}

function NavigationColumn({
  label,
  records,
  statuses,
  statusFilter,
  onStatusFilterChange,
}: {
  label: string;
  records: NormalizedRecord[];
  statuses: StatusOption[];
  statusFilter: string | "all";
  onStatusFilterChange: (key: string | "all") => void;
}) {
  const recent = [...records].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 p-4">
      <EyebrowLabel>{label}</EyebrowLabel>

      <div>
        <GroupLabel>Views</GroupLabel>
        <div className="flex flex-col">
          <NavRow label="All" count={records.length} active={statusFilter === "all"} onClick={() => onStatusFilterChange("all")} />
          {statuses.map((s) => (
            <NavRow
              key={s.key}
              label={s.label}
              count={records.filter((r) => r.statusKey === s.key).length}
              active={statusFilter === s.key}
              onClick={() => onStatusFilterChange(s.key)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-secondary pt-4">
        <GroupLabel>Recent</GroupLabel>
        {recent.length === 0 ? (
          <p className="px-2 text-sm text-tertiary">No records yet.</p>
        ) : (
          <div className="flex flex-col">
            {recent.map((r) => (
              <AttentionRow key={r.id} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──

export default function CollectionSidebarProto() {
  const [dataset, setDataset] = useState<Dataset>("dsa");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const dsas = useDsas();
  const dlas = useDlas();

  const { label, records, statuses } = useMemo(() => {
    if (dataset === "dsa") {
      const records: NormalizedRecord[] = dsas.map((d) => ({
        id: d.id,
        org: d.partner || "No partner set",
        statusKey: d.status,
        statusLabel: dsaStatusMeta[d.status].tabLabel,
        statusColor: dsaStatusMeta[d.status].badgeColor,
        date: d.createdAt,
        expiresOn: d.status === "active" ? d.validTo : undefined,
        href: `/pages/dsa/${d.id}?userRole=biodata-admin`,
      }));
      return {
        label: "Data Sharing Agreements",
        records,
        statuses: dsaStatusOrder.map((s) => ({ key: s, label: dsaStatusMeta[s].tabLabel, color: dsaStatusMeta[s].badgeColor })),
      };
    }
    const records: NormalizedRecord[] = dlas.map((d) => ({
      id: d.id,
      org: d.requestor.organisation || "No organisation set",
      statusKey: d.status,
      statusLabel: dlaStatusMeta[d.status].tabLabel,
      statusColor: dlaStatusMeta[d.status].badgeColor,
      date: d.submittedAt,
      expiresOn: d.status === "active" ? d.validTo : undefined,
      href: `/pages/dla/${d.id}?userRole=biodata-admin`,
    }));
    return {
      label: "Data Licencing Agreements",
      records,
      statuses: dlaStatusOrder.map((s) => ({ key: s, label: dlaStatusMeta[s].tabLabel, color: dlaStatusMeta[s].badgeColor })),
    };
  }, [dataset, dsas, dlas]);

  // Switching dataset resets the view filter - it doesn't necessarily carry over, and a
  // filtered-to-nothing state with no visible way back would be a dead end.
  const switchDataset = (next: Dataset) => {
    setDataset(next);
    setStatusFilter("all");
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <div className="h-5 w-px bg-secondary" />
          <p className="text-sm text-tertiary">Column 2 exploration - DSA / DLA</p>
        </div>
        {/* Dataset toggle - a lab-only control. */}
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          {(["dsa", "dla"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => switchDataset(d)}
              className={cx(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-100 ease-linear",
                dataset === d ? "bg-primary text-primary shadow-xs" : "text-quaternary hover:text-primary",
              )}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand-solid text-white">
            {dataset === "dsa" ? <FileCheck02 className="size-5" /> : <FileLock01 className="size-5" />}
          </div>
        </nav>

        <aside aria-label="Section" className="w-[286px] shrink-0 overflow-y-auto border-r border-secondary bg-secondary">
          <NavigationColumn label={label} records={records} statuses={statuses} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CollectionTable dataset={dataset} label={label} records={records} statusFilter={statusFilter} />
        </main>
      </div>
    </div>
  );
}
