"use client";

// The nested rail, taken from Notion's sidebar (designer, 13 Oct 2026: "I really love this pattern from notion.so"): a row shows
// its page icon; pointed at, the icon turns into a right chevron (a small button of its own);
// the chevron opens the row's children in place, indented, each with its own icon. Opening is a separate act from going: the label
// goes to the page, the chevron only folds.
// What the children are: one level above the content (designer, 13 Oct 2026: "it should be one level above, All projects, My projects,
// all X, my X, not all content on the sidebar"). They are a section's views, the choices its pill offers: All projects and My projects,
// All requests and My requests, All agreements and My agreements, All nominations and My nominations, Users and Roles and
// Permissions, All species and Flora and Fauna, All notifications and each category, Home's two dashboards. The records themselves
// (a project, a request) never appear in the rail; they are the page. A section with one view has no chevron (a one-option
// switcher is dishonest), so a public user's Projects has none. There are no tabs in the lab, so a row has no "..." menu (its one action was Open in new tab), and the flat rail this one
// replaced has gone (the designer, 19 Oct 2026: "let's retire the other options, rail and top right bits"); a row with no section of its own is still drawn as a plain link.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { ReactNode } from "react";
import Link from "next/link";
import { Button as AriaButton } from "react-aria-components";
import { ChevronRight } from "@untitledui/icons";
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
}

// An open section keeps its chevron (pointing down) in the icon slot, so what is open is always visible (the designer, 19 Oct 2026); closed, it shows on hover or focus as before.
// A view row is indented by margin, not padding, so its hover and selected fill starts at the indent instead of running under the section's row.
const INDENT = 16;
const TILE = "rounded-[calc(var(--radius-lg)-0.25rem)]";

/** One row: the icon (a chevron button when it has children) and the label. */
function RailRow({
  icon: RowIcon,
  label,
  depth,
  active,
  href,
  onOpen,
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
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="group/row">
      <div
        className={cx(
          "flex h-8 items-center gap-1 rounded-lg pr-1 pl-1 transition-colors duration-150 ease-out",
          active ? "bg-brand-solid text-white" : "hover:bg-tertiary",
        )}
        style={{ marginLeft: depth * INDENT }}
      >
        {/* The icon's hover tile sits 4px in from the row's 8px corner, so its radius is 8 - 4 = 4 (CONTRACTS 2.13). The page in use fills the whole row. */}
        {expandable ? (
          <AriaButton
            aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
            aria-expanded={expanded}
            onPress={onToggle}
            className={cx(
              "grid size-6 shrink-0 place-items-center outline-focus-ring transition-colors duration-150 ease-out focus-visible:outline-2",
              TILE,
              !active && "text-quaternary group-hover/row:text-primary",
            )}
          >
            <RowIcon className={cx("size-5", expanded ? "hidden" : "group-focus-within/row:hidden group-hover/row:hidden")} />
            <ChevronRight
              className={cx(
                "size-4 transition-transform duration-100 ease-out",
                expanded ? "block" : "hidden group-focus-within/row:block group-hover/row:block",
                expanded && "rotate-90",
              )}
            />
          </AriaButton>
        ) : (
          <span
            aria-hidden
            className={cx(
              "grid size-6 shrink-0 place-items-center transition-colors duration-150 ease-out",
              !active && "text-quaternary group-hover/row:text-primary",
            )}
          >
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
          className={cx(
            "min-w-0 flex-1 truncate rounded-md py-1 text-sm font-medium outline-focus-ring transition-colors duration-150 ease-out focus-visible:outline-2",
            active ? "text-white" : "text-secondary group-hover/row:text-primary",
          )}
        >
          {label}
        </Link>
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
  if (!key || !def) return <>{flat}</>;

  const hasChildren = views.length > 1;
  // A project's own page is not a child of anything here: it lights Projects, whose children are the choices (All projects, My projects).
  const projectActive = key === "project-list" && ctx.page.kind === "project";
  const open = ctx.expanded.includes(key);
  const Icon = sectionIcons[node.label];
  const label = plain(node.label);
  return (
    <div className="flex flex-col gap-0.5">
      <RailRow
        icon={Icon}
        label={label}
        depth={0}
        // The row in use is the one lit: when a section's views are open the view is, else the section itself.
        active={projectActive || (hereSection && !(hasChildren && open))}
        href={roleHref(keyHref(key))}
        onOpen={() => ctx.go(sectionPage(key))}
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
          />
        ))}
    </div>
  );
}
