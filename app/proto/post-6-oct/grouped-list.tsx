"use client";

// Step 4 of the subtraction (steps.ts): a collection as rows grouped by status, in place of the bordered table. Taken from
// Linear's issue list (Mobbin, 12 Oct 2026): a tinted bar per group with a fold arrow, a count and the group's name, then one
// 40px row each, with the reference muted at the left, the title in medium weight, the rest muted, the date at the far right. What
// goes: the table header, the row borders, the card around the table, the pagination footer, the per-column sort. What stays:
// search, a row is a link (it opens in this tab when the lab holds the page), and the one primary action.
// Composed from tokens, not a real component (CONTRACTS 1.2, structural shell): a lab only; promoting it would be a new component
// and the designer's call (1.4). It has no filter menu yet: the real `FilterMenu` needs the attribute description each list
// builds for itself.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "@untitledui/icons";
import { Badge, type BadgeColor } from "@/components/base/badges/badges";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

export interface ListRow {
  id: string;
  /** The id of the group it sits in. */
  group: string;
  /** The muted reference at the left: an ID or a code. */
  ref: string;
  title: string;
  /** One muted line of context after the title. */
  sub?: string;
  /** A muted fact at the right, before the date. */
  right?: string;
  date?: string;
  href: string;
}

export interface ListGroup {
  id: string;
  label: string;
  color: BadgeColor<"pill-color">;
}

/** "2026-09-23" as "23 Sep 2026"; a value that is not a date (the project list's "2 days ago") is kept as it is. */
export function shortDate(value?: string): string | undefined {
  if (!value) return undefined;
  const d = /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : value;
}

export function GroupedList({
  rows,
  groups,
  collapsedByDefault = [],
  searchLabel,
  placeholder,
  action,
}: {
  rows: ListRow[];
  groups: ListGroup[];
  /** Group ids that start folded: the ones that are done with. */
  collapsedByDefault?: string[];
  searchLabel: string;
  placeholder: string;
  action?: ReactNode;
}) {
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [folded, setFolded] = useState<string[]>(collapsedByDefault);

  const q = search.trim().toLowerCase();
  const matching = useMemo(() => rows.filter((r) => !q || [r.ref, r.title, r.sub, r.right].some((v) => v?.toLowerCase().includes(q))), [rows, q]);
  const shown = groups.map((g) => ({ g, rows: matching.filter((r) => r.group === g.id) })).filter((x) => x.rows.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <ToolbarSearch label={searchLabel} placeholder={placeholder} value={search} onChange={setSearch} />
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {shown.length === 0 && <p className="m-0 px-4 py-8 text-center text-sm text-tertiary">Nothing matches &ldquo;{search.trim()}&rdquo;.</p>}
        {shown.map(({ g, rows: groupRows }) => {
          const open = q ? true : !folded.includes(g.id);
          return (
            <section key={g.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setFolded((f) => (f.includes(g.id) ? f.filter((x) => x !== g.id) : [...f, g.id]))}
                className="flex w-full items-center gap-2 bg-secondary px-4 py-2 text-left outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2"
              >
                <ChevronDown className={cx("size-3.5 shrink-0 text-quaternary transition-transform duration-100 ease-out", !open && "-rotate-90")} aria-hidden />
                <Badge size="sm" color={g.color}>
                  {g.label}
                </Badge>
                <span className="text-sm text-tertiary tabular-nums">{groupRows.length}</span>
              </button>
              {open &&
                groupRows.map((r) => (
                  <Link
                    key={r.id}
                    href={roleHref(r.href)}
                    className="flex h-10 items-center gap-3 px-4 text-sm outline-focus-ring transition duration-100 ease-linear hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <span className="w-28 shrink-0 truncate text-tertiary tabular-nums">{r.ref}</span>
                    <span className="max-w-[40%] shrink-0 truncate font-medium text-primary">{r.title}</span>
                    <span className="min-w-0 flex-1 truncate text-tertiary">{r.sub}</span>
                    {r.right && <span className="hidden max-w-48 shrink-0 truncate text-tertiary md:block">{r.right}</span>}
                    {r.date && <span className="w-24 shrink-0 text-right text-tertiary tabular-nums">{r.date}</span>}
                  </Link>
                ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
