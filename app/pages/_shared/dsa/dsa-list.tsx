"use client";

import { useState } from "react";
import { Plus, SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { DsaEmptyState } from "@/app/pages/_shared/dsa/dsa-detail";
import { contactName, dsaStatusMeta, formatShortDate, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { useRoleHref } from "@/lib/use-role-href";

// The DSA list: a table of agreements in one status bucket (chosen in column 2), each row linking to
// that agreement's deep dive at /pages/dsa/<id>. Same shape as the Projects list
// (project-list-content.tsx): a SectionHeader, then a TableCard with numbered pagination, rows are
// links. There is no Status column - the bucket is already chosen in column 2, so a column of
// identical badges would state the same fact twice.

const subheadings: Record<DsaStatus, string> = {
  active: "Agreements in effect between DEW and partner organisations.",
  inactive: "Agreements that are no longer in effect.",
  revoked: "Agreements that have been revoked.",
  draft: "Drafts that haven't been submitted yet.",
};

const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

export function DsaListContent({ status }: { status: DsaStatus }) {
  const roleHref = useRoleHref();
  const dsas = useDsas();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const inStatus = dsas.filter((d) => d.status === status).sort((a, b) => (a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt)));
  const query = search.trim().toLowerCase();
  const rows = query ? inStatus.filter((d) => [d.id, d.partner, contactName(d.requestedBy)].some((v) => v.toLowerCase().includes(query))) : inStatus;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Data Sharing Agreements</SectionHeader.Heading>
              <CountBadge count={inStatus.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{subheadings[status]}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/dsa/new")}>
              New agreement
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {inStatus.length === 0 ? (
        <DsaEmptyState status={status} newHref={roleHref("/pages/dsa/new")} />
      ) : (
        <div className="flex flex-col gap-4 p-6">
          <div className="w-full max-w-sm">
            <Input
              aria-label="Search agreements"
              size="sm"
              icon={SearchMd}
              placeholder="Search ID, organisation or requester"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-tertiary">No {dsaStatusMeta[status].label.toLowerCase()} agreements match your search.</p>
          ) : (
            <TableCard.Root>
              <Table aria-label={`${dsaStatusMeta[status].label} Data Sharing Agreements`}>
                <Table.Header>
                  {/* `label` (not children) - Table.Head only applies the header treatment to the prop. */}
                  <Table.Head id="id" label="Agreement" isRowHeader />
                  <Table.Head id="partner" label="Data partner" />
                  <Table.Head id="period" label="Agreement period" />
                  <Table.Head id="requester" label="Requested by" />
                  <Table.Head id="via" label="Shared via" />
                  <Table.Head id="updated" label="Updated" />
                </Table.Header>
                <Table.Body items={paged}>
                  {(dsa) => (
                    <Table.Row id={dsa.id} href={roleHref(`/pages/dsa/${dsa.id}`)} textValue={dsa.id} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{dsa.id}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-secondary">{dsa.partner || <span className="text-quaternary">Not provided</span>}</span>
                      </Table.Cell>
                      <Table.Cell>
                        {dsa.validFrom && dsa.validTo ? (
                          <span className="text-sm whitespace-nowrap text-tertiary">
                            {formatShortDate(dsa.validFrom)} to {formatShortDate(dsa.validTo)}
                          </span>
                        ) : (
                          <span className="text-sm text-quaternary">Not set</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {contactName(dsa.requestedBy) ? (
                          <div className="flex items-center gap-2">
                            <Avatar size="xs" initials={initials(dsa.requestedBy.firstName, dsa.requestedBy.lastName)} alt={contactName(dsa.requestedBy)} />
                            <span className="text-sm text-secondary">{contactName(dsa.requestedBy)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-quaternary">Not provided</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-1.5">
                          {dsa.sharedOffline && <Badge size="sm" color="gray">Offline</Badge>}
                          {dsa.sharedViaSystem && (
                            <Badge size="sm" color="brand">
                              System{dsa.systems.length > 0 ? ` (${dsa.systems.length})` : ""}
                            </Badge>
                          )}
                          {!dsa.sharedOffline && !dsa.sharedViaSystem && <span className="text-sm text-quaternary">Not set</span>}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(dsa.updatedAt)}</span>
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
