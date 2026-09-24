"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable } from "react-aria-components";
import { Bell01, ChevronDown, Upload01, Plus, SearchMd } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Input } from "@/components/base/input/input";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { Badge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, registeredUserFooterLinks, type NavNode } from "@/lib/registered-user-nav";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { cx } from "@/utils/cx";

// Option 2 of 2: the projects list on the top-nav shell (header + primary nav bar), reusing
// app/pages/dashboard/option-2's header/nav chrome verbatim - see that file's comment for the
// full rationale. See app/pages/project-list for the same screen on the sidebar shell.
//
// NOTE: "option-1" in the comments below means the sidebar-shell Projects list that is now the canonical
// /pages/project-list route (its /option-1 suffix was dropped - see CONTEXT.md, Sept 2026 route
// normalisation). This option-2 folder is kept as a record of the explored top-nav direction.
// No Figma frame yet for a Projects list screen, so - same as option-1 and the dashboard body's
// metric/filter/map panels - this is built structurally: every contained widget (button, avatar,
// badge) is a real DEW component used exactly, the project rows are a structural shell composed
// from real tokens. The primary nav renders the real Registered User IA
// (lib/registered-user-nav.ts) - same NavTopItem/NavDropdownItem/ProfileMenu treatment as
// dashboard/option-2, "Projects" active since that's the section here.

// This screen's own page key, so its own entry in the dropdown (Projects > Manage Project and
// Datasets) can show a selected state - same fix as dashboard's "BioData Dashboard" link.
// Only these keys have an option-2 page; any other keyed nav node (e.g. `observations`, which only exists as the
// canonical sidebar-shell page) renders as a plain label instead of a dead /option-2 link.
const OPTION_2_KEYS: ReadonlySet<string> = new Set(["dashboard", "project-list"]);
const CURRENT_KEY = "project-list";

function NavDropdownItem({ node, depth = 0 }: { node: NavNode; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.items?.length;
  // roleHref, not a bare path - a plain `/pages/...` string drops the active role, silently
  // falling back to `registered-user` on the destination page. See lib/use-role-href.ts.
  const roleHref = useRoleHref();
  const href = node.key && OPTION_2_KEYS.has(node.key) ? roleHref(`/pages/${node.key}/option-2`) : undefined;
  const isCurrent = !!node.key && node.key === CURRENT_KEY;
  const indent = { paddingLeft: 12 + depth * 12 };

  if (!hasChildren) {
    return href ? (
      <Link
        href={href}
        style={indent}
        aria-current={isCurrent ? "page" : undefined}
        className={cx(
          "block rounded-md py-1.5 pr-3 text-sm",
          isCurrent ? "bg-secondary font-medium text-primary" : "text-primary hover:bg-secondary",
        )}
      >
        {node.label}
      </Link>
    ) : (
      <p style={indent} className="py-1.5 pr-3 text-sm text-tertiary">
        {node.label}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={indent}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-3 text-left text-sm font-medium text-primary hover:bg-secondary"
      >
        {node.label}
        <ChevronDown className={cx("size-3.5 shrink-0 text-quaternary transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="flex flex-col">
          {node.items!.map((child) => (
            <NavDropdownItem key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavTopItem({ node, active = false }: { node: NavNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.items?.length;
  const roleHref = useRoleHref();
  const href = node.key && OPTION_2_KEYS.has(node.key) ? roleHref(`/pages/${node.key}/option-2`) : undefined;
  const labelClassName = cx("relative flex items-center gap-1 px-4 text-sm", active ? "font-medium text-brand-700" : "text-primary");

  if (!hasChildren) {
    const content = (
      <span className={labelClassName}>
        {node.label}
        {active && <span className="absolute inset-x-4 bottom-0 h-0.5 bg-brand-700" />}
      </span>
    );
    return href ? (
      <Link href={href} className="flex items-stretch">
        {content}
      </Link>
    ) : (
      <div className="flex items-stretch">{content}</div>
    );
  }

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className={cx(labelClassName, "outline-hidden")}>
        {node.label}
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
        {active && <span className="absolute inset-x-4 bottom-0 h-0.5 bg-brand-700" />}
      </AriaButton>
      <Popover size="sm" className="w-72 p-2">
        <Dialog className="outline-hidden">
          {node.items!.map((child) => (
            <NavDropdownItem key={child.label} node={child} />
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-2 rounded-[10px] bg-secondary py-1 pr-3 pl-1 outline-hidden">
        <Avatar size="xs" initials="OW" alt="Maya Dewitt" />
        <span className="text-sm text-primary">Dewitt, Maya</span>
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
      </AriaButton>
      <Popover size="sm" className="w-48 p-1">
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// public-user's header replacement for ProfileMenu - see dashboard/option-2's copy of this exact
// component for the full rationale (no account to show, no real auth flow built yet). Ported from
// option-1's project-list page, same local per-file component there too, not a shared file.
function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="secondary" isDisabled>Log in</Button>
          </span>
        </Focusable>
      </Tooltip>
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="primary" isDisabled>Sign up</Button>
          </span>
        </Focusable>
      </Tooltip>
    </div>
  );
}

// Same 4 example projects as the shared app/pages/_shared/project-list-content.tsx (option-1's
// table) - one real dataset, not a fresh invented list per shell. Deliberately no `href` on any
// row: the shared version links "Adelaide Hills Bushland Survey" to
// /pages/project-detail, a real page - but that page only exists on the sidebar shell.
// Copying that href verbatim would send option-2 users into option-1's chrome mid-browse, a
// jarring shell-switch a plain nav bug, not a feature - flagged directly by the user off exactly
// that. No project-detail/option-2 exists yet, so this table stays honest and unlinked, same
// "only wire what has a real page" convention used everywhere else, until that page is built.
interface Project {
  id: string;
  name: string;
  org: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  contributorInitials: string;
  contributorName: string;
  updated: string;
  description: string;
}

const projects: Project[] = [
  {
    id: "adelaide-hills",
    name: "Adelaide Hills Bushland Survey",
    org: "Adelaide Hills Landcare",
    status: "Active",
    statusColor: "success",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "2 days ago",
    description: "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network.",
  },
  {
    id: "coorong",
    name: "Coorong Wetlands Bird Count",
    org: "Birds SA",
    status: "Under review",
    statusColor: "warning",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "5 days ago",
    description: "Seasonal waterbird survey data pending verification.",
  },
  {
    id: "flinders",
    name: "Flinders Ranges Reptile Atlas",
    org: "DEW Biodiversity Team",
    status: "Draft",
    statusColor: "gray",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "1 week ago",
    description: "Draft submission, not yet published.",
  },
  {
    id: "kangaroo-island",
    name: "Kangaroo Island Recovery Monitoring",
    org: "Natural Resources KI",
    status: "Completed",
    statusColor: "blue",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "3 weeks ago",
    description: "Post-bushfire recovery tracking, final report submitted.",
  },
];

// Filters the same real `projects` array the table renders - no separate search index, no
// invented match data. Matches on name, organisation, or contributor, same three fields
// option-1's header search (GlobalProjectSearch) matches on for its own project list, so the two
// shells filter by the same criteria even though this one lives inline above the table instead of
// in the header. Cross-checked against Mobbin project-table references (Juicebox, Linear) - a
// search/filter control directly above the table is the norm; this one was missing.
function filterProjects(projects: Project[], query: string): Project[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return projects;
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(normalized) ||
      project.org.toLowerCase().includes(normalized) ||
      project.contributorName.toLowerCase().includes(normalized),
  );
}

// Wrapped in Suspense - useRoleHref/useUserRole read the active role via useSearchParams, which
// opts a page out of static rendering unless something above it suspends. Same requirement
// dashboard/option-2 already has (see that file's own Suspense wrapper) - this page needed it too
// now that its nav links and header go through roleHref.
export default function ProjectListOption2Page() {
  return (
    <Suspense fallback={null}>
      <ProjectListOption2 />
    </Suspense>
  );
}

function ProjectListOption2() {
  const [query, setQuery] = useState("");
  const filteredProjects = filterProjects(projects, query);
  // public-user reads a different, smaller nav tree - see dashboard/option-2's copy of this same
  // branch for the full rationale.
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;

  return (
    <div className="font-barlow flex min-h-screen flex-col">
      <RoleSwitcher />
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary pr-9 pl-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/dashboard/gov-sa-dew-lockup.png"
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <Button color="secondary" iconLeading={Bell01} />
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold text-white">
              3
            </span>
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      {/* ── Primary nav (nav chrome - not pixel-matched) ── */}
      <nav className="flex h-11 shrink-0 items-stretch border-b border-secondary bg-primary px-6" aria-label="Primary">
        {nav.map((section) => (
          <NavTopItem key={section.label} node={section} active={section.label === "Projects"} />
        ))}
      </nav>

      {/* ── Page header ── */}
      <SectionHeader.Root className="bg-secondary px-9 pt-8">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <SectionHeader.Heading>Projects</SectionHeader.Heading>
            <SectionHeader.Subheading>Everything you&apos;re contributing to, in one place</SectionHeader.Subheading>
          </div>
          {/* Creating requires an account - hidden for public-user rather than a disabled "coming
              soon" state, since the real gap here isn't that these features are unbuilt, it's
              that a signed-out guest was never meant to see them at all. */}
          {!isPublicUser && (
            <SectionHeader.Actions>
              <Button color="secondary" iconLeading={Plus}>Add project</Button>
              <Button color="secondary" iconLeading={Upload01}>Upload dataset</Button>
            </SectionHeader.Actions>
          )}
        </SectionHeader.Group>
      </SectionHeader.Root>

      {/* ── Project table: the real design-system Table (components/base/table/table.tsx),
          brought over from option-1's project-list-content.tsx instead of the hand-rolled
          ProjectRow cards this replaces - flagged directly by the user. flex-1 fills remaining
          space so the footer sticks to the bottom of the viewport when content is short, same fix
          as dashboard/option-2. Wrapped in a shadow card (not option-1's bare table) to match this
          shell's own elevation convention for content sitting on the bg-secondary page background
          - see BentoCard/TaskItem elsewhere in option-2. Search sits directly above the table,
          filtering the same real project rows - no separate result set, so it can never show
          something the table itself doesn't have. ── */}
      <div className="flex flex-1 flex-col gap-4 bg-secondary px-9 pt-6 pb-8">
        <div className="w-full sm:w-80">
          <Input
            aria-label="Search projects"
            placeholder="Search by name, organisation, or contributor"
            icon={SearchMd}
            value={query}
            onChange={setQuery}
          />
        </div>

        <div className="overflow-hidden rounded-lg bg-primary shadow-sm ring-1 ring-black/5">
          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <Table aria-label="Projects">
                <TableHeader>
                  <Column isRowHeader>Project</Column>
                  <Column>Organisation</Column>
                  <Column>Status</Column>
                  <Column>Contributor</Column>
                  <Column>Updated</Column>
                </TableHeader>
                <TableBody items={filteredProjects}>
                  {(project) => (
                    <Row id={project.id} textValue={project.name}>
                      <Cell>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium text-primary">{project.name}</p>
                          <p className="max-w-md truncate text-xs text-tertiary">{project.description}</p>
                        </div>
                      </Cell>
                      <Cell>
                        <span className="text-sm text-secondary">{project.org}</span>
                      </Cell>
                      <Cell>
                        <Badge size="sm" color={project.statusColor}>{project.status}</Badge>
                      </Cell>
                      <Cell>
                        <div className="flex items-center gap-2">
                          <Avatar size="xs" initials={project.contributorInitials} alt={project.contributorName} />
                          <span className="text-sm text-secondary">{project.contributorName}</span>
                        </div>
                      </Cell>
                      <Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{project.updated}</span>
                      </Cell>
                    </Row>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="p-6 text-sm text-tertiary">No projects found for &quot;{query}&quot;.</p>
          )}
        </div>
      </div>

      {/* ── Footer (nav chrome - not pixel-matched) ── */}
      <footer className="flex flex-wrap items-center gap-6 border-t border-secondary bg-primary px-9 py-4 text-[10px] font-semibold tracking-wide text-quaternary uppercase">
        {registeredUserFooterLinks.map((link) => (
          <p key={link}>{link}</p>
        ))}
      </footer>
    </div>
  );
}
