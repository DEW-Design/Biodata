"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AttributeFilterChips, useAttributeFilter, type Attribute } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { Badge } from "@/components/base/badges/badges";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">{children}</div>
  </div>
);

interface Row {
  id: string;
  project: string;
  status: "Draft" | "Active" | "Completed";
  organisation: string;
  contributor: string;
}

// Placeholder rows: the real projects of the Projects list, with the placeholder people (CONTRACTS 0.3).
const ROWS: Row[] = [
  { id: "BD-5039", project: "Adelaide Hills Bushland Survey", status: "Active", organisation: "Adelaide Hills Landcare", contributor: "Olivia Wyatt" },
  { id: "BD-5102", project: "Coorong Wetlands Bird Count", status: "Active", organisation: "Birds SA", contributor: "Phoenix Baker" },
  { id: "BD-5137", project: "Flinders Ranges Reptile Atlas", status: "Draft", organisation: "South Australian Museum", contributor: "Olivia Wyatt" },
  { id: "BD-4988", project: "Kangaroo Island Recovery Monitoring", status: "Completed", organisation: "BirdLife Australia", contributor: "Lana Steiner" },
  { id: "BD-5160", project: "Murray Mallee Woodland Transects", status: "Active", organisation: "Birds SA", contributor: "Maya Dewitt" },
];

function FilterDemo() {
  const attributes = useMemo(
    (): Attribute<Row>[] => [
      { kind: "options", id: "status", label: "Status", group: "what", options: ["Draft", "Active", "Completed"].map((s) => ({ id: s, label: s })), get: (r) => r.status },
      { kind: "options", id: "organisation", label: "Organisation", group: "who", searchable: true, options: [...new Set(ROWS.map((r) => r.organisation))].sort().map((o) => ({ id: o, label: o })), get: (r) => r.organisation },
      { kind: "options", id: "contributor", label: "Contributor", group: "who", searchable: true, options: [...new Set(ROWS.map((r) => r.contributor))].sort().map((c) => ({ id: c, label: c })), get: (r) => r.contributor },
    ],
    [],
  );
  const filter = useAttributeFilter(attributes);
  const rows = ROWS.filter(filter.matches);
  return (
    <div className="font-barlow flex flex-col gap-3 bg-primary p-6">
      <div className="flex flex-wrap items-center gap-3">
        <FilterMenu filter={filter} />
        <p className="m-0 text-sm text-tertiary tabular-nums">
          {rows.length} of {ROWS.length} projects
        </p>
      </div>
      <AttributeFilterChips filter={filter} />
      <ul className="m-0 flex list-none flex-col rounded-lg border border-secondary p-0">
        {rows.map((r) => (
          <li key={r.id} className="m-0 flex items-center justify-between gap-3 border-t border-secondary px-4 py-3 first:border-t-0">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-primary">{r.project}</span>
              <span className="text-xs text-tertiary">
                {r.organisation} · {r.contributor}
              </span>
            </span>
            <Badge size="sm" color={r.status === "Active" ? "success" : r.status === "Draft" ? "gray" : "brand"}>
              {r.status}
            </Badge>
          </li>
        ))}
        {rows.length === 0 && <li className="m-0 px-4 py-6 text-sm text-tertiary">Nothing matches. Remove a filter.</li>}
      </ul>
    </div>
  );
}

export default function FiltersPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Filters"
        description="The one filter for every table that can be filtered: a Filter button that opens a contextual menu of the attributes, each opening its values beside it, with the filters that are on shown as chips under the toolbar."
      />

      <h2 className="text-balance">Live example</h2>
      <p className="text-balance">
        Open <strong>Filter</strong>, point at an attribute and its values open beside it. A choice applies at once: there is no
        Apply button. Organisation and Contributor are lists that grow with the data, so their submenu has a search box. (A date attribute, such as Updated, offers its presets and a Custom range in the same way.)
      </p>
      <Section label="Filter menu and chips">
        <FilterDemo />
      </Section>

      <h2 className="text-balance">Anatomy</h2>
      <ul>
        <li>
          <strong>The button</strong> is <code>FilterMenu</code> (<code>app/pages/_shared/filter-menu.tsx</code>), directly after the
          search in the toolbar, with the count of filters that are on. Its menu lists the attributes, an icon and a name each, a
          line between related groups (the <code>group</code> on the attribute), and the number ticked on an attribute that is on.
        </li>
        <li>
          <strong>The values</strong> open as a submenu beside the attribute, a tick after each value that is on. A date attribute
          offers its presets and a Custom range, which drops a small date picker from the same button.
        </li>
        <li>
          <strong>A list that grows with the data</strong> (a project, a person, an organisation) is marked <code>searchable</code>:
          from 4 values up its submenu has a search box at the top, ticked values stay on top, and at most 50 others are drawn at a
          time with a line saying how many are waiting, so a list of thousands is searched, not scrolled.
        </li>
        <li>
          <strong>The chips</strong> are <code>AttributeFilterChips</code>: one removable chip per filter that is on, and Clear all,
          under the toolbar. Nothing is shown while no filter is on.
        </li>
        <li>
          <strong>The state</strong> is <code>useAttributeFilter</code> (or <code>useListFilter</code> for a list described as
          sections and getters, <code>useSelectionFilter</code> where the selection lives outside the list). Each gives the rows
          that pass (<code>filter.matches</code>) and the object <code>FilterMenu</code> and the chips draw.
        </li>
      </ul>

      <h2 className="text-balance">The rules</h2>
      <ol>
        <li>
          <strong>One filter.</strong> Every table that can be filtered uses this one. No second filter button, popover, side
          panel or hand-built chips on a table (contract section 4.2d).
        </li>
        <li>
          <strong>It applies as you choose.</strong> No Apply button, and Escape closes the menu without changing what is ticked.
        </li>
        <li>
          <strong>What is filtered is a column you would scan.</strong> A status, an organisation, a person, a date. Not an
          identifier: the search covers IDs and names.
        </li>
        <li>
          <strong>Every attribute has an icon</strong> that names what it holds (<code>icon</code> on the attribute; one that is left
          out gets the icon for what its name says).
        </li>
        <li>
          <strong>A choice goes back to page 1.</strong> The list&apos;s page resets whenever a filter changes.
        </li>
      </ol>
    </div>
  );
}
