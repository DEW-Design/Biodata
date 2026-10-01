"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Plus } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, matchesFilters, monthOptions, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { NT_EVENTS, SENSITIVITY, effectiveTo, formatShortDate, ntStateMeta, ntStateOrder, recipientsSummary, triggerShort, triggerSummary, type Notification, type NtState } from "@/app/pages/_shared/notifications/nt-data";
import { useRecipientLabels } from "@/app/pages/_shared/notifications/nt-directory";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { useRoleHref } from "@/lib/use-role-href";
import { useNtRoot } from "@/app/pages/_shared/notifications/nt-root";

// The notification list (Figma "Notifications", node 1584:22620), as Controlled Vocabulary's list:
// the collection pattern (CONTRACTS 4.2), section header with count and "New notification", toolbar
// search and Filter, then the table; a row opens the notification's page, where its email is
// previewed. The designer turned down a split view with a preview beside the list (1 Oct 2026), so
// the earlier 4.2 override is withdrawn.
//
// Built for hundreds: the search reads the name, ID, description, subject and trigger; Filter narrows
// by status, how it is sent, the event, classification and the month it was updated; Category is
// column 2's, so the Category column shows only under "All notifications" (4.3, never two controls for
// one fact). The Figma's Active / Drafts / Disabled tabs are the Status filter (?status= seeds it).

const sortKeys: Record<string, (n: Notification) => SortValue> = {
  name: (n) => n.name,
  sent: (n) => triggerShort(n.trigger),
  category: (n) => n.category,
  status: (n) => ntStateOrder.indexOf(n.state),
  updated: (n) => n.updatedAt,
};

const filterGetters: FilterGetters<Notification> = {
  status: (n) => n.state,
  trigger: (n) => n.trigger.kind,
  event: (n) => (n.trigger.kind === "event" ? n.trigger.event : ""),
  sensitivity: (n) => n.sensitivity,
  updated: (n) => n.updatedAt.slice(0, 7),
};

export function NtList({ category, initialStatuses = [] }: { category: string; initialStatuses?: NtState[] }) {
  const all = useNotifications();
  const labelFor = useRecipientLabels();
  const roleHref = useRoleHref();
  const root = useNtRoot();
  const scoped = category ? all.filter((n) => n.category === category) : all;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({ status: new Set<string>(initialStatuses) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });

  const usedEvents = new Set(scoped.map((n) => (n.trigger.kind === "event" ? n.trigger.event : "")));
  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", options: ntStateOrder.map((id) => ({ id, label: ntStateMeta[id].label })) },
    { id: "trigger", label: "Trigger", options: [{ id: "event", label: "When something happens" }, { id: "schedule", label: "On a schedule" }] },
    { id: "event", label: "Event", options: NT_EVENTS.filter((e) => usedEvents.has(e.id)).map((e) => ({ id: e.id, label: e.label })) },
    { id: "sensitivity", label: "Classification", options: Object.entries(SENSITIVITY).map(([id, s]) => ({ id, label: s.label })) },
    { id: "updated", label: "Updated", options: monthOptions(scoped.map((n) => n.updatedAt)) },
  ];

  const query = search.trim().toLowerCase();
  const matching = scoped
    .filter((n) => matchesFilters(n, filters, filterGetters))
    .filter((n) => !query || [n.name, n.id, n.description, n.subject, triggerSummary(n.trigger), triggerShort(n.trigger)].some((v) => v.toLowerCase().includes(query)));
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const narrowed = !!query || Object.values(filters).some((set) => set.size > 0);
  const resetPage = () => setPage(1);
  const newHref = roleHref(`${root}/new${category ? `?category=${encodeURIComponent(category)}` : ""}`);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{category || "Notifications"}</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
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
          <div>
            <ListFilterButton
              sections={filterSections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                resetPage();
              }}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-tertiary">
              {narrowed ? (query ? `No notifications match “${search.trim()}”${category ? ` in ${category}` : ""}.` : "No notifications match your filters.") : `There are no notifications in ${category} yet.`}
            </p>
            {narrowed ? (
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  setSearch("");
                  setFilters({ status: new Set() });
                  resetPage();
                }}
              >
                Clear search and filters
              </Button>
            ) : (
              <Button color="link-color" size="sm" iconLeading={Plus} href={newHref}>
                Add one to {category}
              </Button>
            )}
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              aria-label="Notifications"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                resetPage();
              }}
            >
              <Table.Header sticky>
                <Table.Head id="name" label="Notification" isRowHeader allowsSorting />
                <Table.Head id="sent" label="Trigger" allowsSorting />
                <Table.Head id="to" label="Recipients" />
                {!category ? <Table.Head id="category" label="Category" allowsSorting /> : null}
                <Table.Head id="status" label="Status" allowsSorting />
                <Table.Head id="updated" label="Updated" allowsSorting />
              </Table.Header>
              <Table.Body items={paged}>
                {(n) => (
                  <Table.Row id={n.id} href={roleHref(`${root}/${n.id}`)} textValue={n.name} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{n.name}</p>
                        {n.description && <p className="max-w-md truncate text-xs text-tertiary">{n.description}</p>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-secondary">{triggerShort(n.trigger)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="block max-w-56 truncate text-sm text-secondary">{recipientsSummary(effectiveTo(n), labelFor(n.trigger))}</span>
                    </Table.Cell>
                    {!category ? (
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-secondary">{n.category || <span className="text-quaternary">Not provided</span>}</span>
                      </Table.Cell>
                    ) : null}
                    <Table.Cell>
                      <Badge size="sm" color={ntStateMeta[n.state].badgeColor}>
                        {ntStateMeta[n.state].label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(n.updatedAt)}</span>
                    </Table.Cell>
                  </Table.Row>
                )}
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
