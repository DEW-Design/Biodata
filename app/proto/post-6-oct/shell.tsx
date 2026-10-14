"use client";

// The shell for /proto/post-6-oct: a Linear-style layout drawn from the Figma frame "Frame 2"
// (HI-FI Dashboard Explorations, node 435:62). The brief: the current layouts are top heavy, so something you want to look
// at is a scroll or a click away. Here nothing stacks above the content:
//   - the account, search and Add controls sit at the top of the left rail, not in a full-width header;
//   - open pages are tabs in a strip above the content, with the notification bell at its right;
//   - the page is an inset panel with one 40px bar (breadcrumb, favourite, view menu, actions), then the content itself;
//   - the rail's lower end holds the logo, Help and the legal links.
//
// Second pass (12 Oct 2026): the largest scope, the BioData Super Admin (13 rail sections, 8 Add items, review queues), then
// worked down to the smaller roles with the Prototype tools bar. The lab opens as the Super Admin when the address has no
// role. What that added:
//   - every rail section opens as a tab (a section's list, or a project), and a row that opens a project opens a tab too;
//   - there is no column 2, so a section's column 2 becomes the bar's view menu (scope, areas) and "..." menu (Export CSV),
//     described in sections.tsx;
//   - the bell holds what the role acts on: a reviewer's queues, a Registered User's tasks (attention.tsx). The rail card the lo-fi
//     draws under the sections is left out for now (designer, 12 Oct 2026: it is for public users, later).
//
// Fifth pass (12 Oct 2026): everything happens in one tab unless another is opened. A rail click, a link, a row, a task or a
// search result moves the current tab to that page; "+" opens a new tab on Home, the search button opens a Search tab (found
// again if it is open), and a Cmd or Ctrl click on a link opens a new tab. The breadcrumb is the way back. The branch button in a
// project's bar opens the project's records tree (branch-drawer.tsx). Search covers every page, project, species and record kind
// the role can open (search-page.tsx).
//
// Fourth pass (12 Oct 2026): the legal links end the nav and the foot of the rail is the logo and Help; the lab opens on Home
// (the real dashboard content) and the way in reads Home, then Projects, then a project, each step staying in the lab.
//
// Third pass (12 Oct 2026): the project page for a reader (project-overview.tsx, the default view; the page as it was is
// "Edit details"), and Search as a tab of its own with a full-page view (search-page.tsx) in place of the popover.
//
// Re-fitted from the lo-fi (CONTRACTS 2.5: it fixes content and flow, not styling): real tokens and Barlow, the real nav
// tree for the role in the groups the lo-fi draws (3, 3 and 1 for a Registered User), the real Add menu and search, real
// projects as the tabs. Where the lo-fi is unlabelled this lab made a reading, named here so it can be corrected:
//   - the database pill with a caret is the view menu (a project's views, a list's scope or areas);
//   - the branch icon is drawn but not defined: it is a disabled placeholder;
//   - the round control beside the logo is Help, which has no page yet (inert, as in the rail today);
//   - the "Alert" card is not built (see above); the bell lists what needs the role's attention;
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
  Edit05,
  Folder,
  GitBranch01,
  Grid01,
  HelpCircle,
  Paperclip,
  Plus,
  SearchLg,
  Star01,
  Upload01,
  UserPlus01,
  XClose,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Popover } from "@/components/base/select/popover";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { toast } from "@/components/application/toast/toast";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { ChooseProjectModal } from "@/app/pages/_shared/dataset-upload/choose-project-modal";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { legalIcons, sectionIcons } from "@/app/pages/_shared/nav-icons";
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
import { plain, roundBtn, ViewMenu, type Icon } from "./panel-controls";
import { ProjectWorkspace, seedFor, type ProjectView } from "./project-workspace";
import { SearchPage } from "./search-page";
import { SECTION_LABELS, SectionActions, SectionContent, SectionViewMenu, sectionIcon, type SectionKey } from "./sections";

/** What a tab shows: a rail section's list, one project, or Search. A tab keeps its own page; moving replaces it (everything happens in one tab unless a tab is opened). */
type Page = { kind: "section"; section: SectionKey; statuses?: string[] } | { kind: "project"; projectId: string } | { kind: "search" };
interface LabTab {
  id: string;
  page: Page;
}
const sectionPage = (section: SectionKey, statuses?: string[]): Page => ({ kind: "section", section, statuses });
const projectPage = (projectId: string): Page => ({ kind: "project", projectId });
const searchPage: Page = { kind: "search" };
/** Which page it is, for keeping a view (the pill's choice) per tab and page. */
const pageKey = (page: Page) => (page.kind === "section" ? `section:${page.section}` : page.kind === "project" ? `project:${page.projectId}` : "search");

// ── The rail ──

// The lo-fi groups the Registered User's seven sections 3, 3 and 1: where you look, what you ask for, then reports. The
// admin sections follow as a fourth group. A group with no sections for the role is not drawn.
const NAV_GROUPS: string[][] = [
  ["Home", "Projects", "Explore"],
  [DLA_SECTION_LABEL, DSA_SECTION_LABEL, NOMINATION_SECTION_LABEL, TEMPLATE_FINDER_SECTION_LABEL],
  [REPORTS_SECTION_LABEL],
  [USER_MANAGEMENT_SECTION_LABEL, TAXONOMY_SECTION_LABEL, NOTIFICATION_SECTION_LABEL, CTRL_VOCAB_SECTION_LABEL, VOUCHER_SECTION_LABEL],
];

function groupNav(nav: NavNode[]): NavNode[][] {
  return NAV_GROUPS.map((labels) => nav.filter((n) => labels.includes(n.label))).filter((g) => g.length > 0);
}

// The quiet rail (step 1): three groups under small headings instead of divider lines, the admin group folded away.
const QUIET_GROUPS: { name: string; labels: string[] }[] = [
  { name: "Workspace", labels: ["Home", "Projects", "Explore"] },
  { name: "Work", labels: [DLA_SECTION_LABEL, DSA_SECTION_LABEL, NOMINATION_SECTION_LABEL, TEMPLATE_FINDER_SECTION_LABEL, REPORTS_SECTION_LABEL] },
  { name: "Admin", labels: [USER_MANAGEMENT_SECTION_LABEL, TAXONOMY_SECTION_LABEL, NOTIFICATION_SECTION_LABEL, CTRL_VOCAB_SECTION_LABEL, VOUCHER_SECTION_LABEL] },
];

function NavRail({ activeKey, onOpen, quiet }: { activeKey: SectionKey | null; onOpen: (key: SectionKey) => void; quiet: boolean }) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const groups = useMemo(() => groupNav(navForRole(role)), [role]);
  const [folded, setFolded] = useState<string[]>(["Admin"]);

  const item = (node: NavNode) => {
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

  if (quiet) {
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

  return (
    <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-3">
      {groups.map((group, i) => (
        <div key={i} className={cx("flex flex-col gap-0.5", i > 0 && "border-t border-secondary pt-2")}>
          {group.map(item)}
        </div>
      ))}
      {/* The legal links end the nav, as quiet rows of the same shape, so the foot of the rail is only the logo and Help. */}
      <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
        {LEGAL_LINKS.map((name) => {
          const LegalIcon = legalIcons[name];
          return (
            <Inert key={name} label={name} className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm text-tertiary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary">
              {LegalIcon && <LegalIcon className="size-5 shrink-0 text-quaternary" />}
              <span className="truncate">{name}</span>
            </Inert>
          );
        })}
      </div>
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

function AddMenu({ currentProjectId, compact }: { currentProjectId: string; compact?: boolean }) {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const [chooseProject, setChooseProject] = useState(false);
  if (role === "public-user") return null;
  const items = createMenuItemsForRole(role);
  return (
    <>
      <Dropdown.Root>
        <AriaButton aria-label="Add" className={cx(ghostBtn, "bg-tertiary", compact && "size-7")}>
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

function AccountRow({ currentProjectId, onSearch, quiet, trailing }: { currentProjectId: string; onSearch: () => void; quiet: boolean; trailing?: React.ReactNode }) {
  const role = useUserRole();
  return (
    <div className={cx("flex items-center px-4", trailing ? "gap-0.5" : "gap-1")}>
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
              {/* Step 1 takes the legal rows out of the rail; they are here instead. */}
              {quiet &&
                LEGAL_LINKS.map((item) => (
                  <p key={item} className="m-0 cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
                    {item}
                  </p>
                ))}
            </Dialog>
          </Popover>
        </DialogTrigger>
      )}
      {/* Search is a page of its own, opened as a tab (search-page.tsx), not a popover. */}
      <AriaButton aria-label="Search" onPress={onSearch} className={cx(ghostBtn, trailing && "size-7")}>
        <SearchLg className="size-4" />
      </AriaButton>
      <AddMenu currentProjectId={currentProjectId} compact={!!trailing} />
      {trailing}
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
  tasks,
  onRun,
}: {
  tabs: { id: string; label: string; icon: Icon; short?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  tasks: AttentionTask[];
  onRun: (task: AttentionTask) => void;
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
        <Bell tasks={tasks} onRun={onRun} />
      </div>
    </div>
  );
}

/** The bell lists what needs the role's attention, the same list the rail card shows the first of. */
function Bell({ tasks, onRun, compact }: { tasks: AttentionTask[]; onRun: (task: AttentionTask) => void; compact?: boolean }) {
  return (
    <DialogTrigger>
      <AriaButton aria-label={tasks.length ? `Notifications, ${tasks.length} need your attention` : "Notifications"} className={cx(ghostBtn, "relative", compact && "size-7")}>
        <Bell01 className="size-4" />
        {tasks.length > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error-solid ring-2 ring-bg-primary" />}
      </AriaButton>
      <Popover size="auto" placement="bottom right" className="w-80 p-1">
        <Dialog aria-label="Notifications" className="outline-hidden">
          {({ close }) => (
            <>
            <p className="m-0 px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Needs your attention</p>
            {tasks.length === 0 && <p className="m-0 px-3 pb-3 text-sm text-tertiary">Nothing needs your attention.</p>}
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  close();
                  onRun(t);
                }}
                className="flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left outline-focus-ring hover:bg-secondary focus-visible:outline-2"
              >
                <span className="text-sm font-medium text-primary">{t.title}</span>
                {t.status && t.statusColor ? (
                  <Badge size="sm" color={t.statusColor}>
                    {t.status}
                  </Badge>
                ) : (
                  <span className="text-sm text-tertiary">{t.detail}</span>
                )}
              </button>
            ))}
            </>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// ── The panel's bar: where you are, and what you can do here ──

// Overview is the page for reading; Edit details is the page as it was, a card per group of fields with Edit on each, for
// the people who can change a project (not a public user). Species and Artefacts keep the project page's own icons (3.13).
const VIEWS: { id: ProjectView; label: string; icon: Icon }[] = [
  { id: "overview", label: "Overview", icon: Grid01 },
  { id: "records", label: "Project records", icon: Database01 },
  { id: "species", label: "Species", icon: Feather },
  { id: "artefacts", label: "Artefacts and attachments", icon: Paperclip },
  { id: "edit", label: "Edit details", icon: Edit05 },
];

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
  return (
    <>
      <Dropdown.Root>
        <AriaButton aria-label="More project actions" className={roundBtn}>
          <DotsHorizontal className="size-4" />
        </AriaButton>
        <Dropdown.Popover placement="bottom right">
          <Dropdown.Menu aria-label="More project actions" onAction={(key) => run(key as keyof typeof GATES)}>
            <Dropdown.Item id="upload" label="Upload dataset" icon={Upload01} />
            <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
            <Dropdown.Item id="report" label="Create report" icon={BarChart01} />
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      {g && <SignUpPromptModal isOpen onOpenChange={(open) => !open && setGate(null)} icon={g.icon} title={g.title} description={g.description} />}
    </>
  );
}

function ProjectBarControls({
  project,
  view,
  setView,
  branchOpen,
  onToggleBranch,
  showViews,
}: {
  project: Project;
  view: ProjectView;
  setView: (v: ProjectView) => void;
  branchOpen: boolean;
  onToggleBranch: () => void;
  /** False from step 5, where the page's own pill tabs are the views. */
  showViews: boolean;
}) {
  const canEdit = useUserRole() !== "public-user";
  return (
    <>
      {showViews && <ViewMenu views={VIEWS.filter((v) => v.id !== "edit" || canEdit)} current={view} onChange={(id) => setView(id as ProjectView)} ariaLabel="View" />}
      {/* The branch: the project's records as a tree (Site, Visit, Transect ...), opened beside the page and closed again. */}
      <AriaButton aria-label="Records tree" aria-pressed={branchOpen} onPress={onToggleBranch} className={cx(roundBtn, branchOpen && "bg-tertiary text-primary")}>
        <GitBranch01 className="size-4" />
      </AriaButton>
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

export function PostSixOctShell({ step }: { step: number }) {
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

  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const labelled = tabs.map((t): { tab: LabTab; label: string; icon: Icon; short?: string } => {
    const page = t.page;
    if (page.kind === "section") return { tab: t, label: plain(SECTION_LABELS[page.section]), icon: sectionIcon(SECTION_LABELS[page.section]) ?? Folder };
    if (page.kind === "search") return { tab: t, label: "Search", icon: SearchLg };
    const p = byId.get(page.projectId);
    return { tab: t, label: p ? `[${p.code}] ${p.name}` : "Project", icon: Folder, short: p?.code };
  });
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const go = (page: Page) => {
    setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, page } : t)));
    setBranchFor(null);
  };
  const openTab = (page: Page = sectionPage("dashboard"), beside = false) => {
    const id = `t${nextId.current++}`;
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
  // Step 2: the tab strip is there only when there is more than one tab, and the 40px above the panel goes with it; the bell moves
  // into the account row. Step 1 quiets the rail; step 4 and 5 turn the panel white where the page is a list or the project.
  const stripVisible = step < 2 || tabs.length > 1;
  const quietCrumbs = step >= 2;
  const whitePanel = (page.kind === "section" && step >= 4) || (page.kind === "project" && step >= 5);
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
        <AccountRow currentProjectId={currentProjectId} onSearch={openSearch} quiet={step >= 1} trailing={stripVisible ? undefined : <Bell tasks={attention} onRun={runTask} compact />} />
        {stripVisible && (
          <TabStrip
            tabs={labelled.map((l) => ({ id: l.tab.id, label: l.label, icon: l.icon, short: l.short }))}
            activeId={active.id}
            onSelect={(id) => {
              setActiveId(id);
              setBranchFor(null);
            }}
            onClose={close}
            onNew={() => openTab()}
            tasks={attention}
            onRun={runTask}
          />
        )}
        <div className="col-start-1 row-start-2 flex min-h-0 flex-col px-4 pb-4">
          <NavRail activeKey={activeKey} onOpen={(key) => go(sectionPage(key))} quiet={step >= 1} />
          <RailFoot />
        </div>
        <section onClickCapture={holdLinks} aria-label={labelled.find((l) => l.tab === active)?.label} className={cx("relative col-start-2 mr-4 mb-4 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-secondary", stripVisible ? "row-start-2" : "row-span-2 row-start-1 mt-4", whitePanel ? "bg-primary" : "bg-secondary")}>
          {project ? (
            <>
              <PanelBar
                crumbs={
                  <>
                    {!quietCrumbs && (
                      <>
                        <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
                        <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                      </>
                    )}
                    <ProjectCrumb project={project} onOpen={(id) => go(projectPage(id))} onViewAll={() => go(sectionPage("project-list"))} />
                    <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                    <span className="truncate font-medium text-primary">
                      [{project.code}] {project.name}
                    </span>
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
                  <ProjectBarControls
                    project={project}
                    view={(view as ProjectView) ?? "overview"}
                    setView={setView}
                    branchOpen={branchOpen}
                    onToggleBranch={() => setBranchFor(branchOpen ? null : active.id)}
                    showViews={step < 5}
                  />
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
                    view={(view as ProjectView) ?? "overview"}
                    setView={setView}
                    branchOpen={branchOpen}
                    onBranchClose={() => setBranchFor(null)}
                    step={step}
                  />
                </div>
              </main>
            </>
          ) : page.kind === "search" ? (
            <>
              <PanelBar
                crumbs={
                  <>
                    {!quietCrumbs && (
                      <>
                        <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
                        <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
                      </>
                    )}
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
                    {page.section !== "dashboard" && !quietCrumbs && (
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
                    <SectionViewMenu key={viewKey} section={page.section} view={view} onChange={setView} />
                    <SectionActions key={`${viewKey}:actions`} section={page.section} />
                  </>
                }
              />
              {/* A list fits the panel and scrolls its own rows (CONTRACTS 4.2), so <main> does not scroll. */}
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <SectionContent key={`${viewKey}:${role}:${page.statuses?.join(",") ?? ""}`} section={page.section} view={view} statuses={page.statuses} step={step} />
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
