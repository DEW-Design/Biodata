"use client";

// The shell for /proto/post-6-oct: a Linear-style layout drawn from the Figma frame "Frame 2" (HI-FI Dashboard Explorations, node
// 435:62), then refined. The layout is LOCKED at step 1 of the subtraction we explored (designer, 13 Oct 2026: "we can't
// fundamentally violate the design system by changing how a component looks, so let's go as far as subtraction step 1, lock that layout,
// and refine from there"). Nothing here hides or restyles a design system component: each is used as it is. What it is:
//   - no full-width header: the account, search and Add controls sit at the top of the left rail; the bell is at the right of the
//     tab strip (a Vercel-style popover, notifications-popover.tsx);
//   - open pages are tabs in a strip above the content; everything happens in one tab unless another is opened ("+" opens Home,
//     the search button opens a Search tab, Cmd or Ctrl click opens a link in a new tab);
//   - the page is an inset panel with one 40px bar (the breadcrumb, a favourite star, the records tree for a project, the "..."
//     actions), then the content: the real lists without their shells, and the production project page (its tabs, sections and cards);
//   - there is no column 2: a page's views (a project's Project, Project records, Species, Artefacts and attachments; a list's All and My, a section's
//     areas) are tabs at the top of the page, one click each (the DEW tab list, panel-controls.tsx);
//   - the rail is quiet and nested: three groups (Workspace, Work, Admin, which starts folded) under small headings, no divider
//     lines, the legal links in the account menu; Notion's pattern, a row's icon turns into a chevron when pointed at and opens the
//     row's children, which are one level above the records (All projects and My projects, never the projects), nested-rail.tsx;
//   - the lab opens as the Super Admin (the largest scope), to be worked down to the smaller roles with the Prototype tools bar.
// Steps 2 to 5 of the subtraction (the tab strip hidden, list headers hidden, grouped rows, a Linear-style project page) are removed:
// they hid or restyled components, or replaced them. context/decisions/2026-10-12-07-* keeps the record of what they were.
//
// Re-fitted from the lo-fi (CONTRACTS 2.5: it fixes content and flow, not styling): real tokens and Barlow, the real nav tree for the
// role, the real Add menu, real projects. Where the lo-fi is unlabelled this lab made a reading, named here so it can be corrected:
//   - the database pill with a caret was a view menu; it is now the page's view tabs (13 Oct 2026);
//   - the branch icon opens the project's records tree (branch-drawer.tsx);
//   - the round control beside the logo is Help, which has no page yet (inert);
//   - the "Alert" card is not built (the designer, 12 Oct 2026: it is for public users, later); the bell lists what needs the role's
//     attention;
//   - "Contents" is the project page's own "On this page", level with the title.
// The Prototype tools bar is mounted by page.tsx as on every lab. The person's name is the placeholder Olivia Wyatt (0.3),
// not the name in the Figma frame.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file. Desktop only; there is no mobile layout yet.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable, RouterProvider } from "react-aria-components";
import {
  BarChart01,
  Bell01,
  ChevronDown,
  ChevronRight,
  Database01,
  Download01,
  DotsHorizontal,
  Feather,
  FileCheck02,
  FileLock01,
  Folder,
  GitBranch01,
  HelpCircle,
  Plus,
  SearchLg,
  Star01,
  Upload01,
  UserPlus01,
  XClose,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Popover } from "@/components/base/select/popover";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { toast } from "@/components/application/toast/toast";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { ChooseProjectModal } from "@/app/pages/_shared/dataset-upload/choose-project-modal";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { ProjectIngestionChip } from "@/app/pages/_shared/dataset-upload/project-ingestion";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { useAllProjects } from "@/app/pages/_shared/created-projects-store";
import type { Project } from "@/app/pages/_shared/project-list-data";
import { ADELAIDE_HILLS_ID } from "@/app/pages/project-detail/project-seed";
import { createMenuItemsForRole, type CreateItemId } from "@/lib/create-menu";
import { assetPath } from "@/lib/base-path";
import {
  CTRL_VOCAB_SECTION_LABEL,
  DLA_SECTION_LABEL,
  DSA_SECTION_LABEL,
  NOMINATION_SECTION_LABEL,
  NOTIFICATION_SECTION_LABEL,
  REPORTS_SECTION_LABEL,
  TAXONOMY_SECTION_LABEL,
  TEMPLATE_FINDER_SECTION_LABEL,
  USER_MANAGEMENT_SECTION_LABEL,
  VOUCHER_SECTION_LABEL,
  keyHref,
  navForRole,
  registeredUserAccountMenu,
  type NavNode,
} from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";
import { BASE_PATH } from "@/lib/base-path";
import { useAttention, type AttentionTask } from "./attention";
import { NotificationsBell, useInboxState } from "./notifications-popover";
import { plain, roundBtn, type Icon } from "./panel-controls";
import { projectPage, searchPage, sectionPage, pageKey, type LabTab, type Page } from "./pages";
import { RailItem, type RailContext } from "./nested-rail";
import { ProjectWorkspace, seedFor, type ProjectView } from "./project-workspace";
import { SearchPage } from "./search-page";
import { SECTION_LABELS, SectionActions, SectionContent, sectionIcon, type SectionKey } from "./sections";


// ── The rail ──

// The rail (the layout locked at step 1 of the subtraction, designer, 13 Oct 2026): three groups under small headings instead of divider
// lines, the admin group folded away, and the legal links in the account menu rather than the rail.
const QUIET_GROUPS: { name: string; labels: string[] }[] = [
  { name: "Workspace", labels: ["Home", "Projects", "Explore"] },
  { name: "Work", labels: [DLA_SECTION_LABEL, DSA_SECTION_LABEL, NOMINATION_SECTION_LABEL, TEMPLATE_FINDER_SECTION_LABEL, REPORTS_SECTION_LABEL] },
  { name: "Admin", labels: [USER_MANAGEMENT_SECTION_LABEL, TAXONOMY_SECTION_LABEL, NOTIFICATION_SECTION_LABEL, CTRL_VOCAB_SECTION_LABEL, VOUCHER_SECTION_LABEL] },
];

function NavRail({
  activeKey,
  onOpen,
  page,
  activeView,
  go,
  openTab,
  nested,
}: {
  activeKey: SectionKey | null;
  onOpen: (key: SectionKey) => void;
  page: Page;
  activeView?: string;
  go: (page: Page, view?: string) => void;
  openTab: (page: Page, view?: string) => void;
  nested: boolean;
}) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const [folded, setFolded] = useState<string[]>(["Admin"]);
  // Which rows are open (nested rail): only what the person opened.
  const [expanded, setExpanded] = useState<string[]>([]);
  const ctx: RailContext = { page, activeView, expanded, toggle: (id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id])), go, openTab, nested };

  const item = (node: NavNode) => <RailItem key={node.label} node={node} ctx={ctx} flat={flatItem(node)} />;
  const flatItem = (node: NavNode) => {
    const Icon = sectionIcons[node.label];
    const active = !!node.key && node.key === activeKey;
    return (
      <Link
        key={node.label}
        href={node.key ? roleHref(keyHref(node.key)) : "#"}
        aria-current={active ? "page" : undefined}
        title={plain(node.label)}
        onClick={(e) => {
          e.preventDefault();
          if (node.key) onOpen(node.key);
        }}
        className={cx(
          "flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm font-medium outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
          active ? "bg-tertiary text-primary" : "text-secondary hover:bg-tertiary hover:text-primary",
        )}
      >
        {Icon && <Icon className={cx("size-5 shrink-0", active ? "text-primary" : "text-quaternary")} />}
        <span className="truncate">{plain(node.label)}</span>
      </Link>
    );
  };

  const quietGroups = QUIET_GROUPS.map((g) => ({ name: g.name, nodes: nav.filter((n) => g.labels.includes(n.label)) })).filter((g) => g.nodes.length > 0);
  return (
    <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-3">
      {quietGroups.map((g) => {
        // A group folds only under a heading, and never while the page in use is in it.
        const open = quietGroups.length < 2 || !folded.includes(g.name) || g.nodes.some((n) => n.key === activeKey);
        return (
          <div key={g.name} className="flex flex-col gap-0.5">
            {quietGroups.length > 1 && (
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setFolded((f) => (f.includes(g.name) ? f.filter((x) => x !== g.name) : [...f, g.name]))}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-medium text-quaternary outline-focus-ring hover:text-primary focus-visible:outline-2"
              >
                {g.name}
                <ChevronDown className={cx("size-3 transition-transform duration-100 ease-out", !open && "-rotate-90")} aria-hidden />
              </button>
            )}
            {open && g.nodes.map(item)}
          </div>
        );
      })}
    </nav>
  );
}

const LEGAL_LINKS = ["Privacy Policy", "Terms and Conditions"];

/** Terms, Privacy and Help have no pages in the preview, so each says so on hover, as the rail's legal icons do. */
function Inert({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <Tooltip title={label} description="Not available in this preview yet." placement="top">
      <Focusable>
        <span role="button" aria-disabled="true" aria-label={label} className={cx("cursor-default outline-focus-ring focus-visible:outline-2", className)}>
          {children}
        </span>
      </Focusable>
    </Tooltip>
  );
}

function RailFoot() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")} alt="Government of South Australia, Department for Environment and Water" className="h-[37px] w-auto" />
        <Inert label="Help and Documentation" className="grid size-8 place-items-center rounded-full border border-secondary text-quaternary hover:bg-tertiary hover:text-primary">
          <HelpCircle className="size-5" />
        </Inert>
      </div>
    </div>
  );
}

// ── The account row: who you are, search, Add ──

const ghostBtn =
  "grid size-8 shrink-0 place-items-center rounded-full text-tertiary outline-focus-ring transition duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:outline-2";

// The Add menu's icons, as in create-menu.tsx (one icon per concept).
const CREATE_ICONS: Record<CreateItemId, Icon> = {
  project: Folder,
  dataset: Upload01,
  dla: FileLock01,
  nomination: Feather,
  dsa: FileCheck02,
  user: UserPlus01,
  "ctrl-vocab": Database01,
  notification: Bell01,
};

function AddMenu({ currentProjectId }: { currentProjectId: string }) {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const [chooseProject, setChooseProject] = useState(false);
  if (role === "public-user") return null;
  const items = createMenuItemsForRole(role);
  return (
    <>
      <Dropdown.Root>
        <AriaButton aria-label="Add" className={cx(ghostBtn, "bg-tertiary")}>
          <Plus className="size-4" />
        </AriaButton>
        <Dropdown.Popover placement="bottom left">
          <Dropdown.Menu
            aria-label="Add"
            onAction={(key) => {
              const item = items.find((i) => i.id === key);
              if (!item) return;
              if (item.id === "dataset") setChooseProject(true);
              else if (item.href) router.push(roleHref(item.href));
            }}
          >
            {items.map((item) => (
              <Dropdown.Item key={item.id} id={item.id} icon={CREATE_ICONS[item.id]} label={plain(item.label)} />
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      <ChooseProjectModal key={currentProjectId} isOpen={chooseProject} onOpenChange={setChooseProject} defaultProjectId={currentProjectId} />
    </>
  );
}

function AccountRow({ currentProjectId, onSearch }: { currentProjectId: string; onSearch: () => void }) {
  const role = useUserRole();
  return (
    <div className="flex items-center gap-1 px-4">
      {role === "public-user" ? (
        <div className="min-w-0 flex-1">
          <GuestAuthActions />
        </div>
      ) : (
        <DialogTrigger>
          <AriaButton className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 text-left outline-focus-ring hover:bg-tertiary focus-visible:outline-2">
            <Avatar size="xs" initials="OW" alt="Olivia Wyatt" />
            <span className="truncate text-sm text-primary">Olivia Wyatt</span>
            <ChevronDown className="size-3.5 shrink-0 text-quaternary" aria-hidden />
          </AriaButton>
          <Popover size="sm" className="w-48 p-1">
            <Dialog aria-label="Account" className="outline-hidden">
              <p className="m-0 px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
              {registeredUserAccountMenu.map((item) => (
                <p key={item} className="m-0 cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
                  {item}
                </p>
              ))}
              {/* The legal links are here, not in the rail. */}
              {LEGAL_LINKS.map((item) => (
                <p key={item} className="m-0 cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
                  {item}
                </p>
              ))}
            </Dialog>
          </Popover>
        </DialogTrigger>
      )}
      {/* Search is a page of its own, opened as a tab (search-page.tsx), not a popover. */}
      <AriaButton aria-label="Search" onPress={onSearch} className={ghostBtn}>
        <SearchLg className="size-4" />
      </AriaButton>
      <AddMenu currentProjectId={currentProjectId} />
    </div>
  );
}

// ── The tab strip: open projects, and the bell ──

function TabStrip({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  bell,
}: {
  tabs: { id: string; label: string; icon: Icon; short?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  bell: React.ReactNode;
}) {
  const strip = useRef<HTMLDivElement>(null);
  // Past six tabs the labels no longer fit: the ones not in use shrink to their icon (the name is the tooltip and the label
  // for a screen reader), so a role with many sections open still sees every tab.
  const compact = tabs.length > 6;
  const move = (from: number, delta: number) => {
    const next = tabs[(from + delta + tabs.length) % tabs.length];
    onSelect(next.id);
    requestAnimationFrame(() => strip.current?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus());
  };
  return (
    <div className="flex min-w-0 items-center gap-1 pr-4 pl-2">
      <div ref={strip} role="tablist" aria-label="Open pages" className="flex min-w-0 items-center gap-1">
        {tabs.map((tab, i) => {
          const active = tab.id === activeId;
          const TabIcon = tab.icon;
          const iconOnly = compact && !active;
          // A tab hugs its label. The tab in use shows its close button as its right edge; another tab shows it over its right padding
          // only when pointed at, so no tab reserves space it is not using. With one tab there is nothing to close.
          const closable = tabs.length > 1 && !iconOnly;
          const closeInFlow = closable && active;
          return (
            <div
              key={tab.id}
              title={iconOnly ? tab.label : undefined}
              className={cx(
                "group relative flex h-8 min-w-0 items-center rounded-lg border",
                iconOnly ? "shrink-0" : "max-w-64",
                active ? "border-secondary bg-tertiary text-primary" : "border-transparent text-tertiary hover:bg-tertiary hover:text-primary",
              )}
            >
              <button
                type="button"
                role="tab"
                data-tab={tab.id}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onSelect(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") move(i, 1);
                  else if (e.key === "ArrowLeft") move(i, -1);
                }}
                className={cx("flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left text-sm outline-focus-ring focus-visible:outline-2", iconOnly ? "px-2.5" : cx("pl-2.5", closeInFlow ? "pr-1" : "pr-3"))}
              >
                {/* A project has no icon of its own (every one is a folder), so its collapsed tab shows its code. */}
                {iconOnly && tab.short ? <span aria-hidden className="text-xs font-medium text-quaternary tabular-nums">{tab.short}</span> : <TabIcon className={cx("size-4 shrink-0", active ? "text-primary" : "text-quaternary")} />}
                <span className={cx("truncate", iconOnly && "sr-only")}>{tab.label}</span>
              </button>
              {closable && (
                <button
                  type="button"
                  aria-label={`Close ${tab.label}`}
                  onClick={() => onClose(tab.id)}
                  className={cx(
                    "grid size-5 shrink-0 place-items-center rounded text-quaternary outline-focus-ring hover:bg-secondary hover:text-primary focus-visible:outline-2",
                    closeInFlow ? "mr-1.5" : "absolute top-1/2 right-1.5 -translate-y-1/2 bg-tertiary opacity-0 shadow-[-10px_0_8px_var(--ui-bg-tertiary)] focus-visible:opacity-100 group-hover:opacity-100",
                  )}
                >
                  <XClose className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {/* A new tab opens Home. */}
      <AriaButton aria-label="New tab" onPress={onNew} className={cx(ghostBtn, "size-7")}>
        <Plus className="size-4" />
      </AriaButton>
      <div className="ml-auto pl-4">
        {bell}
      </div>
    </div>
  );
}

// ── The panel's bar: where you are, and what you can do here ──

const GATES = {
  upload: { icon: Upload01, title: "Sign up to upload a dataset", description: "Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record." },
  export: { icon: Download01, title: "Sign up to export data", description: "Exporting records needs a free BioData SA account. Create one to download project and record data." },
  report: { icon: BarChart01, title: "Sign up to create reports", description: "Reports need a free BioData SA account. Create one to build and save reports on project data." },
};

/** The project's actions, from project-card-actions.tsx: the same three, in the bar instead of the hero. */
function ProjectActions({ project }: { project: Project }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<keyof typeof GATES | null>(null);
  const run = (key: keyof typeof GATES) => {
    if (isGuest) return setGate(key);
    if (key === "upload") router.push(roleHref(`/pages/project-list/${project.id}/upload`));
    else if (key === "export")
      downloadCsv(`${project.code}.csv`, ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"], [[project.code, project.name, project.org, project.status, project.contributorName, project.updated]]);
    else toast.brand("Reports aren't wired up yet", { description: "Reports can't be generated in this preview yet." });
  };
  const g = gate ? GATES[gate] : null;
  // The production page's actions, in its order (project-card-actions.tsx): the ingestion chip (signed-in roles), Upload dataset as a
  // button, then the "..." menu with Export CSV and Create report.
  return (
    <>
      {!isGuest && <ProjectIngestionChip projectId={project.id} />}
      {/* Upload dataset is a round icon button like the records tree and the "..." beside it (designer, 13 Oct 2026); its name is its tooltip and label. */}
      <Tooltip title="Upload dataset" placement="bottom">
        <TooltipTrigger aria-label="Upload dataset" onPress={() => run("upload")} className={roundBtn}>
          <Upload01 className="size-4" />
        </TooltipTrigger>
      </Tooltip>
      <Dropdown.Root>
        <Tooltip title="More project actions" placement="bottom">
          <AriaButton aria-label="More project actions" className={roundBtn}>
            <DotsHorizontal className="size-4" />
          </AriaButton>
        </Tooltip>
        <Dropdown.Popover placement="bottom right">
          <Dropdown.Menu aria-label="More project actions" onAction={(key) => run(key as keyof typeof GATES)}>
            <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
            <Dropdown.Item id="report" label="Create report" icon={BarChart01} />
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      {g && <SignUpPromptModal isOpen onOpenChange={(open) => !open && setGate(null)} icon={g.icon} title={g.title} description={g.description} />}
    </>
  );
}

// The project's views (Project, Project records, Species, Artefacts and attachments) are tabs on the page itself (project-workspace.tsx), not
// a control in this bar: only the records tree and the actions are here.
function ProjectBarControls({ project, branchOpen, onToggleBranch }: { project: Project; branchOpen: boolean; onToggleBranch: () => void }) {
  return (
    <>
      {/* The branch: the project's records as a tree (Site, Visit, Transect ...), opened beside the page and closed again. */}
      <Tooltip title="Records tree" placement="bottom">
        <AriaButton aria-label="Records tree" aria-pressed={branchOpen} onPress={onToggleBranch} className={cx(roundBtn, branchOpen && "bg-tertiary text-primary")}>
          <GitBranch01 className="size-4" />
        </AriaButton>
      </Tooltip>
      <ProjectActions project={project} />
    </>
  );
}

function Crumb({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <AriaButton onPress={onPress} className="rounded-sm text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2">
      {children}
    </AriaButton>
  );
}

function PanelBar({ crumbs, controls }: { crumbs: React.ReactNode; controls: React.ReactNode }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-secondary bg-tertiary pr-3 pl-3.5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        {crumbs}
      </nav>
      <div className="flex shrink-0 items-center gap-2">{controls}</div>
    </div>
  );
}

// ── The shell ──

const SECTION_KEYS = Object.keys(SECTION_LABELS) as SectionKey[];

/** A path the lab holds as a page: a section's list, or a project's own page with nothing after it. Anything else is a page it does not hold. */
function pageForPath(path: string): Page | null {
  const url = new URL(path, "http://lab.local");
  const pathname = url.pathname.replace(`${BASE_PATH}`, "").replace(/\/$/, "");
  const extra = [...url.searchParams.keys()].filter((k) => k !== "userRole" && k !== "scope" && k !== "status");
  if (extra.length > 0) return null;
  const project = pathname.match(/^\/pages\/project-list\/([^/]+)\/project-details$/)?.[1] ?? (pathname === "/pages/project-detail" ? ADELAIDE_HILLS_ID : undefined);
  if (project) return seedFor(project, "registered-user") ? projectPage(project) : null;
  const section = SECTION_KEYS.find((k) => pathname === keyHref(k));
  return section ? sectionPage(section, url.searchParams.get("status")?.split(",").filter(Boolean)) : null;
}

export function PostSixOctShell({ nestedRail }: { nestedRail: boolean }) {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const all = useAllProjects();
  // The lab opens on Home. Everything then happens in this one tab (a rail click, a link, a row, a result replaces its page) unless
  // another tab is opened: the "+" opens Home, the search button opens Search, and a Cmd or Ctrl click on a link opens it in a new tab.
  const nextId = useRef(2);
  const [tabs, setTabs] = useState<LabTab[]>([{ id: "t1", page: sectionPage("dashboard") }]);
  const [activeId, setActiveId] = useState("t1");
  const [views, setViews] = useState<Record<string, string>>({});
  const [favourites, setFavourites] = useState<string[]>([]);
  // The tab whose project has its records tree (the branch) open.
  const [branchFor, setBranchFor] = useState<string | null>(null);
  const attention = useAttention();
  const inbox = useInboxState(attention);

  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const labelled = tabs.map((t): { tab: LabTab; label: string; icon: Icon; short?: string } => {
    const page = t.page;
    if (page.kind === "section") return { tab: t, label: plain(SECTION_LABELS[page.section]), icon: sectionIcon(SECTION_LABELS[page.section]) ?? Folder };
    if (page.kind === "search") return { tab: t, label: "Search", icon: SearchLg };
    const p = byId.get(page.projectId);
    return { tab: t, label: p ? `[${p.code}] ${p.name}` : "Project", icon: Folder, short: p?.code };
  });
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // A view (the pill's choice) set along with the page: the rail's children open a section or a project straight at one.
  const go = (page: Page, view?: string) => {
    setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, page } : t)));
    if (view) setViews((v) => ({ ...v, [`${active.id}:${pageKey(page)}`]: view }));
    setBranchFor(null);
  };
  const openTab = (page: Page = sectionPage("dashboard"), beside = false, view?: string) => {
    const id = `t${nextId.current++}`;
    if (view) setViews((v) => ({ ...v, [`${id}:${pageKey(page)}`]: view }));
    setTabs((ts) => {
      const at = beside ? ts.findIndex((t) => t.id === active.id) + 1 : ts.length;
      return [...ts.slice(0, at), { id, page }, ...ts.slice(at)];
    });
    setActiveId(id);
    setBranchFor(null);
  };
  const openSearch = () => {
    const existing = tabs.find((t) => t.page.kind === "search");
    if (existing) setActiveId(existing.id);
    else openTab(searchPage);
  };
  const close = (id: string) => {
    const i = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (id === activeId && next.length) setActiveId(next[Math.min(i, next.length - 1)].id);
  };
  const runTask = (task: AttentionTask) => {
    if (task.open) go(sectionPage(task.open.section, task.open.statuses));
    else if (task.href) {
      const held = pageForPath(task.href);
      if (held) go(held);
      else router.push(roleHref(task.href));
    }
  };
  // Links inside the panel (a table row, a Button with an href) move this tab to the page when the lab holds it.
  const navigate = (path: string) => {
    const held = pageForPath(path);
    if (held) go(held);
    else router.push(path);
  };
  // The same for a plain link (a next/link anchor) inside the panel; with Cmd or Ctrl held it opens a new tab instead.
  const holdLinks = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest("a[href]");
    if (!anchor || anchor.getAttribute("target") === "_blank") return;
    const held = pageForPath(anchor.getAttribute("href") ?? "");
    if (!held) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) openTab(held, true);
    else go(held);
  };

  if (!active) return null;
  const page = active.page;
  const activeKey: SectionKey | null = page.kind === "section" ? page.section : page.kind === "project" ? "project-list" : null;
  const project = page.kind === "project" ? byId.get(page.projectId) : undefined;
  const viewKey = `${active.id}:${pageKey(page)}`;
  const view = views[viewKey];
  const setView = (v: string) => setViews((s) => ({ ...s, [viewKey]: v }));
  const currentProjectId = project?.id ?? ADELAIDE_HILLS_ID;
  const branchOpen = !!project && branchFor === active.id;

  return (
    <RouterProvider navigate={navigate} useHref={(href) => (href.startsWith("/") ? `${BASE_PATH}${href}` : href)}>
      <div className="font-barlow grid h-screen grid-cols-[270px_minmax(0,1fr)] grid-rows-[56px_minmax(0,1fr)] overflow-hidden bg-primary text-primary">
        <AccountRow currentProjectId={currentProjectId} onSearch={openSearch} />
        <TabStrip
          tabs={labelled.map((l) => ({ id: l.tab.id, label: l.label, icon: l.icon, short: l.short }))}
          activeId={active.id}
          onSelect={(id) => {
            setActiveId(id);
            setBranchFor(null);
          }}
          onClose={close}
          onNew={() => openTab()}
          bell={<NotificationsBell state={inbox} onRun={runTask} buttonClass={ghostBtn} />}
        />
        <div className="col-start-1 row-start-2 flex min-h-0 flex-col px-4 pb-4">
          <NavRail
            activeKey={activeKey}
            onOpen={(key) => go(sectionPage(key))}
            page={page}
            activeView={view}
            go={go}
            openTab={(p, v) => openTab(p, true, v)}
            nested={nestedRail}
          />
          <RailFoot />
        </div>
        <section onClickCapture={holdLinks} aria-label={labelled.find((l) => l.tab === active)?.label} className="relative col-start-2 row-start-2 mr-4 mb-4 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-secondary bg-secondary">
          {project ? (
            <>
              <PanelBar
                crumbs={
                  <>
                    <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
                    <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                    <ProjectCrumb project={project} onOpen={(id) => go(projectPage(id))} onViewAll={() => go(sectionPage("project-list"))} />
                    <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                    <span className="truncate font-medium text-primary">{project.name}</span>
                    <AriaButton
                      aria-label={favourites.includes(project.id) ? "Remove from favourites" : "Add to favourites"}
                      aria-pressed={favourites.includes(project.id)}
                      onPress={() => setFavourites((f) => (f.includes(project.id) ? f.filter((x) => x !== project.id) : [...f, project.id]))}
                      className="grid size-5 shrink-0 place-items-center rounded text-quaternary outline-focus-ring hover:text-primary focus-visible:outline-2"
                    >
                      <Star01 className={cx("size-3.5", favourites.includes(project.id) && "fill-current text-primary")} />
                    </AriaButton>
                  </>
                }
                controls={
                  <ProjectBarControls project={project} branchOpen={branchOpen} onToggleBranch={() => setBranchFor(branchOpen ? null : active.id)} />
                }
              />
              {/* A <main> because the project page's "On this page" follows the scroll of the nearest <main>. */}
              {/* The top padding is a wrapper's, not <main>'s: "On this page" is sticky, and a sticky offset is measured from the
                  padding edge, so padding on <main> would sit it 16px lower than the title it should line up with. */}
              <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [scrollbar-gutter:stable]">
                <div className="pt-5">
                  <ProjectWorkspace
                    key={`${active.id}:${project.id}`}
                    projectId={project.id}
                    view={(view as ProjectView) ?? "project"}
                    setView={setView}
                    branchOpen={branchOpen}
                    onBranchClose={() => setBranchFor(null)}
                  />
                </div>
              </main>
            </>
          ) : page.kind === "search" ? (
            <>
              <PanelBar
                crumbs={
                  <>
                    <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
                    <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                    <span className="truncate font-medium text-primary">Search</span>
                  </>
                }
                controls={null}
              />
              <main className="min-h-0 flex-1 overflow-y-auto px-6 pt-8 pb-6 [scrollbar-gutter:stable]">
                <SearchPage onNavigate={navigate} />
              </main>
            </>
          ) : page.kind === "section" ? (
            <>
              <PanelBar
                crumbs={
                  <>
                    {/* Home is the top of the trail: it is not "Home, Home". */}
                    {page.section !== "dashboard" && (
                      <>
                        <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
                        <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                      </>
                    )}
                    <span className="truncate font-medium text-primary">{plain(SECTION_LABELS[page.section])}</span>
                  </>
                }
                controls={
                  <>
                    <SectionActions key={`${viewKey}:actions`} section={page.section} />
                  </>
                }
              />
              {/* A list fits the panel and scrolls its own rows (CONTRACTS 4.2), so <main> does not scroll. */}
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <SectionContent key={`${viewKey}:${role}:${page.statuses?.join(",") ?? ""}`} section={page.section} view={view} statuses={page.statuses} onViewChange={setView} />
              </main>
            </>
          ) : null}
        </section>
      </div>
    </RouterProvider>
  );
}

/** The "Projects" crumb of a project's bar: the switcher over the other projects, opening one as a tab. */
function ProjectCrumb({ project, onOpen, onViewAll }: { project: Project; onOpen: (id: string) => void; onViewAll: () => void }) {
  const all = useAllProjects();
  const items = useMemo(() => all.filter((p) => seedFor(p.id, "registered-user")).sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ id: p.id, label: p.name, addon: p.code })), [all]);
  return (
    <BreadcrumbSwitcher
      label="Projects"
      ariaLabel="Switch project"
      placeholder="Search projects"
      items={items}
      currentId={project.id}
      onSelect={onOpen}
      viewAllLabel="View all projects"
      onViewAll={onViewAll}
    />
  );
}
