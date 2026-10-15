"use client";

// The nested rail, taken from Notion's sidebar (designer, 13 Oct 2026: "I really love this pattern from notion.so"): a row shows
// its page icon; pointed at, the icon turns into a right chevron (a small button of its own) and a "..." appears at the right;
// the chevron opens the row's children in place, indented, each with its own icon. Opening is a separate act from going: the label
// goes to the page, the chevron only folds.
// What the children are: one level above the content (designer, 13 Oct 2026: "it should be one level above, All projects, My projects,
// all X, my X, not all content on the sidebar"). They are a section's views, the choices its pill offers: All projects and My projects,
// All requests and My requests, All agreements and My agreements, All nominations and My nominations, Users and Roles and
// Permissions, All species and Flora and Fauna, All notifications and each category, Home's two dashboards. The records themselves
// (a project, a request) never appear in the rail; they are the page. A section with one view has no chevron (a one-option
// switcher is dishonest), so a public user's Projects has none. The "..." has one real action, Open in new tab. With the rail set
// to Flat (the Prototype tools bar) this file draws the old row and nothing else changes.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { ReactNode } from "react";
import Link from "next/link";
import { Button as AriaButton } from "react-aria-components";
import { ChevronRight, DotsHorizontal, LinkExternal01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { keyHref, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";
import { sectionPage, type Page } from "./pages";
import { plain, type Icon } from "./panel-controls";
import { SECTIONS } from "./sections";

export interface RailContext {
  /** The page in use, and the view it is showing. */
  page: Page;
  activeView?: string;
  expanded: string[];
  toggle: (id: string) => void;
  go: (page: Page, view?: string) => void;
  openTab: (page: Page, view?: string) => void;
  /** False draws the old flat row (Prototype tools bar: Rail, Flat). */
  nested: boolean;
}

const INDENT = 16;

/** One row: the icon (a chevron button when it has children), the label, the "...". */
function RailRow({
  icon: RowIcon,
  label,
  depth,
  active,
  href,
  onOpen,
  onNewTab,
  expandable,
  expanded,
  onToggle,
}: {
  icon: Icon;
  label: string;
  depth: number;
  active: boolean;
  href: string;
  onOpen: () => void;
  onNewTab: () => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="group/row">
      <div className={cx("flex h-8 items-center gap-1 rounded-lg pr-1 transition-colors duration-100 ease-linear", active ? "bg-tertiary" : "hover:bg-tertiary")} style={{ paddingLeft: 4 + depth * INDENT }}>
        {expandable ? (
          <AriaButton
            aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
            aria-expanded={expanded}
            onPress={onToggle}
            className="grid size-6 shrink-0 place-items-center rounded-md text-quaternary outline-focus-ring hover:bg-primary_hover hover:text-primary focus-visible:outline-2"
          >
            <RowIcon className="size-5 group-focus-within/row:hidden group-hover/row:hidden" />
            <ChevronRight className={cx("hidden size-4 transition-transform duration-100 ease-out group-focus-within/row:block group-hover/row:block", expanded && "rotate-90")} />
          </AriaButton>
        ) : (
          <span aria-hidden className={cx("grid size-6 shrink-0 place-items-center", active ? "text-primary" : "text-quaternary")}>
            <RowIcon className="size-5" />
          </span>
        )}
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          title={label}
          onClick={(e) => {
            e.preventDefault();
            onOpen();
          }}
          className={cx("min-w-0 flex-1 truncate rounded-md py-1 text-sm font-medium outline-focus-ring focus-visible:outline-2", active ? "text-primary" : "text-secondary group-hover/row:text-primary")}
        >
          {label}
        </Link>
        <Dropdown.Root>
          <AriaButton
            aria-label={`More for ${label}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-quaternary opacity-0 outline-focus-ring hover:bg-primary_hover hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 group-hover/row:opacity-100 aria-expanded:opacity-100"
          >
            <DotsHorizontal className="size-4" />
          </AriaButton>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu aria-label={`More for ${label}`} onAction={onNewTab}>
              <Dropdown.Item id="tab" label="Open in new tab" icon={LinkExternal01} />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
    </div>
  );
}

/** A top-level section: its row, and its children when it has them. */
export function RailItem({ node, ctx, flat }: { node: NavNode; ctx: RailContext; flat: ReactNode }) {
  const key = node.key;
  const roleHref = useRoleHref();
  const def = key ? SECTIONS[key] : undefined;
  const hereSection = ctx.page.kind === "section" && ctx.page.section === key;
  // A hook for every section, in a fixed order per section (the row is keyed by it): what the pill used to offer.
  const { views, current } = (def ?? SECTIONS.dashboard).useView(hereSection ? ctx.activeView : undefined);
  if (!ctx.nested || !key || !def) return <>{flat}</>;

  const hasChildren = views.length > 1;
  // A project's own page is not a child of anything here: it lights Projects, whose children are the choices (All projects, My projects).
  const projectActive = key === "project-list" && ctx.page.kind === "project";
  const open = ctx.expanded.includes(key);
  const Icon = sectionIcons[node.label];
  const label = plain(node.label);
  return (
    <div>
      <RailRow
        icon={Icon}
        label={label}
        depth={0}
        // The row in use is the one lit: when a section's views are open the view is, else the section itself.
        active={projectActive || (hereSection && !(hasChildren && open))}
        href={roleHref(keyHref(key))}
        onOpen={() => ctx.go(sectionPage(key))}
        onNewTab={() => ctx.openTab(sectionPage(key))}
        expandable={hasChildren}
        expanded={open}
        onToggle={() => ctx.toggle(key)}
      />
      {hasChildren &&
        open &&
        views.map((v) => (
          <RailRow
            key={v.id}
            icon={v.icon}
            label={v.label}
            depth={1}
            active={hereSection && current === v.id}
            href={roleHref(keyHref(key))}
            onOpen={() => ctx.go(sectionPage(key), v.id)}
            onNewTab={() => ctx.openTab(sectionPage(key), v.id)}
          />
        ))}
    </div>
  );
}
