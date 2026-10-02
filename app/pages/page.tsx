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

type Access = "Everyone" | "Signed in" | "BioData Admin" | "BioData Super Admin";
type Area =
  | "Start"
  | "Sign in"
  | "Home"
  | "Projects"
  | "Explore"
  | "Data licence (DLA)"
  | "Data sharing (DSA)"
  | "Nominations"
  | "User management"
  | "Controlled Vocabulary"
  | "Taxonomy Management"
  | "Notification Management"
  | "Template Finder"
  | "Reports"
  | "Unlinked"
  | "Voucher Management";

const AREAS: Area[] = ["Start", "Sign in", "Home", "Projects", "Explore", "Data licence (DLA)", "Data sharing (DSA)", "Nominations", "User management", "Taxonomy Management", "Notification Management", "Controlled Vocabulary", "Voucher Management", "Template Finder", "Reports", "Unlinked"];

interface Screen {
  path: string;
  name: string;
  area: Area;
  description: string;
  access: Access;
}

const SCREENS: Screen[] = [
  { area: "Start", name: "Landing page", path: "/pages/biodata-home", access: "Everyone", description: "The public front door: hero search, what BioData SA is, where to next." },
  { area: "Sign in", name: "Log in", path: "/pages/auth/login", access: "Everyone", description: "Email and password, or the password-only step after a reset." },
  { area: "Sign in", name: "Sign up", path: "/pages/auth/signup", access: "Everyone", description: "Create an account; continues to the email code." },
  { area: "Sign in", name: "Verify email", path: "/pages/auth/verify-email", access: "Everyone", description: "The 6-digit code sent to the new account's email." },
  { area: "Sign in", name: "Set password", path: "/pages/auth/set-password", access: "Everyone", description: "Choose a password, with the live checklist." },
  { area: "Sign in", name: "Account created", path: "/pages/auth/account-created", access: "Everyone", description: "Confirmation before setting up the profile." },
  { area: "Sign in", name: "Set up profile", path: "/pages/auth/setup-profile", access: "Everyone", description: "Three steps: your details, organisations and roles, preferences." },
  { area: "Sign in", name: "Forgot password", path: "/pages/auth/forgot-password", access: "Everyone", description: "Ask for a reset link." },
  { area: "Sign in", name: "Check your email", path: "/pages/auth/check-email", access: "Everyone", description: "After asking for a reset link." },
  { area: "Sign in", name: "Reset password", path: "/pages/auth/reset-password", access: "Everyone", description: "Choose a new password." },
  { area: "Sign in", name: "Password reset", path: "/pages/auth/reset-success", access: "Everyone", description: "Confirmation, then back to log in." },
  { area: "Home", name: "Home", path: "/pages/dashboard", access: "Everyone", description: "My BioData and the Flora and Fauna Dashboard; a public user gets the dashboard and the sign-up card." },
  { area: "Projects", name: "Projects", path: "/pages/project-list", access: "Everyone", description: "Every project, with search, filters and sorting." },
  { area: "Projects", name: "Project page, Adelaide Hills (option 1)", path: "/pages/project-detail", access: "Everyone", description: "The project page template on its canonical route: Project, Project records, Species and Artefacts tabs, with editing and flagged concepts." },
  { area: "Projects", name: "Project page, Adelaide Hills (option 2)", path: "/pages/project-detail/option-2", access: "Everyone", description: "The hand-built project page: tabs with the records tree." },
  { area: "Projects", name: "Project page", path: "/pages/project-list/kangaroo-island/project-details", access: "Everyone", description: "The same template for every project; other projects are built from the shared data (Kangaroo Island shown)." },
  { area: "Projects", name: "Record page", path: "/pages/project-list/kangaroo-island/project-details/occurrences/occ-7", access: "Everyone", description: "One occurrence on its project (a Southern Hairy-nosed Wombat)." },
  { area: "Projects", name: "Upload dataset", path: "/pages/project-list/kangaroo-island/upload", access: "Signed in", description: "Upload a spreadsheet to a project, then the data upload acknowledgement." },
  { area: "Projects", name: "Add Project, option 1", path: "/pages/project-registration", access: "Signed in", description: "One question per card." },
  { area: "Projects", name: "Add Project, option 2", path: "/pages/project-registration/option-2", access: "Signed in", description: "The form pattern: sections in column 2." },
  { area: "Explore", name: "Explore, option 1", path: "/pages/observations", access: "Everyone", description: "A floating card over the map; search areas as layers." },
  { area: "Explore", name: "Explore, option 2", path: "/pages/observations/option-2", access: "Everyone", description: "Search the map, then a results page." },
  { area: "Explore", name: "Observation", path: "/pages/observation-detail", access: "Everyone", description: "The original observation screen (OBS094)." },
  { area: "Data licence (DLA)", name: "Licence requests", path: "/pages/dla", access: "Signed in", description: "All requests and My requests, every status in one table." },
  { area: "Data licence (DLA)", name: "Request a licence", path: "/pages/dla/new", access: "Signed in", description: "Locations and licence level, purpose, review." },
  { area: "Data licence (DLA)", name: "Licence request", path: "/pages/dla/DLA-2026-00502", access: "Signed in", description: "One request and its actions (DLA-2026-00502)." },
  { area: "Data sharing (DSA)", name: "Sharing agreements", path: "/pages/dsa", access: "BioData Admin", description: "Every data sharing agreement, every status in one table." },
  { area: "Data sharing (DSA)", name: "New agreement", path: "/pages/dsa/new", access: "BioData Admin", description: "Agreement, contacts, data sharing." },
  { area: "Data sharing (DSA)", name: "Sharing agreement", path: "/pages/dsa/DSA-2025-01348", access: "BioData Admin", description: "One agreement and its actions (DSA-2025-01348)." },
  { area: "Nominations", name: "Nominations", path: "/pages/nominations", access: "Signed in", description: "Sensitive species nominations; the panel sees All." },
  { area: "Nominations", name: "Nominate a species", path: "/pages/nominations/new", access: "Signed in", description: "Species, what to protect, justification, review." },
  { area: "Nominations", name: "Nomination", path: "/pages/nominations/NSS-2026-00001", access: "Signed in", description: "One nomination, its status and audit history (NSS-2026-00001)." },
  { area: "User management", name: "Users", path: "/pages/user-management", access: "BioData Admin", description: "Every user, with type, organisation and status." },
  { area: "User management", name: "User", path: "/pages/user-management/users/USR-1001", access: "BioData Admin", description: "One user, their roles and permissions (Jane Harlow)." },
  { area: "User management", name: "Add user", path: "/pages/user-management/users/new", access: "BioData Admin", description: "Details, organisation, roles." },
  { area: "User management", name: "Roles", path: "/pages/user-management/roles", access: "BioData Admin", description: "Every role." },
  { area: "User management", name: "Role", path: "/pages/user-management/roles/ROLE-101", access: "BioData Admin", description: "One role, its permissions and users." },
  { area: "User management", name: "Add role", path: "/pages/user-management/roles/new", access: "BioData Admin", description: "Name, type and permissions." },
  { area: "User management", name: "Permissions", path: "/pages/user-management/permissions", access: "BioData Admin", description: "Every permission, by category." },
  { area: "User management", name: "Permission", path: "/pages/user-management/permissions/PERM-301", access: "BioData Admin", description: "One permission and the roles that have it." },
  { area: "User management", name: "Add permissions", path: "/pages/user-management/permissions/new", access: "BioData Admin", description: "Several at once, under a category." },
  { area: "Controlled Vocabulary", name: "Vocabularies", path: "/pages/ctrl-vocab", access: "BioData Super Admin", description: "Every vocabulary: search inside entries, categories, templates from Actions." },
  { area: "Controlled Vocabulary", name: "Vocabulary", path: "/pages/ctrl-vocab/BIODATA-114", access: "BioData Super Admin", description: "One vocabulary: entries, details, history (the BRD's Measurement example)." },
  { area: "Controlled Vocabulary", name: "Descriptive vocabulary", path: "/pages/ctrl-vocab/BIODATA-115", access: "BioData Super Admin", description: "Fauna species, picked from the Taxonomy table." },
  { area: "Controlled Vocabulary", name: "New vocabulary", path: "/pages/ctrl-vocab/new", access: "BioData Super Admin", description: "Details, columns, then entries." },
  { area: "Taxonomy Management", name: "Species", path: "/pages/taxonomy", access: "BioData Admin", description: "Every species, Flora and Fauna, as a list or the hierarchy; Update taxonomy starts a change." },
  { area: "Taxonomy Management", name: "Species record", path: "/pages/taxonomy/P01937", access: "BioData Admin", description: "South Australian Blue Gum: Flora tabs, edit in place, Synonyms view." },
  { area: "Taxonomy Management", name: "Rename Taxon", path: "/pages/taxonomy/new?type=rename", access: "BioData Admin", description: "A guided change: taxon in, new name, before and after review. Combine, Split, Append the same." },
  { area: "Notification Management", name: "Notifications", path: "/pages/notifications", access: "BioData Admin", description: "Every notification beside its email: arrow through them to preview." },
  { area: "Notification Management", name: "Notification", path: "/pages/notifications/NTF-001", access: "BioData Admin", description: "One notification: preview, settings, history (Observation submitted successfully)." },
  { area: "Notification Management", name: "New notification", path: "/pages/notifications/new", access: "BioData Admin", description: "Trigger, recipients, then the message beside a live preview." },
  { area: "Notification Management", name: "Notifications, Option 2", path: "/pages/notifications/option-2", access: "BioData Admin", description: "Status tabs, triggers in words, the same notifications." },
  { area: "Notification Management", name: "Notification, Option 2", path: "/pages/notifications/option-2/NTF-001", access: "BioData Admin", description: "How it works beside the email, then History." },
  { area: "Notification Management", name: "New notification, Option 2", path: "/pages/notifications/option-2/new", access: "BioData Admin", description: "The email builds beside every section." },
  { area: "Voucher Management", name: "Scan batches", path: "/pages/vouchers", access: "BioData Super Admin", description: "Every scan, Herbarium and SA Museum run separately; the source in column 2." },
  { area: "Voucher Management", name: "Batch to review", path: "/pages/vouchers/1012", access: "BioData Super Admin", description: "Option 1: a row per record, its fields as lines; set Your update, then push or ignore." },
  { area: "Voucher Management", name: "Batch to review, Option 2", path: "/pages/vouchers/option-2/1012", access: "BioData Super Admin", description: "A row per field, coloured by where it stands, as in the Figma." },
  { area: "Voucher Management", name: "Record comparison", path: "/pages/vouchers/1012?record=ADH-2024-118", access: "BioData Super Admin", description: "One record's four fields beside the Herbarium's, and its history across scans." },
  { area: "Template Finder", name: "Template Finder", path: "/pages/template-finder", access: "Signed in", description: "Standard dataset templates, with search and filters." },
  { area: "Reports", name: "Reports", path: "/pages/reports", access: "Signed in", description: "The landing page: one card per report." },
  { area: "Reports", name: "Data Ingestion Report Pre-Flight Validation", path: "/pages/reports/data-ingestion", access: "Signed in", description: "Every dataset upload from validation to approval; a registered user sees theirs, BioData Admin sees all." },
  { area: "Reports", name: "Project Dataset Post Ingestion", path: "/pages/reports/post-ingestion", access: "Signed in", description: "Every dataset submission beside its project's facts; a registered user sees theirs, BioData Admin sees all." },
  { area: "Reports", name: "Project Sensitive and Restriction Report", path: "/pages/reports/sensitive-restriction", access: "Signed in", description: "Every restriction on a project, with reviewer and treatment." },
  { area: "Reports", name: "Voucher ID Update Report", path: "/pages/reports/voucher-id-update", access: "Signed in", description: "Museum or herbarium voucher details beside BioData's, with the mismatch." },
  { area: "Reports", name: "Data Validation Error Report", path: "/pages/reports/data-validation-error", access: "Signed in", description: "The errors found in one chosen dataset." },
  { area: "Reports", name: "Data Validation Error Report (option 2)", path: "/pages/reports/data-validation-error/option-2", access: "Signed in", description: "The same report with the Project and Dataset selects as the first row of the card." },
  { area: "Reports", name: "SpecimenDB Refresh Report", path: "/pages/reports/specimendb-refresh", access: "Signed in", description: "Specimen batches refreshed from SpecimenDB, in Darwin Core." },
  { area: "Reports", name: "Project Detail Report", path: "/pages/reports/project-detail", access: "Signed in", description: "Every project's registration and record counts in one table." },
  { area: "Reports", name: "Species Detail Report", path: "/pages/reports/species-detail", access: "Signed in", description: "Every species record with its codes, voucher and measurements." },
  { area: "Reports", name: "Events, Occurrences and Observations Report", path: "/pages/reports/events-occurrences-observations", access: "Signed in", description: "The survey records at each level, in three tabs." },
  { area: "Unlinked", name: "Projects draft", path: "/pages/projects", access: "Everyone", description: "A stale draft, not linked from anywhere." },
  { area: "Unlinked", name: "Projects draft 2", path: "/pages/projectsv2", access: "Everyone", description: "A stale draft, not linked from anywhere." },
];

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
