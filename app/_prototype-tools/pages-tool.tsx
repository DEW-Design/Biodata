"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, File06, SearchMd } from "@untitledui/icons";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Input,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  SearchField,
  type Key,
} from "react-aria-components";
import { SCREENS } from "@/app/pages/_shared/screen-index";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import { cx } from "@/utils/cx";
import { availability, buildMap, matchesQuery, type MapNode } from "./pages-map-data";
import { roleLabel } from "./role-options";
import { useSetRole } from "./role-switch";

// The Pages tool: a button on the Prototype tools bar, on every screen, that opens the map of the prototype's screens to jump to
// (chosen from `/proto/site-map`, 5 Oct 2026). Less is more (designer, 5 Oct 2026, from a reference of a dashboard that dropped
// everything the data did not need): the panel is one plain surface with a search box, the tree, and one line at the foot, with no
// header, counts, view switch or coloured bands. It lists only the screens the viewed persona can open and hides the rest (a
// restricted page is still reachable by its address and says so there, 3.7); the foot names the persona and its menu lists the
// others, each with the number of pages it has, which is where switching is invited. The button is Scaffold (Geist, react-aria
// primitives, the bar's violet, CONTRACTS 1.5); the tree is the real DEW `TreeView` with no checkboxes, a designer instruction
// (logged with `2026-10-05-09-*`) that is not a precedent. Links keep the role, and the page you are on is marked.

const areaKey = (area: string) => `area:${area}`;

/** The node as the persona and the search leave it: a screen the role cannot open is dropped (its sub-screens it can open move up). */
const pruneNode = (node: MapNode, query: string, role: UserRole): MapNode[] => {
  const children = node.children.flatMap((c) => pruneNode(c, query, role));
  if (!availability(node.screen, role).open) return children;
  return matchesQuery(node.screen, query) || children.length > 0 ? [{ ...node, children }] : [];
};

const flatten = (nodes: MapNode[]): MapNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);
const countOpen = (role: UserRole) => SCREENS.filter((s) => availability(s, role).open).length;

const RECENT_KEY = "prototype-tools-recent-pages";
const RECENT_KEPT = 8;
const RECENT_SHOWN = 4;

const readRecent = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
};

/** Remember the screens you open, newest first, so the Pages panel can offer the last few. Only screens in the index count (a record
 *  with some other id is not one), and the panel's own role switching does not add a duplicate. Mounted by the bar, which every
 *  screen has, so it records even while the bar is folded. */
export function useRecordPage() {
  const pathname = usePathname();
  useEffect(() => {
    if (!SCREENS.some((s) => s.path === pathname)) return;
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([pathname, ...readRecent().filter((p) => p !== pathname)].slice(0, RECENT_KEPT)));
  }, [pathname]);
}

export function PagesTool({
  wasDrag,
  closeKey,
  triggerClassName,
}: {
  wasDrag: () => boolean;
  /** Changing this closes the panel (the bar started being dragged). */
  closeKey: number;
  triggerClassName: (open: boolean) => string;
}) {
  const [open, setOpen] = useState(false);
  const [seenCloseKey, setSeenCloseKey] = useState(closeKey);
  if (seenCloseKey !== closeKey) {
    setSeenCloseKey(closeKey);
    setOpen(false);
  }
  return (
    <DialogTrigger isOpen={open} onOpenChange={(next) => setOpen(next && !wasDrag())}>
      <AriaButton aria-label="Pages" className={triggerClassName(open)}>
        <File06 className="size-4 shrink-0 text-[var(--tool-muted)]" aria-hidden="true" />
        <span className="font-medium text-[var(--tool-fg)]">Pages</span>
        <ChevronUp className="size-3.5 shrink-0 text-[var(--tool-muted)]" aria-hidden="true" />
      </AriaButton>
      <Popover
        placement="top start"
        offset={8}
        className={(state) =>
          cx(
            "w-[360px] overflow-hidden rounded-xl bg-primary font-sans shadow-xl ring-1 ring-secondary outline-hidden",
            state.isEntering && "animate-in fade-in duration-150 ease-out motion-reduce:animate-none",
            state.isExiting && "animate-out fade-out duration-100 ease-in motion-reduce:animate-none",
          )
        }
      >
        <Dialog aria-label="Pages" className="flex flex-col outline-hidden">
          {({ close }) => <PagesPanel close={close} />}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function PagesPanel({ close }: { close: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const setRole = useSetRole();
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";

  const map = useMemo(() => buildMap(), []);
  const areas = useMemo(
    () =>
      map
        .map((a) => ({ ...a, roots: a.roots.flatMap((r) => pruneNode(r, query, role)) }))
        .filter((a) => a.roots.length > 0),
    [map, query, role],
  );
  // The last few screens opened that this persona can open, other than this one (read once, when the panel opens).
  const [recentPaths] = useState(readRecent);
  const recent = useMemo(
    () =>
      recentPaths
        .filter((path) => path !== pathname)
        .map((path) => SCREENS.find((s) => s.path === path))
        .filter((s): s is NonNullable<typeof s> => !!s && availability(s, role).open)
        .slice(0, RECENT_SHOWN),
    [recentPaths, pathname, role],
  );
  const personas = useMemo(() => USER_ROLES.map((r) => ({ role: r, count: countOpen(r) })), []);
  const openCount = personas.find((p) => p.role === role)?.count ?? 0;

  // The area holding the page you are on, and the screens above it, start open; a search opens everything that matches.
  const [opened, setOpened] = useState<Set<Key>>(() => {
    const trail = (nodes: MapNode[]): Key[] | null => {
      for (const n of nodes) {
        if (n.screen.path === pathname) return [];
        const inner = trail(n.children);
        if (inner) return [n.screen.path, ...inner];
      }
      return null;
    };
    const keys = new Set<Key>();
    for (const a of map) {
      const t = trail(a.roots);
      if (t) [areaKey(a.area), ...t].forEach((k) => keys.add(k));
    }
    return keys;
  });
  const expandable = useMemo(() => new Set<Key>(areas.flatMap((a) => [areaKey(a.area), ...flatten(a.roots).filter((n) => n.children.length > 0).map((n) => n.screen.path)])), [areas]);
  const expanded = searching ? expandable : opened;

  // Keep the page you are on in view, scrolling only as far as needed so the recent pages above stay visible.
  // The tree builds its rows a frame after mounting, so the row is looked for over the next few frames.
  useEffect(() => {
    let frame = 0;
    let tries = 0;
    const find = () => {
      const row = scrollRef.current?.querySelector<HTMLElement>(`[role=treegrid][aria-label=Pages] [data-key="${CSS.escape(pathname)}"]`);
      if (row) row.scrollIntoView({ block: "nearest" });
      else if (tries++ < 10) frame = requestAnimationFrame(find);
    };
    find();
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const go = (path: string) => {
    close();
    router.push(roleHref(path));
  };
  const onAction = (key: Key) => {
    const id = String(key);
    if (!id.startsWith("area:")) return go(id);
    setOpened((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };

  // From the search box: Down moves into the tree, Enter goes to the first match.
  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      bodyRef.current?.querySelector<HTMLElement>("[role=treegrid] [role=row]")?.focus();
    } else if (e.key === "Enter" && searching) {
      const first = areas.flatMap((a) => flatten(a.roots)).find((n) => matchesQuery(n.screen, query));
      if (first) go(first.screen.path);
    }
  };

  // A screen standing at the top is as heavy as the areas; one inside an area recedes, so the area reads as its heading.
  const renderNode = (node: MapNode, topLevel = false) => (
    <TreeView.Item key={node.screen.path} id={node.screen.path} textValue={node.screen.name}>
      <TreeView.ItemContent weight={topLevel ? "semibold" : "normal"} className={cx(node.screen.path === pathname && "bg-brand-secondary hover:bg-brand-secondary")}>
        {node.screen.name}
      </TreeView.ItemContent>
      {node.children.map((c) => renderNode(c))}
    </TreeView.Item>
  );

  const sectionLabel = "m-0 text-xs font-semibold tracking-wide text-tertiary uppercase";
  const showRecent = recent.length > 0 && !searching;
  const shownCount = areas.reduce((n, a) => n + a.count, 0);

  return (
    <>
      <div className="p-2">
        <SearchField
          aria-label="Search pages"
          autoFocus
          value={query}
          onChange={setQuery}
          onKeyDown={onSearchKey}
          className="flex items-center gap-2 rounded-lg px-2.5 ring-1 ring-secondary focus-within:ring-2 focus-within:ring-[var(--tool-bg)]"
        >
          <SearchMd className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
          <Input placeholder="Search pages" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-primary outline-hidden placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden" />
        </SearchField>
      </div>

      {/* One height whatever it holds: Recent, when there is any, is a card of its own that stays put; All pages scrolls under its own label. */}
      <div ref={bodyRef} className="flex h-[min(56vh,480px)] flex-col">
        {showRecent && (
          <section aria-label="Recent pages" className="mx-2 mb-2 shrink-0 rounded-lg bg-primary p-1 ring-1 ring-primary">
            <h2 className={cx(sectionLabel, "px-2 pt-1.5 pb-0.5")}>Recent</h2>
            <TreeView aria-label="Recent pages" selectionMode="none" size="sm" alignLeaves onAction={onAction}>
              {recent.map((s) => (
                <TreeView.Item key={s.path} id={s.path} textValue={s.name}>
                  <TreeView.ItemContent weight="normal" action={s.area !== s.name ? <span className="shrink-0 text-xs text-quaternary">{s.area}</span> : undefined}>
                    {s.name}
                  </TreeView.ItemContent>
                </TreeView.Item>
              ))}
            </TreeView>
          </section>
        )}
        <div className={cx("flex shrink-0 items-baseline justify-between px-4 pb-1", !showRecent && "pt-1")}>
          <h2 className={sectionLabel}>{searching ? "Results" : "All pages"}</h2>
          {searching && <span className="text-xs text-quaternary tabular-nums">{shownCount}</span>}
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)]">
          {areas.length === 0 ? (
            <p className="m-0 p-3 text-sm text-tertiary">No page matches.</p>
          ) : (
            <TreeView aria-label="Pages" selectionMode="none" size="sm" alignLeaves expandedKeys={expanded} onExpandedChange={(keys) => !searching && setOpened(new Set(keys))} onAction={onAction}>
              {areas.map((a) =>
                // An area of one screen is that screen, not a group holding one row.
                a.count === 1 && a.roots[0].children.length === 0 ? (
                  renderNode(a.roots[0], true)
                ) : (
                  <TreeView.Item key={a.area} id={areaKey(a.area)} textValue={a.area}>
                    <TreeView.ItemContent action={<span className="shrink-0 text-xs font-medium text-quaternary tabular-nums">{a.count}</span>}>{a.area}</TreeView.ItemContent>
                    {a.roots.map((r) => renderNode(r))}
                  </TreeView.Item>
                ),
              )}
            </TreeView>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-secondary px-3 py-2 text-xs text-tertiary">
        <span className="tabular-nums">{openCount} pages</span>
        <MenuTrigger>
          <AriaButton className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-medium text-secondary outline-hidden hover:bg-secondary focus-visible:outline-2 focus-visible:outline-[var(--tool-bg)]">
            Switch persona
            <ChevronDown className="size-3.5 text-fg-quaternary" aria-hidden="true" />
          </AriaButton>
          <Popover placement="top end" offset={6} className="min-w-52 rounded-xl bg-primary p-1 font-sans shadow-xl ring-1 ring-secondary outline-hidden">
            <Menu aria-label="View as" onAction={(key) => setRole(key as UserRole)} className="outline-hidden">
              {personas.map((p) => (
                <MenuItem
                  key={p.role}
                  id={p.role}
                  textValue={roleLabel(p.role)}
                  className={({ isFocused }) => cx("flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-primary outline-hidden", isFocused && "bg-secondary")}
                >
                  <Check className={cx("size-4 shrink-0 text-fg-quaternary", p.role === role ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="flex-1">{roleLabel(p.role)}</span>
                  <span className="text-xs text-tertiary tabular-nums">{p.count}</span>
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
    </>
  );
}
