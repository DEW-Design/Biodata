"use client";

import { useState } from "react";
import type { Key, SortDescriptor } from "react-aria-components";
import { Clock, Plus, Zap, Activity, Calendar, Lock01, Bell01, Flag01 } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { monthOptions, type FilterGetters, type FilterSection, type FilterSelection, useSelectionFilter } from "@/app/pages/_shared/list-filter";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { NT_EVENTS, NT_ROOT, SENSITIVITY, effectiveTo, formatShortDate, ntStateMeta, ntStateOrder, recipientsSummary, triggerSummary, type Notification, type NtState } from "@/app/pages/_shared/notifications/nt-data";
import { useRecipientLabels } from "@/app/pages/_shared/notifications/nt-directory";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { useRoleHref } from "@/lib/use-role-href";

// The notifications list: search, filters and pagination, laid out to read at a glance (the designer, off
// the first layout's table, retired on 26 Oct 2026: "the table headers are not making any sense.
// What do we mean by sent?").
//
//   - Status is a row of tabs with counts above the table, as the Figma draws it (Active, Drafts,
//     Disabled), so how many of each there are is visible without opening Filter. Under one status the
//     Status column goes (it would repeat the tab).
//   - Each row reads as a sentence: the notification, then its Trigger in words ("When a DLA request's
//     status changes to Approved or Rejected", "Every Monday at 9:00 AM, Adelaide time") with an icon
//     for its kind (an event, or a schedule), then its Recipients, in words.
//   - "Last updated" names what the date is.

const sortKeys: Record<string, (n: Notification) => SortValue> = {
  id: (n) => n.id,
  name: (n) => n.name,
  trigger: (n) => triggerSummary(n.trigger),
  category: (n) => n.category,
  status: (n) => ntStateOrder.indexOf(n.state),
  updated: (n) => n.updatedAt,
};

const filterGetters: FilterGetters<Notification> = {
  trigger: (n) => n.trigger.kind,
  event: (n) => (n.trigger.kind === "event" ? n.trigger.event : ""),
  sensitivity: (n) => n.sensitivity,
  updated: (n) => n.updatedAt.slice(0, 7),
};

const tabLabel: Record<NtState, string> = { active: "Active", draft: "Drafts", disabled: "Disabled" };

export function NtList({ category, initialStatus }: { category: string; initialStatus?: NtState }) {
  const all = useNotifications();
  const labelFor = useRecipientLabels();
  const roleHref = useRoleHref();
  const scoped = category ? all.filter((n) => n.category === category) : all;
  const [status, setStatus] = useState<NtState | "all">(initialStatus ?? "all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const resetPage = () => setPage(1);

  const usedEvents = new Set(scoped.map((n) => (n.trigger.kind === "event" ? n.trigger.event : "")));
  const filterSections: FilterSection[] = [
    { id: "trigger", label: "Trigger", icon: Zap, options: [{ id: "event", label: "When something happens" }, { id: "schedule", label: "On a schedule" }] },
    { id: "event", label: "Event", icon: Activity, options: NT_EVENTS.filter((e) => usedEvents.has(e.id)).map((e) => ({ id: e.id, label: e.label })) },
    { id: "sensitivity", label: "Classification", icon: Lock01, options: Object.entries(SENSITIVITY).map(([id, s]) => ({ id, label: s.label })) },
    { id: "updated", label: "Last updated", icon: Calendar, options: monthOptions(scoped.map((n) => n.updatedAt)) },
  ];
  const filter = useSelectionFilter(filterSections, filterGetters, filters, (next) => {
    setFilters(next);
    resetPage();
  });

  const query = search.trim().toLowerCase();
  const narrowedBySearch = scoped
    .filter((n) => filter.matches(n))
    .filter((n) => !query || [n.name, n.id, n.description, n.subject, triggerSummary(n.trigger)].some((v) => v.toLowerCase().includes(query)));
  const count = (s: NtState) => narrowedBySearch.filter((n) => n.state === s).length;
  const rows = sortRows(
    narrowedBySearch.filter((n) => status === "all" || n.state === status),
    sort,
    sortKeys,
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const narrowed = !!query || Object.values(filters).some((set) => set.size > 0);
  const newHref = roleHref(`${NT_ROOT}/new${category ? `?category=${encodeURIComponent(category)}` : ""}`);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{category || "Notifications"}</SectionHeader.Heading>
              <CountBadge count={scoped.length} color="brand" />
            </div>
            <SectionHeader.Subheading>The emails BioData SA sends automatically: when, to whom, and what they say.</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={newHref}>
              New notification
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <Tabs
          className="shrink-0"
          selectedKey={status}
          onSelectionChange={(key: Key) => {
            setStatus(key as NtState | "all");
            resetPage();
          }}
        >
          <TabList aria-label="Status" type="underline" size="sm">
            <Tab id="all" label="All" icon={Bell01} badge={narrowedBySearch.length} />
            {ntStateOrder.map((s) => (
              <Tab key={s} id={s} label={tabLabel[s]} icon={Flag01} badge={count(s)} />
            ))}
          </TabList>
        </Tabs>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search notifications"
            placeholder="Search names, subjects and triggers"
            value={search}
            onChange={(next) => {
              setSearch(next);
              resetPage();
            }}
          />
          <FilterMenu filter={filter} />
        </div>
        <AttributeFilterChips filter={filter} />

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-tertiary">
              {narrowed
                ? query
                  ? `No notifications match “${search.trim()}”${category ? ` in ${category}` : ""}.`
                  : "No notifications match your filters."
                : status !== "all"
                  ? `No ${tabLabel[status].toLowerCase()} notifications${category ? ` in ${category}` : ""}.`
                  : `There are no notifications in ${category} yet.`}
            </p>
            {narrowed ? (
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  setSearch("");
                  setFilters({});
                  resetPage();
                }}
              >
                Clear search and filters
              </Button>
            ) : status === "all" ? (
              <Button color="link-color" size="sm" iconLeading={Plus} href={newHref}>
                Add one to {category}
              </Button>
            ) : null}
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table layout="fixed" className="min-w-[1000px]"
              bodyScrollable
              aria-label="Notifications"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                resetPage();
              }}
            >
              <Table.Header sticky>
                <Table.Head id="id" label="ID" isRowHeader allowsSorting className="w-[9%]" />
                <Table.Head id="name" label="Notification" allowsSorting className="w-[25%]" />
                <Table.Head id="trigger" label="Trigger" allowsSorting className="w-[20%]" />
                <Table.Head id="to" label="Recipients" className="w-[15%]" />
                {!category ? <Table.Head id="category" label="Category" allowsSorting className="w-[11%]" /> : null}
                {status === "all" ? <Table.Head id="status" label="Status" allowsSorting className="w-[10%]" /> : null}
                <Table.Head id="updated" label="Last updated" allowsSorting className="w-[10%]" />
              </Table.Header>
              <Table.Body items={paged} dependencies={[status, category]}>
                {(n) => {
                  const KindIcon = n.trigger.kind === "event" ? Zap : Clock;
                  return (
                    <Table.Row id={n.id} href={roleHref(`${NT_ROOT}/${n.id}`)} textValue={n.name} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary tabular-nums">{n.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{n.name}</p>
                          {n.description && <p className="max-w-xs truncate text-xs text-tertiary">{n.description}</p>}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="flex items-start gap-2 text-sm text-secondary">
                          <KindIcon className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-label={n.trigger.kind === "event" ? "When something happens" : "On a schedule"} />
                          <span>{triggerSummary(n.trigger)}</span>
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="block max-w-56 truncate text-sm text-secondary">{recipientsSummary(effectiveTo(n), labelFor(n.trigger))}</span>
                      </Table.Cell>
                      {!category ? (
                        <Table.Cell>
                          <span className="text-sm text-secondary">{n.category || <span className="text-quaternary">Not provided</span>}</span>
                        </Table.Cell>
                      ) : null}
                      {status === "all" ? (
                        <Table.Cell>
                          <Badge size="sm" color={ntStateMeta[n.state].badgeColor}>
                            {ntStateMeta[n.state].label}
                          </Badge>
                        </Table.Cell>
                      ) : null}
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(n.updatedAt)}</span>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              </Table.Body>
            </Table>
            <TableCard.PaginationNumbered
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                resetPage();
              }}
              totalCount={rows.length}
            />
          </TableCard.Root>
        )}
      </div>
    </div>
  );
}
