"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import { AREAS, SCREENS, type Access, type Screen } from "@/app/pages/_shared/screen-index";

// /pages index: every screen of the BioData SA prototype in one table, so opening /pages shows what
// exists instead of a 404. The same `SectionHeader` + search + `TableCard`/`Table` combination as the
// /proto index and every collection screen.
//
// It is a directory, not a product screen, so it has no header, rail or column 2 (named in the
// CONTRACTS.md 3.7 exemptions). "Open as" picks the persona every link opens in (`?userRole=`), so
// each screen can be checked as each role from here.
//
// Maintained by hand: a new screen needs one line here. Routes with an id in them link to a real
// seeded record (a project, an agreement, a nomination, a user).


// Role names as the Prototype tools bar and User Management write them.
const ROLE_NAMES: Record<UserRole, string> = {
  "biodata-super-admin": "BioData Super Admin",
  "biodata-admin": "BioData Admin",
  "biodata-user": "BioData User",
  "privileged-admin": "Privileged Admin",
  "privileged-user": "Privileged User",
  "registered-user": "Registered User",
  "public-user": "Public user (signed out)",
};

const accessColor: Record<Access, "gray" | "brand" | "warning"> = {
  Everyone: "gray",
  "Signed in": "brand",
  "BioData Admin": "warning",
  "BioData Super Admin": "warning",
};

const sortKeys: Record<string, (s: Screen) => SortValue> = {
  screen: (s) => s.name,
  area: (s) => AREAS.indexOf(s.area),
};

export default function PagesIndex() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole>("public-user");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "area", direction: "ascending" });

  const query = search.trim().toLowerCase();
  const matching = SCREENS.filter(
    (s) => !query || [s.name, s.path, s.area, s.description].some((v) => v.toLowerCase().includes(query)),
  );
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="font-barlow flex h-screen flex-col bg-primary">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Prototype screens</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>
              Every screen of the BioData SA prototype. Pick who to view them as, then open one.
            </SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-end gap-3">
          <div className="w-full max-w-sm">
            <Input
              aria-label="Search screens"
              size="sm"
              icon={SearchMd}
              placeholder="Search by name, route or area"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setPage(1);
              }}
            />
          </div>
          <div className="w-64">
            <Select
              aria-label="Open screens as"
              size="sm"
              items={USER_ROLES.map((id) => ({ id, label: ROLE_NAMES[id] }))}
              selectedKey={role}
              onSelectionChange={(key) => setRole(key as UserRole)}
            >
              {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No screens match your search.</p>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table layout="fixed" className="min-w-[840px]"
              aria-label="Prototype screens"
              bodyScrollable
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="screen" label="Screen" allowsSorting isRowHeader className="w-[22%]" />
                <Table.Head id="area" label="Area" allowsSorting className="w-[14%]" />
                <Table.Head id="access" label="Who can use it" className="w-[22%]" />
                <Table.Head id="description" label="What it is" className="w-[42%]" />
              </Table.Header>
              <Table.Body items={pagedRows} dependencies={[role]}>
                {(s) => (
                  <Table.Row id={s.path} href={`${s.path}?userRole=${role}`} textValue={s.name} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{s.name}</span>
                        <span className="text-xs text-tertiary">{s.path}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary">{s.area}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={accessColor[s.access]}>
                        {s.access}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-balance text-tertiary">{s.description}</span>
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
    </div>
  );
}
