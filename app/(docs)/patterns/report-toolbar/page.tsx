"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { parseDate } from "@internationalized/date";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/base/badges/badges";
import { Select } from "@/components/base/select/select";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { AttributeFilterChips, useAttributeFilter, type Attribute } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ParametersPopover } from "@/app/pages/_shared/reports/report-parameters";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">{children}</div>
  </div>
);

interface Row {
  id: string;
  project: string;
  species: string;
  status: "Reviewed" | "Pending";
  day: string;
}

// Placeholder rows: real projects of the Projects list, with common species of the NSX list (CONTRACTS 0.3).
const PROJECTS = ["Adelaide Hills Bushland Survey", "Coorong Wetlands Bird Count", "Kangaroo Island Recovery Monitoring"];
const ROWS: Row[] = [
  { id: "r1", project: PROJECTS[0], species: "Eucalyptus leucoxylon", status: "Reviewed", day: "2026-08-04" },
  { id: "r2", project: PROJECTS[0], species: "Xanthorrhoea semiplana", status: "Pending", day: "2026-09-12" },
  { id: "r3", project: PROJECTS[1], species: "Malurus cyaneus", status: "Reviewed", day: "2026-09-02" },
  { id: "r4", project: PROJECTS[1], species: "Crinia signifera", status: "Pending", day: "2026-09-27" },
  { id: "r5", project: PROJECTS[2], species: "Isoodon obesulus", status: "Reviewed", day: "2026-07-19" },
  { id: "r6", project: PROJECTS[2], species: "Tachyglossus aculeatus", status: "Reviewed", day: "2026-10-01" },
];

const ALL = "all";

function ReportToolbarDemo() {
  const [project, setProject] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");

  // What the report is run on (a project, a date range) is its Parameters. What you narrow the rows by (a status) is the Filter.
  const attributes = useMemo(
    (): Attribute<Row>[] => [{ kind: "options", id: "status", label: "Status", options: ["Reviewed", "Pending"].map((s) => ({ id: s, label: s })), get: (r) => r.status }],
    [],
  );
  const filter = useAttributeFilter(attributes);

  const inRange = (r: Row) => (!from || r.day >= from) && (!to || r.day <= to);
  const rows = ROWS.filter((r) => (project === ALL || r.project === project) && inRange(r) && filter.matches(r) && (!query.trim() || r.species.toLowerCase().includes(query.trim().toLowerCase())));
  const summary: [string, string][] = [...(project !== ALL ? [["Project", project] as [string, string]] : []), ...(from || to ? [["Dates", `${from || "..."} to ${to || "..."}`] as [string, string]] : [])];

  return (
    <div className="font-barlow flex flex-col gap-3 bg-primary p-6">
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarSearch label="Search the report" placeholder="Search by species" value={query} onChange={setQuery} />
        <ParametersPopover
          parameters={{
            
            summary,
            reset: () => {
              setProject(ALL);
              setFrom("");
              setTo("");
            },
            fields: (
              <div className="flex flex-col gap-4">
                <Select
                  size="sm"
                  label="Project"
                  items={[{ id: ALL, label: "All projects" }, ...PROJECTS.map((p) => ({ id: p, label: p }))]}
                  selectedKey={project}
                  onSelectionChange={(key) => key && setProject(String(key))}
                  className="w-full"
                >
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
                <InputDatePicker label="From" value={from ? parseDate(from) : null} onChange={(d) => setFrom(d ? d.toString() : "")} />
                <InputDatePicker label="To" value={to ? parseDate(to) : null} onChange={(d) => setTo(d ? d.toString() : "")} />
              </div>
            ),
          }}
        />
        <FilterMenu filter={filter} />
      </div>
      <AttributeFilterChips filter={filter} />
      <ul className="m-0 flex list-none flex-col rounded-lg border border-secondary p-0">
        {rows.map((r) => (
          <li key={r.id} className="m-0 flex items-center justify-between gap-3 border-t border-secondary px-4 py-3 first:border-t-0">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-primary italic">{r.species}</span>
              <span className="text-xs text-tertiary">
                {r.project}, {r.day}
              </span>
            </span>
            <Badge size="sm" color={r.status === "Reviewed" ? "success" : "gray"}>
              {r.status}
            </Badge>
          </li>
        ))}
        {rows.length === 0 && <li className="m-0 px-4 py-6 text-sm text-tertiary">Nothing matches. Change a parameter or remove a filter.</li>}
      </ul>
    </div>
  );
}

export default function ReportToolbarPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Report toolbar"
        description="One row above a report's table: the search, a Parameters button for what the report is run on, the Filter, and the Columns chooser. The table gets the screen, not the controls."
      />

      <h2 className="text-balance">Live example</h2>
      <p className="text-balance">
        Open <strong>Parameters</strong>: a project and a date range, the things this report is run on. What you set stays visible beside the
        button as a chip and as a count on it, so the popover can be closed. <strong>Filter</strong> narrows the rows by a status. The search
        matches the species.
      </p>
      <Section label="Report toolbar">
        <ReportToolbarDemo />
      </Section>

      <h2 className="text-balance">Why</h2>
      <p className="text-balance">
        A report&apos;s parameters were a labelled grid of fields between the tabs and the toolbar. On the Flora Taxonomy Report at 1440 by 1024 the
        grid was 156px, and with the card, the tabs and the toolbar the table started 601px down and showed 6 rows; at 800px tall, 2. Content is what a
        report is for. The pattern puts every control on one row and gives the table at least 7 rows before the page scrolls.
      </p>
      <div className="not-prose my-6 overflow-hidden rounded-xl border border-secondary bg-primary">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-secondary text-xs font-semibold tracking-wide text-quaternary uppercase">
              <th className="px-4 py-2">Flora Taxonomy Report</th>
              <th className="px-4 py-2">Table starts</th>
              <th className="px-4 py-2">Table height, 1440 x 1024</th>
              <th className="px-4 py-2">Table height, 1440 x 800</th>
            </tr>
          </thead>
          <tbody className="text-secondary tabular-nums">
            <tr className="border-t border-secondary">
              <td className="px-4 py-2">A grid of fields above the toolbar</td>
              <td className="px-4 py-2">601px</td>
              <td className="px-4 py-2">334px, 6 rows</td>
              <td className="px-4 py-2">127px, 2 rows</td>
            </tr>
            <tr className="border-t border-secondary">
              <td className="px-4 py-2 text-primary">The report toolbar</td>
              <td className="px-4 py-2 text-primary">445px</td>
              <td className="px-4 py-2 text-primary">490px, 10 rows</td>
              <td className="px-4 py-2 text-primary">the page scrolls, the table keeps 7 rows</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-balance">Anatomy</h2>
      <ul>
        <li>
          <strong>The row</strong> is, left to right: <code>ToolbarSearch</code>, the <strong>Parameters</strong> button, the <strong>Filter</strong>{" "}
          button, then the Columns chooser at the far right. It wraps on a narrow window; it never grows a second row of its own.
        </li>
        <li>
          <strong>The button</strong> is <code>ParametersPopover</code> (<code>app/pages/_shared/reports/report-parameters.tsx</code>): the design
          system&apos;s secondary <code>Button</code> with the sliders icon, and a count of the parameters that are set.
        </li>
        <li>
          <strong>The popover</strong> holds the report&apos;s own fields, drawn by the report with the design system&apos;s <code>Select</code>,{" "}
          <code>Input</code> and date field with a calendar, in one column, with a Reset at the foot. A calendar opened inside it closes on Escape
          without closing the popover.
        </li>
        <li>
          <strong>The chips</strong> beside the button are one per parameter that is set, in the same style as the filter chips. A parameter at its
          starting value (All projects) is not a chip.
        </li>
        <li>
          <strong>The report</strong> gives <code>DataReport</code> a <code>parameters</code> prop: <code>fields</code>, <code>summary</code>
          and an optional <code>reset</code>. A report with no parameters passes nothing and has no button.
        </li>
        <li>
          <strong>The table</strong> keeps at least 24rem (about 7 rows). Where the controls and the card take more than that, the page scrolls and the
          table does not shrink.
        </li>
        <li>
          <strong>An empty report</strong> shows one mock record in its table, marked <strong>Example record</strong> beside the Columns button
          (<code>DataReport</code>&apos;s <code>example</code>), so the columns can be read; it goes as soon as there is a real row. Searching it away
          leaves the usual &quot;nothing matches&quot; state.
        </li>
        <li>
          <strong>Columns that start hidden</strong> (<code>DataReport</code>&apos;s <code>hiddenColumns</code>) are the extras a report&apos;s sheet offers under
          &quot;Add columns&quot;: they are in the Columns chooser, the button says how many are hidden, Reset puts them back out of sight, and the export still writes
          every column.
        </li>
        <li>
          <strong>The export</strong> still carries the report&apos;s title and its parameters above the columns, where the sheet has them
          (<code>exportPreamble</code>), so a file says what it was run on.
        </li>
      </ul>

      <h2 className="text-balance">The rules</h2>
      <ol>
        <li>
          <strong>A parameter is what the report is run on; a filter is what you narrow its rows by; the search finds a word.</strong> A project, a
          dataset: parameters, because neither the search nor the Filter can say them. A code, a name or a common name is the search, which matches
          them already. A family, a region, a person, a status or a date range is a filter attribute (contract section 4.2d, one filter). A control
          is never in two of these: a report must not ask for the same thing twice.
        </li>
        <li>
          <strong>One row, in one order:</strong> search, Parameters, Filter, Columns. A report with no parameters has no Parameters button: no empty
          control (section 2.12).
        </li>
        <li>
          <strong>What is set is always visible.</strong> A chip for each parameter that is set and a count on the button, so closing the popover
          loses nothing. A report that is always on one thing (one dataset) shows it as chips and has no Reset.
        </li>
        <li>
          <strong>One report draws them inline.</strong> The Data Validation Error Report&apos;s project and dataset are two dropdowns on the row, to the right of Filter
          (<code>parameters.inline</code>), each the design system&apos;s <code>Select</code> with its own label above it (&quot;Project&quot;, &quot;Dataset&quot;) and showing what it is set to, so it has no
          Parameters button and no chips (designer, 23 Oct 2026). The row there is: search, Filter, Project, Dataset, Columns, aligned by their foot. A value too long for its dropdown is cut by what it is: a project is cut at a word, a dataset&apos;s file name in the middle so its version and extension stay
          (<code>truncateAtWords</code>, <code>labelEnd</code>), the open list is as wide as its longest row, and the full text is the tooltip.
        </li>
        <li>
          <strong>It applies as you choose.</strong> No Apply button; the table follows each field (section 1.9, item 2).
        </li>
        <li>
          <strong>The fields are the design system&apos;s</strong> and are drawn as in a form: a label above, the same size. A date is the date field
          with a calendar (section 2.11), empty to start.
        </li>
        <li>
          <strong>Content first.</strong> The card stays (section 4.6); nothing else is added between the tabs and the table.
        </li>
      </ol>

      <h2 className="text-balance">Used by</h2>
      <p className="text-balance">
        Every report on the Reports page. Data Validation Error (project and dataset), Species Detail and Events, Occurrences and Observations (project)
        have Parameters. The others have none and show no button, and so do the sheets of the Flora and Fauna Taxonomy Reports: a sheet&apos;s metadata (a code, a name, a
        family, a date) is the table&apos;s own search and Filter, and the export still writes it above the columns; so is the Consolidated report&apos;s, which is
        a sheet too (ten metadata lines, and Add filters and Add columns), with its project as one more filter. So are the seven administration reports (User, Role, User - Role, Permission, Role - Permission, Notification Config and Control Vocab Detail): a name or an ID is the search, a list or a date is the Filter.
      </p>
    </div>
  );
}
