"use client";

import { useState, type ReactNode } from "react";
import { Clock, Plus, SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { nearestToExpiry } from "@/app/pages/_shared/agreement-status";
import { DlaEmptyState } from "@/app/pages/_shared/dla/dla-detail";
import { dlaStatusMeta, formatShortDate, requestorName, type Dla, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { useRoleHref } from "@/lib/use-role-href";

// The DLA list, same shape as DSA's own list (app/pages/_shared/dsa/dsa-list.tsx): a table of one
// status bucket (chosen in column 2), rows link straight to their deep dive. No Status column -
// column 2 already says which bucket this is.
//
// `banner`, `statusTabs`, and `extraFilter` are additive, opt-in slots (all default undefined, no
// change for any existing consumer), same as DsaListContent's own - see that file's comment.
// `DlaBanner` below is the real, folded-in banner, rendered from `app/pages/dla/page.tsx`.

const subheadings: Record<DlaStatus, string> = {
  draft: "Drafts that haven't been submitted yet.",
  submitted: "Requests submitted, waiting for a reviewer to pick them up.",
  under_review: "Requests a reviewer is currently assessing.",
  on_hold: "Requests paused pending information from the requester.",
  approved: "Requests approved and waiting on their own start date.",
  rejected: "Requests that weren't approved.",
  active: "Agreements you can use to access licensed data.",
  closed: "Agreements that have run their course, automatically or manually.",
  cancelled: "Requests or agreements cancelled by the requester or an admin.",
};

const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

/**
 * Column-3 banner (via `DlaListContent`'s own `banner` prop) - folded in directly from
 * /proto/collection-sidebar's own "Actions" baseline (see CONTEXT.md). Real `TaskItem`, not
 * `AlertFullWidth` - see `DsaBanner` in dsa-list.tsx for the same reasoning. Renders nothing when
 * there's nothing to say.
 */
export function DlaBanner() {
  const dlas = useDlas();
  const roleHref = useRoleHref();
  const expiring = nearestToExpiry(dlas);
  const reviewCount = dlas.filter((d) => d.status === "under_review").length;
  if (reviewCount === 0 && !expiring) return null;
  return (
    <div className="flex flex-col gap-3">
      {reviewCount > 0 && (
        <TaskItem
          icon={Clock}
          title="Requests awaiting review"
          detail={`${reviewCount} request${reviewCount === 1 ? "" : "s"} awaiting your decision.`}
          status={dlaStatusMeta.under_review.label}
          statusColor={dlaStatusMeta.under_review.badgeColor}
          actionLabel="Review requests"
          actionHref={roleHref("/pages/dla?status=under_review")}
        />
      )}
      {expiring && (
        <TaskItem
          icon={Clock}
          title={expiring.id}
          detail={`${requestorName(expiring.requestor) || "No requestor set"} - expires ${formatShortDate(expiring.validTo)}.`}
          status={dlaStatusMeta[expiring.status].label}
          statusColor={dlaStatusMeta[expiring.status].badgeColor}
          actionLabel="View request"
          actionHref={roleHref(`/pages/dla/${expiring.id}`)}
        />
      )}
    </div>
  );
}

export function DlaListContent({
  status,
  banner,
  statusTabs,
  extraFilter,
}: {
  status: DlaStatus;
  banner?: ReactNode;
  statusTabs?: ReactNode;
  extraFilter?: (dla: Dla) => boolean;
}) {
  const roleHref = useRoleHref();
  const dlas = useDlas();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const statusMatches = dlas.filter((d) => d.status === status);
  const inStatus = (extraFilter ? statusMatches.filter(extraFilter) : statusMatches).sort((a, b) =>
    a.submittedAt === b.submittedAt ? b.id.localeCompare(a.id) : b.submittedAt.localeCompare(a.submittedAt),
  );
  const query = search.trim().toLowerCase();
  const rows = query
    ? inStatus.filter((d) => [d.id, d.requestor.organisation, requestorName(d.requestor), ...d.locations.map((l) => l.name)].some((v) => v.toLowerCase().includes(query)))
    : inStatus;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Data Licencing Agreements</SectionHeader.Heading>
              <CountBadge count={inStatus.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{subheadings[status]}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/dla/new")}>
              New request
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {statusTabs}

      {inStatus.length === 0 ? (
        <DlaEmptyState status={status} newHref={roleHref("/pages/dla/new")} />
      ) : (
        <div className="flex flex-col gap-4 p-6">
          {banner}
          <div className="w-full max-w-sm">
            <Input
              aria-label="Search requests"
              size="sm"
              icon={SearchMd}
              placeholder="Search ID, organisation or location"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-tertiary">No {dlaStatusMeta[status].label.toLowerCase()} requests match your search.</p>
          ) : (
            <TableCard.Root>
              <Table aria-label={`${dlaStatusMeta[status].label} Data Licencing Agreements`}>
                <Table.Header>
                  {/* `label` (not children) - Table.Head only applies the header treatment to the prop. */}
                  <Table.Head id="id" label="Request" isRowHeader />
                  <Table.Head id="requestor" label="Requestor" />
                  <Table.Head id="locations" label="Locations" />
                  <Table.Head id="period" label="Agreement period" />
                  <Table.Head id="updated" label="Updated" />
                </Table.Header>
                <Table.Body items={paged}>
                  {(dla) => (
                    <Table.Row id={dla.id} href={roleHref(`/pages/dla/${dla.id}`)} textValue={dla.id} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{dla.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Avatar size="xs" initials={initials(dla.requestor.firstName, dla.requestor.lastName)} alt={requestorName(dla.requestor)} />
                          <div className="flex flex-col">
                            <span className="text-sm text-secondary">{requestorName(dla.requestor)}</span>
                            <span className="text-xs text-quaternary">{dla.requestor.organisation}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-tertiary">
                          {dla.locations[0]?.name ?? "No locations"}
                          {dla.locations.length > 1 ? ` +${dla.locations.length - 1} more` : ""}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {dla.validFrom && dla.validTo ? (
                          <span className="text-sm whitespace-nowrap text-tertiary">
                            {formatShortDate(dla.validFrom)} to {formatShortDate(dla.validTo)}
                          </span>
                        ) : (
                          <span className="text-sm text-quaternary">Not set</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(dla.updatedAt)}</span>
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
                  setPage(1);
                }}
                totalCount={rows.length}
              />
            </TableCard.Root>
          )}
        </div>
      )}
    </>
  );
}
