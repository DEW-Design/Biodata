"use client";

// The shell for /proto/post-6-oct, the base for further explorations (the designer, 19 Oct 2026: "we've chosen a direction"; the other layouts, the flat rail and the other versions of the top
// right were retired the same day, and are in .context/post-6-oct-explorations-2026-10-19/). A Linear-style layout drawn from the Figma frame "Frame 2" (HI-FI Dashboard Explorations, node
// 435:62), then refined, and locked at step 1 of the subtraction (designer, 13 Oct 2026: "we can't fundamentally violate the design system by changing how a component looks, so let's go as far
// as subtraction step 1, lock that layout, and refine from there"). Nothing here hides or restyles a design system component: each is used as it is. What it is:
//   - the top row: at the left the account (the placeholder Olivia Wyatt, 0.3) with the notifications to its right (a Vercel-style popover, notifications-popover.tsx); in the page's column, the
//     left panel's switch, a divider and the trail that says where you are; at the far right the production header's own search field and Add button (`GlobalSearch`, `CreateMenu`);
//   - there are no tabs: one page at a time, and a rail click, a link, a row or a result replaces it (a Cmd or Ctrl click is the browser's own and opens the production page in a new browser tab);
//   - the page is an inset panel with one 40px bar that holds only the page's own things: at its left a user alert (the flagged concepts, for the roles that review them), at its right a project's
//     buttons (the "+" menu, the upload status, a pill of the records tree, properties and copy link, and "...") or a section's actions; the bar is not drawn when there is nothing to put in it;
//     then the content: the real lists without their shells, and the production project page (its tabs, sections and cards);
//   - there is no column 2: a page's views (a project's Project, Project records, Species, Artefacts and attachments; a list's All and My, a section's areas) are tabs at the top of the page, one
//     click each (the DEW tab list, panel-controls.tsx);
//   - the rail is quiet and nested: three groups (Workspace, Work, Admin, which starts folded) under small headings, no divider lines, the legal links in the account menu; Notion's pattern, a
//     row's icon turns into a chevron when pointed at and opens the row's children, which are one level above the records (All projects and My projects, never the projects), nested-rail.tsx;
//     the logo and Help are at its foot; with the panel switched off it is a column of icons;
//   - the lab opens as the Super Admin (the largest scope), to be worked down to the smaller roles with the Prototype tools bar.
// Steps 2 to 5 of the subtraction (the tab strip hidden, list headers hidden, grouped rows, a Linear-style project page) are removed: they hid or restyled components, or replaced them.
// context/decisions/2026-10-12-07-* keeps the record of what they were.
//
// Re-fitted from the lo-fi (CONTRACTS 2.5: it fixes content and flow, not styling): real tokens and Barlow, the real nav tree for the role, real projects. Where the lo-fi is unlabelled this lab
// made a reading, named here so it can be corrected:
//   - the database pill with a caret was a view menu; it is now the page's view tabs (13 Oct 2026);
//   - the branch icon opens the project's records tree (branch-drawer.tsx);
//   - the round control beside the logo is Help, which has no page yet (inert);
//   - the "Alert" card is not built (the designer, 12 Oct 2026: it is for public users, later); the bell lists what needs the role's attention;
//   - "Contents" is the project page's own "On this page", level with the title.
// The Prototype tools bar is mounted by page.tsx as on every lab. Search: the lab's own Search page (search-page.tsx) is no longer reached from here, because the top right is production's
// search, which goes to the production Explore page; the file is kept.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file. Desktop only; there is no mobile layout yet.

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable, RouterProvider } from "react-aria-components";
import {
  BarChart01,
  ChevronDown,
  ChevronRight,
  Download01,
  DotsHorizontal,
  GitBranch01,
  InfoCircle,
  LayoutLeft,
  Link01,
  Paperclip,
  LogIn01,
  HelpCircle,
  Plus,
  Star01,
  Upload01,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Popover } from "@/components/base/select/popover";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { toast } from "@/components/application/toast/toast";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { CreateMenu } from "@/app/pages/_shared/create-menu";
import { GlobalSearch } from "@/app/pages/_shared/global-search";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { useAllProjects } from "@/app/pages/_shared/created-projects-store";
import type { Project } from "@/app/pages/_shared/project-list-data";
import { ADELAIDE_HILLS_ID } from "@/app/pages/project-detail/project-seed";
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
import type { ChildOption } from "@/app/pages/project-detail/record-rules";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";
import { BASE_PATH } from "@/lib/base-path";
import { useAttention, type AttentionTask } from "./attention";
import { NotificationsBell, useInboxState } from "./notifications-popover";
import { barBtn, barSegment, plain } from "./panel-controls";
import { ProjectAddMenu } from "./project-add-menu";
import { ProjectUploadStatus } from "./lab-ingestion";
import { projectPage, sectionPage, pageKey, type Page } from "./pages";
import { RailItem, type RailContext } from "./nested-rail";
import { ProjectWorkspace, seedFor, type ProjectView } from "./project-workspace";
import { SECTION_LABELS, SectionActions, SectionContent, hasSectionActions, type SectionKey } from "./sections";

// ── The rail ──

// The rail (the layout locked at step 1 of the subtraction, designer, 13 Oct 2026): three groups under small headings instead of divider
// lines, the admin group folded away, and the legal links in the account menu rather than the rail.
const QUIET_GROUPS: { name: string; labels: string[] }[] = [
  { name: "Workspace", labels: ["Home", "Projects", "Explore"] },
  {
    name: "Work",
    labels: [DLA_SECTION_LABEL, DSA_SECTION_LABEL, NOMINATION_SECTION_LABEL, TEMPLATE_FINDER_SECTION_LABEL, REPORTS_SECTION_LABEL],
  },
  {
    name: "Admin",
    labels: [USER_MANAGEMENT_SECTION_LABEL, TAXONOMY_SECTION_LABEL, NOTIFICATION_SECTION_LABEL, CTRL_VOCAB_SECTION_LABEL, VOUCHER_SECTION_LABEL],
  },
];

function NavRail({
  activeKey,
  onOpen,
  page,
  activeView,
  go,
}: {
  activeKey: SectionKey | null;
  onOpen: (key: SectionKey) => void;
  page: Page;
  activeView?: string;
  go: (page: Page, view?: string) => void;
}) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const [folded, setFolded] = useState<string[]>(["Admin"]);
  // Which rows are open (nested rail): only what the person opened.
  const [expanded, setExpanded] = useState<string[]>([]);
  const ctx: RailContext = {
    page,
    activeView,
    expanded,
    toggle: (id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id])),
    go,
  };

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
          "group flex h-8 items-center gap-1 rounded-lg px-1 text-sm font-medium outline-focus-ring transition-colors duration-150 ease-out focus-visible:outline-2",
          active ? "bg-brand-solid text-white" : "text-secondary hover:bg-tertiary hover:text-primary",
        )}
      >
        {Icon && (
          <span
            className={cx(
              "grid size-6 shrink-0 place-items-center transition-colors duration-150 ease-out",
              !active && "text-quaternary group-hover:text-primary",
            )}
          >
            <Icon className="size-5" />
          </span>
        )}
        <span className="truncate">{plain(node.label)}</span>
      </Link>
    );
  };

  const quietGroups = QUIET_GROUPS.map((g) => ({
    name: g.name,
    nodes: nav.filter((n) => g.labels.includes(n.label)),
  })).filter((g) => g.nodes.length > 0);
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

/** The foot of the rail: the Government of South Australia and Department for Environment and Water lockup at the left, Help at the right. */
function RailFoot() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/pages/dashboard/gov-sa-dew-lockup.png")}
          alt="Government of South Australia, Department for Environment and Water"
          className="h-[37px] w-auto"
        />
        <Inert
          label="Help and Documentation"
          className="grid size-8 place-items-center rounded-full border border-secondary text-quaternary hover:bg-tertiary hover:text-primary"
        >
          <HelpCircle className="size-5" />
        </Inert>
      </div>
    </div>
  );
}

// ── The account row: who you are, and the notifications ──

const ghostBtn =
  "grid size-8 shrink-0 place-items-center rounded-full text-tertiary outline-focus-ring transition duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:outline-2";

// The account button's fill wraps what the button holds (it was the whole width of the row, 80px past the chevron: "looks really weird on hover", 19 Oct 2026) and is a pill: the avatar is a
// 24px circle 4px in from the pill's edge, so the pill's radius is the avatar's 12px plus that 4px, 16px, which is half its 32px height (CONTRACTS 2.13). The 4px also puts the avatar on the
// 20px line the rail's icons are on. The fill is the rail's own hover (`bg-tertiary`), kept while the menu is open, with the chevron turned over as the profile menu in production does.
const ACCOUNT_BTN =
  "flex items-center rounded-full p-1 outline-focus-ring transition-colors duration-100 ease-linear hover:bg-tertiary aria-expanded:bg-tertiary focus-visible:outline-2";
const ACCOUNT_CHEVRON = "size-3.5 shrink-0 text-quaternary transition-transform duration-100 ease-out group-aria-expanded:rotate-180";

/** Who you are, with the account menu. `compact` is the icon-only column: the avatar and its chevron, the name left to the menu. */
function AccountMenu({ compact }: { compact?: boolean }) {
  const role = useUserRole();
  if (role === "public-user") {
    if (!compact) {
      return (
        <div className="min-w-0 flex-1">
          <GuestAuthActions />
        </div>
      );
    }
    return (
      <Tooltip title="Log in" placement="right">
        <Link href="/pages/auth/login" aria-label="Log in" className={ghostBtn}>
          <LogIn01 className="size-4" />
        </Link>
      </Tooltip>
    );
  }
  return (
    <DialogTrigger>
      {compact ? (
        <AriaButton aria-label="Account, Olivia Wyatt" className={cx("group", ACCOUNT_BTN, "gap-1 pr-2")}>
          <Avatar size="xs" initials="OW" alt="Olivia Wyatt" />
          <ChevronDown className={ACCOUNT_CHEVRON} aria-hidden />
        </AriaButton>
      ) : (
        <AriaButton className={cx("group min-w-0 text-left", ACCOUNT_BTN, "gap-2 pr-3")}>
          <Avatar size="xs" initials="OW" alt="Olivia Wyatt" />
          <span className="truncate text-xs text-primary">Olivia Wyatt</span>
          <ChevronDown className={ACCOUNT_CHEVRON} aria-hidden />
        </AriaButton>
      )}
      <Popover size="sm" placement="bottom start" className="w-48 p-1">
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
  );
}

/** The top left: the account, and the notifications at the right of the name (the designer, 19 Oct 2026: production's header, whose right end is kept, has no notifications of its own). */
function AccountRow({ bell }: { bell: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 px-4">
      <AccountMenu />
      <div className="ml-auto shrink-0">{bell}</div>
    </div>
  );
}

// ── The icon-only column ──

/** A short rule between the column's groups (the designer, 19 Oct 2026: "properly space this and add dividers"): the controls, then each group of sections, then Help. */
function Divider() {
  return <div role="separator" className="my-3 w-8 shrink-0 border-t border-secondary" />;
}

/** The left panel collapsed (the switch in the top row): what the expanded column holds, as icons. The notifications under the account, then one icon per section (its name on hover; its views are in the expanded rail only), and Help at the foot. */
function CompactColumn({ activeKey, onOpen, bell }: { activeKey: SectionKey | null; onOpen: (key: SectionKey) => void; bell: React.ReactNode }) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const groups = QUIET_GROUPS.map((g) => nav.filter((n) => g.labels.includes(n.label))).filter((nodes) => nodes.length > 0);
  return (
    <div className="flex h-full min-h-0 w-16 flex-col items-center pt-1 pb-4">
      {bell}
      <Divider />
      <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
        {groups.map((nodes, i) => (
          <Fragment key={i}>
            {i > 0 && <Divider />}
            <div className="flex flex-col items-center gap-0.5">
              {nodes.map((node) => {
                const Icon = sectionIcons[node.label];
                const active = !!node.key && node.key === activeKey;
                const label = plain(node.label);
                return (
                  <Tooltip key={node.label} title={label} placement="right">
                    <Focusable>
                      <Link
                        href={node.key ? roleHref(keyHref(node.key)) : "#"}
                        aria-label={label}
                        aria-current={active ? "page" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          if (node.key) onOpen(node.key);
                        }}
                        className={cx(
                          "grid size-8 place-items-center rounded-lg outline-focus-ring transition-colors duration-150 ease-out focus-visible:outline-2",
                          active ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
                        )}
                      >
                        {/* The whole 32px link is lit, as the expanded rail lights the whole row (designer, 19 Oct 2026). */}
                        {Icon && <Icon className="size-5" />}
                      </Link>
                    </Focusable>
                  </Tooltip>
                );
              })}
            </div>
          </Fragment>
        ))}
      </nav>
      <Divider />
      <Inert
        label="Help and Documentation"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-secondary text-quaternary hover:bg-tertiary hover:text-primary"
      >
        <HelpCircle className="size-5" />
      </Inert>
    </div>
  );
}

// ── The left panel's switch ──

/** The switch for the left panel: in the top row, not in the panel, so it is still there when the panel is hidden. */
function PanelToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Tooltip title={open ? "Collapse left panel" : "Expand left panel"} placement="bottom">
      <AriaButton aria-label={open ? "Collapse left panel" : "Expand left panel"} aria-expanded={open} onPress={onToggle} className={cx(ghostBtn, "size-7")}>
        <LayoutLeft className="size-4" />
      </AriaButton>
    </Tooltip>
  );
}

/**
 * The top row, where there are no tabs: the panel's switch, a divider, the trail that says where you are, and at the far right the production header's own search and Add (the designer, 19 Oct
 * 2026: "keep the top right same as production"). A page's own controls are not here: a project's buttons and a section's actions are in the panel's bar below.
 */
function TopBar({
  leftPanelOpen,
  onToggleLeftPanel,
  crumbs,
  trailing,
}: {
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  crumbs: React.ReactNode;
  trailing: React.ReactNode;
}) {
  // No left padding: the switch's hover starts exactly where the panel below it starts, the start of column 2 (the designer, 19 Oct 2026).
  return (
    <div className="flex min-w-0 items-center gap-1 pr-4">
      <div className="flex min-w-0 items-center gap-1">
        <PanelToggle open={leftPanelOpen} onToggle={onToggleLeftPanel} />
        <span aria-hidden className="mx-1 h-4 shrink-0 border-l border-secondary" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          {crumbs}
        </nav>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">{trailing}</div>
    </div>
  );
}

// ── The panel's bar: where you are, and what you can do here ──

const GATES = {
  upload: {
    icon: Upload01,
    title: "Sign up to upload a dataset",
    description: "Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record.",
  },
  attach: {
    icon: Paperclip,
    title: "Sign up to add attachments",
    description: "Adding an attachment needs a free BioData SA account. Create one to attach files and links to a project's records.",
  },
  add: {
    icon: Plus,
    title: "Sign up to add records",
    description: "Adding records needs a free BioData SA account. Create one to add events, occurrences and observations to a project.",
  },
  export: {
    icon: Download01,
    title: "Sign up to export data",
    description: "Exporting records needs a free BioData SA account. Create one to download project and record data.",
  },
  report: {
    icon: BarChart01,
    title: "Sign up to create reports",
    description: "Reports need a free BioData SA account. Create one to build and save reports on project data.",
  },
};

/**
 * The project's controls, in the order of the designer's frame (Figma 484:4034, 16 Oct 2026): the "+" (the designer, 19 Oct 2026: Upload a dataset, a divider, then Add an event, Add an
 * occurrence and Add an observation, each opening its types as the project's own "Add inside" menu does; a record opens in the Project records tab to be filled in; then a divider and "Add an attachment", a form that
 * asks which event, occurrence or observation and which of its fields, add-artefact-modal.tsx), the ingestion chip while a dataset is being added,
 * the records tree, Properties, Copy link, then the "..." menu with Export CSV and Create report (project-card-actions.tsx has the same actions on the product page).
 */
function ProjectBarControls({
  project,
  branchOpen,
  onToggleBranch,
  propertiesOpen,
  onToggleProperties,
  onAddRecord,
  onAddArtefact,
}: {
  project: Project;
  branchOpen: boolean;
  onToggleBranch: () => void;
  propertiesOpen: boolean;
  onToggleProperties: () => void;
  onAddRecord: (option: ChildOption) => void;
  onAddArtefact: () => void;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<keyof typeof GATES | null>(null);
  const run = (key: keyof typeof GATES) => {
    if (isGuest) return setGate(key);
    if (key === "upload") router.push(roleHref(`/pages/project-list/${project.id}/upload`));
    else if (key === "export")
      downloadCsv(
        `${project.code}.csv`,
        ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"],
        [[project.code, project.name, project.org, project.status, project.contributorName, project.updated]],
      );
    else
      toast.brand("Reports aren't wired up yet", {
        description: "Reports can't be generated in this preview yet.",
      });
  };
  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href);
    toast.success("Link copied", {
      description: "The address of this project is on your clipboard.",
    });
  };
  const g = gate ? GATES[gate] : null;
  // The buttons are three groups: create (the "+", then the upload while one runs), look at the project (the records tree, Properties, Copy link) and more. The project's three are one pill
  // (the designer, 19 Oct 2026: "What if this was a pill?"), a bordered round box of three segments with a hairline between them, which sets them apart on its own, so the hairlines
  // that stood between the groups (`2026-10-19-11-*`) are gone. Each group is named for a screen reader.
  return (
    <>
      <div role="group" aria-label="Add" className="flex items-center gap-2">
        <ProjectAddMenu
          onUpload={() => run("upload")}
          onAdd={(o) => (isGuest ? setGate("add") : onAddRecord(o))}
          onAttach={() => (isGuest ? setGate("attach") : onAddArtefact())}
          trigger={
            <Tooltip title="Add to this project" placement="bottom">
              <AriaButton aria-label="Add to this project" className={barBtn}>
                <Plus className="size-3" />
              </AriaButton>
            </Tooltip>
          }
        />
        {!isGuest && <ProjectUploadStatus projectId={project.id} />}
      </div>
      <div
        role="group"
        aria-label="Project"
        className="flex h-6 shrink-0 items-stretch overflow-hidden rounded-full border border-secondary bg-primary [&>*+*]:border-l [&>*+*]:border-secondary"
      >
        {/* The branch: the project's records as a tree (Site, Visit, Transect ...), opened beside the page and closed again. */}
        <Tooltip title="Records tree" placement="bottom">
          <AriaButton aria-label="Records tree" aria-pressed={branchOpen} onPress={onToggleBranch} className={barSegment}>
            <GitBranch01 className="size-3" />
          </AriaButton>
        </Tooltip>
        {/* The properties: what the project holds that its header does not say (project-properties.tsx), opened from the right. */}
        <Tooltip title="Properties" placement="bottom">
          <AriaButton aria-label="Properties" aria-pressed={propertiesOpen} onPress={onToggleProperties} className={barSegment}>
            <InfoCircle className="size-3" />
          </AriaButton>
        </Tooltip>
        {/* Copy link is last (the designer, 19 Oct 2026): the two that open something, then the one that acts at once. */}
        <Tooltip title="Copy link" placement="bottom">
          <AriaButton aria-label="Copy link" onPress={copyLink} className={barSegment}>
            <Link01 className="size-3" />
          </AriaButton>
        </Tooltip>
      </div>
      <div role="group" aria-label="More" className="flex items-center gap-2">
        <Dropdown.Root>
          <Tooltip title="More project actions" placement="bottom">
            <AriaButton aria-label="More project actions" className={barBtn}>
              <DotsHorizontal className="size-5" />
            </AriaButton>
          </Tooltip>
          <Dropdown.Popover placement="bottom right">
            <Dropdown.Menu aria-label="More project actions" onAction={(key) => run(key as keyof typeof GATES)}>
              <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
              <Dropdown.Item id="report" label="Create report" icon={BarChart01} />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
      {g && <SignUpPromptModal isOpen onOpenChange={(open) => !open && setGate(null)} icon={g.icon} title={g.title} description={g.description} />}
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

/**
 * The panel's bar: at its left a page's user alert (or nothing), at its right the page's own buttons. The trail that says where you are is in the top row. What is in it is inset 8px at both
 * sides, the 8px that a 24px control has above and below it in the 40px bar (plus the panel's 1px border): equal all round, and the bar's corner is the panel's 16px corner, so a control's
 * 8px corner is concentric with it (CONTRACTS 2.13: 16 - 8 = 8). It was 14px at the left and 12px at the right against 8 above and below, which read as uneven.
 */
function PanelBar({ lead, controls }: { lead?: React.ReactNode; controls: React.ReactNode }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-secondary bg-tertiary px-2">
      {lead ?? <span />}
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
  const project =
    pathname.match(/^\/pages\/project-list\/([^/]+)\/project-details$/)?.[1] ?? (pathname === "/pages/project-detail" ? ADELAIDE_HILLS_ID : undefined);
  if (project) return seedFor(project, "registered-user") ? projectPage(project) : null;
  const section = SECTION_KEYS.find((k) => pathname === keyHref(k));
  return section ? sectionPage(section, url.searchParams.get("status")?.split(",").filter(Boolean)) : null;
}

export function PostSixOctShell() {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const all = useAllProjects();
  // The lab opens on Home. There are no tabs: one page at a time, and a rail click, a link, a row or a result replaces it.
  const [page, setPage] = useState<Page>(sectionPage("dashboard"));
  const [views, setViews] = useState<Record<string, string>>({});
  const [favourites, setFavourites] = useState<string[]>([]);
  // The left column (account, the rail) full or icon-only, set by the switch in the top row.
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  // The project's records tree (the branch) open, and its properties (the "i"). The two are never open together: each closes on a click outside it.
  const [branchOn, setBranchOn] = useState(false);
  const [propertiesOn, setPropertiesOn] = useState(false);
  // A record the project's "+" menu asked to add: the lab's new-record form opens for it and clears this.
  const [addRequest, setAddRequest] = useState<{
    option: ChildOption;
    id: number;
  } | null>(null);
  // The element in the panel's bar where the project's user alert is drawn (it is drawn from inside the project's own page, which has the data).
  const [barLead, setBarLead] = useState<HTMLElement | null>(null);
  // The "Add an attachment" form, opened from the "+" menu.
  const [attachOpen, setAttachOpen] = useState(false);
  const closeDrawers = () => {
    setBranchOn(false);
    setPropertiesOn(false);
  };
  const attention = useAttention();
  const inbox = useInboxState(attention);

  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);

  // A view (the pill's choice) set along with the page: the rail's children open a section or a project straight at one.
  const go = (next: Page, view?: string) => {
    setPage(next);
    if (view) setViews((v) => ({ ...v, [pageKey(next)]: view }));
    closeDrawers();
  };
  const runTask = (task: AttentionTask) => {
    if (task.open) go(sectionPage(task.open.section, task.open.statuses));
    else if (task.href) {
      const held = pageForPath(task.href);
      if (held) go(held);
      else router.push(roleHref(task.href));
    }
  };
  // Links inside the panel (a table row, a Button with an href) move to the page when the lab holds it.
  const navigate = (path: string) => {
    const held = pageForPath(path);
    if (held) go(held);
    else router.push(path);
  };
  // The same for a plain link (a next/link anchor) inside the panel. With Cmd or Ctrl held it is the browser's own: the page opens in a new browser tab, which is the production page.
  const holdLinks = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    const anchor = (e.target as HTMLElement).closest("a[href]");
    if (!anchor || anchor.getAttribute("target") === "_blank") return;
    const held = pageForPath(anchor.getAttribute("href") ?? "");
    if (!held) return;
    e.preventDefault();
    e.stopPropagation();
    go(held);
  };

  const activeKey: SectionKey | null = page.kind === "section" ? page.section : page.kind === "project" ? "project-list" : null;
  const project = page.kind === "project" ? byId.get(page.projectId) : undefined;
  const viewKey = pageKey(page);
  const view = views[viewKey];
  const setView = (v: string) => setViews((s) => ({ ...s, [viewKey]: v }));
  const branchOpen = !!project && branchOn;
  const propertiesOpen = !!project && propertiesOn;
  const pageLabel = page.kind === "section" ? plain(SECTION_LABELS[page.section]) : project ? `[${project.code}] ${project.name}` : undefined;

  // The page's trail (where you are), in the top row, after the panel switch.
  const crumbs = project ? (
    <>
      <Crumb onPress={() => go(sectionPage("dashboard"))}>Home</Crumb>
      <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
      <ProjectCrumb project={project} onOpen={(id) => go(projectPage(id))} onViewAll={() => go(sectionPage("project-list"))} />
      <ChevronRight className="size-3.5 shrink-0 text-quaternary" aria-hidden />
      <span className="truncate font-medium text-primary">{project.name}</span>
      {/* The star marks a favourite project (the designer, 19 Oct 2026): pressed, it is filled. The fill is set on the icon itself (`fill`), not by a class that the icon's own
          fill="none" could win against. */}
      <Tooltip title={favourites.includes(project.id) ? "Remove from favourite projects" : "Add to favourite projects"} placement="bottom">
        <AriaButton
          aria-label={favourites.includes(project.id) ? "Remove from favourite projects" : "Add to favourite projects"}
          aria-pressed={favourites.includes(project.id)}
          onPress={() => setFavourites((f) => (f.includes(project.id) ? f.filter((x) => x !== project.id) : [...f, project.id]))}
          className="grid size-5 shrink-0 place-items-center rounded text-quaternary outline-focus-ring hover:text-primary focus-visible:outline-2 aria-pressed:text-primary"
        >
          <Star01 fill={favourites.includes(project.id) ? "currentColor" : "none"} className="size-3.5" />
        </AriaButton>
      </Tooltip>
    </>
  ) : page.kind === "section" ? (
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
  ) : null;

  return (
    <RouterProvider navigate={navigate} useHref={(href) => (href.startsWith("/") ? `${BASE_PATH}${href}` : href)}>
      <div
        className={cx(
          "font-barlow grid h-screen grid-rows-[56px_minmax(0,1fr)] overflow-hidden bg-primary text-primary transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none",
          leftPanelOpen ? "grid-cols-[270px_minmax(0,1fr)]" : "grid-cols-[64px_minmax(0,1fr)]",
        )}
      >
        {/* The left column keeps its width inside a box that resizes around it, so the change clips instead of squeezing; collapsed, the icon column takes the account row's place and the rail is hidden, not unmounted, so it keeps what is open. */}
        <div className="min-w-0 overflow-hidden">
          {leftPanelOpen ? (
            <div className="grid h-full w-[270px] items-center">
              <AccountRow bell={<NotificationsBell state={inbox} onRun={runTask} buttonClass={ghostBtn} />} />
            </div>
          ) : (
            <div className="flex h-full w-16 items-center justify-center">
              <AccountMenu compact />
            </div>
          )}
        </div>
        <TopBar
          leftPanelOpen={leftPanelOpen}
          onToggleLeftPanel={() => setLeftPanelOpen((open) => !open)}
          crumbs={crumbs}
          trailing={
            // The production header's right end, the real components at their own sizes: the global search field (395px from the lg breakpoint) and the Add button. They act as they do on /pages
            // (they go to the production pages). The account is at the top left, so the profile is not repeated here.
            <div className="flex items-center gap-3">
              <div className="w-64 lg:w-[395px]">
                <GlobalSearch />
              </div>
              <CreateMenu />
            </div>
          }
        />
        <div className="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden">
          <div className={cx("h-full min-h-0 w-[270px] flex-col px-4 pb-4", leftPanelOpen ? "flex" : "hidden")}>
            <NavRail activeKey={activeKey} onOpen={(key) => go(sectionPage(key))} page={page} activeView={view} go={go} />
            <RailFoot />
          </div>
          {!leftPanelOpen && (
            <CompactColumn
              activeKey={activeKey}
              onOpen={(key) => go(sectionPage(key))}
              bell={<NotificationsBell state={inbox} onRun={runTask} buttonClass={ghostBtn} rail />}
            />
          )}
        </div>
        <section
          onClickCapture={holdLinks}
          aria-label={pageLabel}
          className="relative col-start-2 row-start-2 mr-4 mb-4 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-secondary bg-secondary"
        >
          {project ? (
            <>
              <PanelBar
                lead={<div ref={setBarLead} role="group" aria-label="Alerts for you" className="flex min-w-0 items-center" />}
                controls={
                  <ProjectBarControls
                    project={project}
                    branchOpen={branchOpen}
                    onToggleBranch={() => {
                      setPropertiesOn(false);
                      setBranchOn(!branchOpen);
                    }}
                    propertiesOpen={propertiesOpen}
                    onToggleProperties={() => {
                      setBranchOn(false);
                      setPropertiesOn(!propertiesOpen);
                    }}
                    onAddArtefact={() => setAttachOpen(true)}
                    onAddRecord={(o) => {
                      setView("records");
                      setAddRequest({ option: o, id: Date.now() });
                    }}
                  />
                }
              />
              {/* A <main> because the project page's "On this page" follows the scroll of the nearest <main>. */}
              {/* The top padding is a wrapper's, not <main>'s: "On this page" is sticky, and a sticky offset is measured from the
                  padding edge, so padding on <main> would sit it 16px lower than the title it should line up with. */}
              <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [scrollbar-gutter:stable]">
                <div className="pt-5">
                  <ProjectWorkspace
                    key={project.id}
                    projectId={project.id}
                    view={(view as ProjectView) ?? "project"}
                    setView={setView}
                    branchOpen={branchOpen}
                    onBranchClose={() => setBranchOn(false)}
                    propertiesOpen={propertiesOpen}
                    onPropertiesClose={() => setPropertiesOn(false)}
                    addRequest={addRequest}
                    onAddRequestConsumed={() => setAddRequest(null)}
                    attachOpen={attachOpen}
                    onAttachOpenChange={setAttachOpen}
                    alertSlot={barLead}
                  />
                </div>
              </main>
            </>
          ) : page.kind === "section" ? (
            <>
              {/* The trail is in the top row, so the bar is drawn only when the section has actions to put in it, at its right. */}
              {hasSectionActions(page.section) && <PanelBar controls={<SectionActions key={`${viewKey}:actions`} section={page.section} />} />}
              {/* A list fits the panel and scrolls its own rows (CONTRACTS 4.2), so <main> does not scroll. */}
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <SectionContent
                  key={`${viewKey}:${role}:${page.statuses?.join(",") ?? ""}`}
                  section={page.section}
                  view={view}
                  statuses={page.statuses}
                  onViewChange={setView}
                />
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
  const items = useMemo(
    () =>
      all
        .filter((p) => seedFor(p.id, "registered-user"))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ id: p.id, label: p.name, addon: p.code })),
    [all],
  );
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
