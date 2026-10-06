"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock01, SearchMd } from "@untitledui/icons";
import { Autocomplete, Header, Input, ListBox, ListBoxItem, ListBoxSection, SearchField, useFilter } from "react-aria-components";
import { PrototypeTools, roleLabel } from "@/app/_prototype-tools/prototype-tools";
import { TOOL_VARS } from "@/app/_prototype-tools/status-bar";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { SCREENS } from "@/app/pages/_shared/screen-index";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";
import { cx } from "@/utils/cx";
import { availability, buildMap, matchesQuery, type MapNode } from "@/app/_prototype-tools/pages-map-data";

// LAB: a Pages map for the Prototype tools bar. A "Pages" tool on the bar would open a panel that shows every screen of the
// prototype and jumps to it, keeping the role. It is Scaffold (CONTRACTS 1.5): Geist, react-aria primitives, the bar's
// violet, never product components. It reads the same list `/pages` does (`app/pages/_shared/screen-index.ts`) and the
// bar's own rule for which pages a role can open. A screen the role cannot use is dimmed and says why, but still opens, so
// the restriction it shows can be seen. Three ways to lay the map out, on the real list, as each role:
//   A  columns: an area per column, its screens stacked, a screen's sub-screens indented under it
//   B  tree: the map as a diagram, BioData SA branching to areas branching to screens
//   C  search first: a "go to page" list, type to narrow, arrows and Enter to go
// Not built here: the "Pages" button on the bar itself (it needs a panel kind the bar does not have yet) and the current
// page highlighted (the lab is not one of the screens). Labs ship in development only, so `/proto` screens are not listed.
const OPTIONS = [
  { id: "columns", label: "A: Columns", description: "An area per column; sub-screens indented" },
  { id: "tree", label: "B: Tree", description: "BioData SA branching to areas to screens" },
  { id: "palette", label: "C: Search first", description: "Type, arrow, Enter: go to a page" },
];
type Option = "columns" | "tree" | "palette";

const focusRing = "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--tool-fg)]";
const rowBase = "flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[var(--tool-fg)] hover:bg-[var(--tool-hover)]";

function useCounts(role: UserRole) {
  return useMemo(() => {
    const open = SCREENS.filter((s) => availability(s, role).open).length;
    return { open, total: SCREENS.length };
  }, [role]);
}

/** One screen as a link: opens in the same role. A screen the role cannot use is dimmed with a lock, and says why. */
function PageLink({ node, role, chip = false }: { node: MapNode; role: UserRole; chip?: boolean }) {
  const roleHref = useRoleHref();
  const { screen } = node;
  const a = availability(screen, role);
  return (
    <Link
      href={roleHref(screen.path)}
      title={`${screen.name}: ${screen.description}${a.reason ? ` (${a.reason})` : ""}`}
      className={cx(rowBase, focusRing, chip && "bg-[var(--tool-hover)] ring-1 ring-[var(--tool-ring)]", !a.open && "text-[var(--tool-muted)]")}
    >
      <span className="min-w-0 truncate">{screen.name}</span>
      {!a.open && (
        <>
          <Lock01 className="ml-auto size-3 shrink-0" aria-hidden />
          <span className="sr-only">, {a.reason}</span>
        </>
      )}
    </Link>
  );
}

/** A node and the nodes that match under it: a screen stays if it matches or something inside it does. */
function prune(node: MapNode, query: string): MapNode | null {
  const children = node.children.map((c) => prune(c, query)).filter((c): c is MapNode => !!c);
  return matchesQuery(node.screen, query) || children.length > 0 ? { ...node, children } : null;
}

function useMap(query: string) {
  const full = useMemo(() => buildMap(), []);
  return useMemo(
    () =>
      full
        .map((a) => ({ ...a, roots: a.roots.map((r) => prune(r, query)).filter((r): r is MapNode => !!r) }))
        .filter((a) => a.roots.length > 0),
    [full, query],
  );
}

const Nothing = () => <p className="m-0 py-6 text-sm text-[var(--tool-muted)]">No screen matches.</p>;

function Branch({ node, role, depth = 0 }: { node: MapNode; role: UserRole; depth?: number }) {
  return (
    <li className="flex flex-col">
      <PageLink node={node} role={role} />
      {node.children.length > 0 && (
        <ul className="m-0 ml-3 flex list-none flex-col border-l border-[var(--tool-divider)] p-0 pl-1.5">
          {node.children.map((c) => (
            <Branch key={c.screen.path} node={c} role={role} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

// A: an area per column.
function ColumnsMap({ role, query }: { role: UserRole; query: string }) {
  const areas = useMap(query);
  if (areas.length === 0) return <Nothing />;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-x-8 gap-y-7">
      {areas.map((a) => (
        <section key={a.area} aria-label={a.area} className="flex min-w-0 flex-col gap-1.5">
          <h2 className="m-0 flex items-baseline gap-2 px-2 text-xs font-semibold tracking-wide text-[var(--tool-label)] uppercase">
            {a.area}
            <span className="font-medium text-[var(--tool-muted)] tabular-nums">{a.count}</span>
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {a.roots.map((r) => (
              <Branch key={r.screen.path} node={r} role={role} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// B: the map as a diagram. A trunk down the left from "BioData SA", a branch to each area, and from the area a flow of screens,
// with a screen's sub-screens hanging from it.
function TreeMap({ role, query }: { role: UserRole; query: string }) {
  const areas = useMap(query);
  if (areas.length === 0) return <Nothing />;
  return (
    <div className="flex flex-col gap-3">
      <span className="w-fit rounded-lg bg-[var(--tool-fg)] px-3 py-1.5 text-sm font-semibold text-[var(--tool-bg)]">BioData SA</span>
      <div className="relative flex flex-col gap-4 pl-7">
        <span aria-hidden className="absolute top-0 bottom-5 left-3 w-px bg-[var(--tool-divider)]" />
        {areas.map((a) => (
          <section key={a.area} aria-label={a.area} className="relative flex items-start gap-3">
            <span aria-hidden className="absolute top-4 -left-4 h-px w-4 bg-[var(--tool-divider)]" />
            <div className="flex w-44 shrink-0 items-center gap-2 rounded-lg bg-[var(--tool-hover)] px-3 py-1.5 ring-1 ring-[var(--tool-ring)]">
              <h2 className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-[var(--tool-fg)]">{a.area}</h2>
              <span className="text-xs font-medium text-[var(--tool-muted)] tabular-nums">{a.count}</span>
            </div>
            <span aria-hidden className="mt-4 h-px w-4 shrink-0 bg-[var(--tool-divider)]" />
            <ul className="m-0 flex min-w-0 flex-1 list-none flex-wrap items-start gap-x-3 gap-y-2 p-0">
              {a.roots.map((r) => (
                <li key={r.screen.path} className="flex flex-col gap-1">
                  <PageLink node={r} role={role} chip />
                  {r.children.length > 0 && (
                    <ul className="m-0 ml-4 flex list-none flex-col gap-1 border-l border-[var(--tool-divider)] p-0 pl-2">
                      {r.children.map((c) => (
                        <li key={c.screen.path} className="flex flex-col gap-1">
                          <PageLink node={c} role={role} />
                          {c.children.map((g) => (
                            <div key={g.screen.path} className="ml-3 border-l border-[var(--tool-divider)] pl-2">
                              <PageLink node={g} role={role} />
                            </div>
                          ))}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

// C: search first, the whole list under it grouped by area; the field narrows it as you type, arrows move, Enter goes.
function PaletteMap({ role }: { role: UserRole }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const { contains } = useFilter({ sensitivity: "base" });
  const areas = useMemo(() => buildMap(), []);
  const flat = (nodes: MapNode[]): MapNode[] => nodes.flatMap((n) => [n, ...flat(n.children)]);
  return (
    <Autocomplete filter={(text, input) => contains(text, input)}>
      <SearchField aria-label="Go to a page" autoFocus className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--tool-hover)] px-3 ring-1 ring-[var(--tool-ring)] focus-within:ring-2 focus-within:ring-[var(--tool-fg)]">
        <SearchMd className="size-4 shrink-0 text-[var(--tool-muted)]" aria-hidden />
        <Input placeholder="Go to a page" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--tool-fg)] outline-hidden placeholder:text-[var(--tool-muted)]" />
      </SearchField>
      <ListBox
        aria-label="Pages"
        onAction={(key) => router.push(roleHref(String(key)))}
        renderEmptyState={Nothing}
        className="max-h-[56vh] overflow-y-auto outline-hidden"
      >
        {areas.map((a) => (
          <ListBoxSection key={a.area} className="mb-2">
            <Header className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-[var(--tool-label)] uppercase">{a.area}</Header>
            {flat(a.roots).map(({ screen }) => {
              const av = availability(screen, role);
              return (
                <ListBoxItem
                  key={screen.path}
                  id={screen.path}
                  textValue={`${screen.name} ${screen.path} ${screen.area} ${screen.description}`}
                  className={({ isFocused }) => cx(rowBase, "cursor-pointer justify-between gap-4 outline-hidden", isFocused && "bg-[var(--tool-hover)]", !av.open && "text-[var(--tool-muted)]")}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{screen.name}</span>
                    <span className="truncate text-xs text-[var(--tool-muted)]">{screen.path}</span>
                  </span>
                  {!av.open && (
                    <span className="flex shrink-0 items-center gap-1 text-xs">
                      <Lock01 className="size-3" aria-hidden />
                      {av.reason}
                    </span>
                  )}
                </ListBoxItem>
              );
            })}
          </ListBoxSection>
        ))}
      </ListBox>
    </Autocomplete>
  );
}

function Lab(): ReactNode {
  const requested = useSearchParams().get("option");
  const option: Option = (["columns", "tree", "palette"] as const).find((o) => o === requested) ?? "columns";
  const role = useUserRole();
  const { open, total } = useCounts(role);
  const [query, setQuery] = useState("");
  return (
    <div className="min-h-screen bg-secondary p-8 font-sans">
      <PrototypeTools />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-lg font-semibold text-primary">Pages map</h1>
          <p className="m-0 max-w-prose text-sm text-balance text-tertiary">
            What a Pages tool on the Prototype tools bar would open: every screen, grouped, one click to go, in the role you are viewing as. Switch the layout and the role on the bar.
          </p>
        </div>
        <section style={TOOL_VARS} className="flex flex-col gap-5 rounded-xl bg-[var(--tool-bg)] p-5 text-[var(--tool-fg)] ring-1 ring-[var(--tool-ring)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <h2 className="m-0 text-base font-semibold">Pages</h2>
            <p className="m-0 text-sm text-[var(--tool-muted)] tabular-nums">
              {open} of {total} open as {roleLabel(role)}
            </p>
            {option !== "palette" && (
              <SearchField aria-label="Search pages" value={query} onChange={setQuery} className="ml-auto flex w-72 max-w-full items-center gap-2 rounded-lg bg-[var(--tool-hover)] px-3 ring-1 ring-[var(--tool-ring)] focus-within:ring-2 focus-within:ring-[var(--tool-fg)]">
                <SearchMd className="size-4 shrink-0 text-[var(--tool-muted)]" aria-hidden />
                <Input placeholder="Search pages" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-[var(--tool-fg)] outline-hidden placeholder:text-[var(--tool-muted)]" />
              </SearchField>
            )}
          </div>
          {option === "columns" && <ColumnsMap role={role} query={query} />}
          {option === "tree" && <TreeMap role={role} query={query} />}
          {option === "palette" && <PaletteMap role={role} />}
        </section>
      </div>
      <LayoutOptionSwitcher ariaLabel="Pages map layout" current={option} options={OPTIONS.map((o) => ({ ...o, href: `/proto/site-map?option=${o.id}` }))} />
    </div>
  );
}

export default function SiteMapLab(): ReactNode {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
