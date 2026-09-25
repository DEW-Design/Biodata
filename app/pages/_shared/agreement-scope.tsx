"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterLines } from "@untitledui/icons";
import { Dialog, DialogTrigger, type Key, type SortDescriptor } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Popover } from "@/components/base/select/popover";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { useRoleHref } from "@/lib/use-role-href";

// "My" vs "All" for the DSA and DLA collections, rolled into production from
// /proto/collection-sidebar's "My Items" exploration (CONTEXT.md). My/All is a scope, not a
// status: column 2 holds the scope switcher, and the table in main shows every status at once with a
// status filter and a Status column.

export type AgreementScope = "mine" | "all";

/** The placeholder signed-in user, matched against an agreement's requester (Olivia Wyatt convention). */
export const CURRENT_USER_NAME = "Olivia Wyatt";

/** The scope in the URL (`?scope=mine|all`), or the given default when there is none. */
export function useAgreementScope(defaultScope: AgreementScope): AgreementScope {
  const value = useSearchParams().get("scope");
  return value === "mine" || value === "all" ? value : defaultScope;
}

/** Column 2's switcher: the same vertical `Tabs` (`button-brand`) as Home's My BioData / Flora and Fauna Dashboard. */
export function AgreementScopeNav({
  heading,
  basePath,
  defaultScope,
  myLabel,
  allLabel,
}: {
  heading: string;
  basePath: string;
  defaultScope: AgreementScope;
  myLabel: string;
  allLabel: string;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const scope = useAgreementScope(defaultScope);
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{heading}</p>
      <Tabs orientation="vertical" selectedKey={scope} onSelectionChange={(key) => router.push(roleHref(`${basePath}?scope=${key}`))}>
        <TabList aria-label={heading} orientation="vertical" type="button-brand" fullWidth className="w-full">
          <Tab id="mine" label={myLabel} />
          <Tab id="all" label={allLabel} />
        </TabList>
      </Tabs>
    </div>
  );
}

/** The status filter for an all-statuses table: one "Filter" button (tinted while a filter is on) that
 *  opens a checklist of statuses. Nothing selected means every status is shown. */
export function StatusFilterButton<S extends string>({
  order,
  meta,
  selected,
  onChange,
}: {
  order: S[];
  meta: Record<S, { label: string }>;
  selected: Set<Key>;
  onChange: (keys: Set<Key>) => void;
}) {
  const active = selected.size > 0;
  const toggle = (id: S, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(next);
  };
  return (
    <DialogTrigger>
      <Button
        color="secondary"
        size="sm"
        iconLeading={FilterLines}
        aria-label={active ? `Filter by status, ${selected.size} applied` : "Filter by status"}
        className={active ? "bg-brand-50! ring-brand-100!" : undefined}
      >
        {active ? `Filter (${selected.size})` : "Filter"}
      </Button>
      <Popover size="auto" placement="bottom start" className="font-barlow w-56 p-3">
        <Dialog className="flex flex-col gap-3 outline-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Status</p>
            <Button color="link-color" size="sm" onPress={() => onChange(active ? new Set() : new Set(order))}>
              {active ? "Clear" : "Select all"}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {order.map((id) => (
              <Checkbox key={id} label={meta[id].label} isSelected={selected.has(id)} onChange={(checked) => toggle(id, checked)} />
            ))}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

/** A column's sort key: a string, a number, or null for "no value" (always sorted last). */
export type SortValue = string | number | null;

/**
 * Sorts rows by the active column using that column's own getter, so each column sorts by what
 * means something (Status by its workflow position, Updated by date, names alphabetically) rather
 * than by its display text. Rows with no value sink to the bottom in either direction; ties keep
 * their incoming order.
 */
export function sortRows<T>(rows: T[], sort: SortDescriptor, getters: Record<string, (row: T) => SortValue>): T[] {
  const get = sort.column != null ? getters[String(sort.column)] : undefined;
  if (!get) return rows;
  const dir = sort.direction === "descending" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: get(row) }))
    .sort((a, b) => {
      const aEmpty = a.value == null || a.value === "";
      const bEmpty = b.value == null || b.value === "";
      if (aEmpty || bEmpty) return aEmpty === bEmpty ? a.index - b.index : aEmpty ? 1 : -1;
      const cmp =
        typeof a.value === "number" && typeof b.value === "number"
          ? a.value - b.value
          : String(a.value).localeCompare(String(b.value), undefined, { numeric: true, sensitivity: "base" });
      return cmp !== 0 ? cmp * dir : a.index - b.index;
    })
    .map((x) => x.row);
}
