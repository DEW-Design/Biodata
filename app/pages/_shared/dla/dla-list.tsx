"use client";

import { useState } from "react";
import { Plus, SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { DlaEmptyState } from "@/app/pages/_shared/dla/dla-detail";
import { dlaStatusMeta, formatShortDate, requestorName, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";

// The DLA list, same shape as DSA's own list (app/pages/_shared/dsa/dsa-list.tsx): a table of one
// status bucket (chosen in column 2), rows link straight to their deep dive. No Status column -
// column 2 already says which bucket this is.

const subheadings: Record<DlaStatus, string> = {
  active: "Agreements you can use to access licensed data.",
  under_review: "Requests waiting on a decision.",
  rejected: "Requests that weren't approved.",
  expired: "Agreements past their grant period - renew to keep access.",
  withdrawn: "Requests or agreements that were withdrawn.",
};

const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

export function DlaListContent({ status }: { status: DlaStatus }) {
  const roleHref = useRoleHref();
  const dlas = useDlas();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const inStatus = dlas.filter((d) => d.status === status).sort((a, b) => (a.submittedAt === b.submittedAt ? b.id.localeCompare(a.id) : b.submittedAt.localeCompare(a.submittedAt)));
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

      {inStatus.length === 0 ? (
        <DlaEmptyState status={status} newHref={roleHref("/pages/dla/new")} />
      ) : (
        <div className="flex flex-col gap-4 p-6">
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
