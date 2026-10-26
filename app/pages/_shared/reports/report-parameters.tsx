"use client";

import type { ReactNode } from "react";
import { Dialog, DialogTrigger } from "react-aria-components";
import { RefreshCcw01, Sliders04 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";

// A report's parameters: what the report is run on, as against what you narrow its rows by. A project, a dataset: inputs the screen is about, which neither
// the table's search nor its Filter can say. They are not drawn above the table, where they took 156px of a 1024px window and left the table 6 rows (the Flora
// Taxonomy Report; the lab that compared the options, /proto/report-controls, was removed once the designer chose this, 15 Oct 2026). They are one button on the
// toolbar's row, between the search and Filter, that opens a popover of the report's own fields, with what is set shown beside it. Pattern:
// /patterns/report-toolbar (CONTRACTS 4.6).
// What the search can find (a code, a name) is the search, and what you choose from a list (a family, a region, a person) or a date is the Filter: neither is a
// parameter, or the report asks for it twice (the Flora Taxonomy Report's sheets had both, and the designer, 15 Oct 2026: "parameters are doubling up").
//   - Only a report that has parameters has the button: a report with none shows no empty control (2.12).
//   - The button's count and the chips beside it say what is set, so the popover can be closed without losing what the report is about. A parameter
//     that is not at its starting value is a chip ("Project: Adelaide Hills"); one that is (All projects) is not.
//   - A parameter that you narrow by (a status, a kind, a person) is a Filter attribute, not a parameter (4.2d: one filter).
// The fields are the design system's own (Select, Input, the date field with a calendar), drawn by the report in one column: a popover of one or two.

export interface ReportParameters {
  /** The report's fields, in the order the screen has them. Draw them as a column of the design system's fields. */
  fields: ReactNode;
  /** What is set, as label and value: a chip for each, and the count on the button. Leave out what is at its starting value. */
  summary: [label: string, value: string][];
  /** Puts every parameter back to its starting value. Left out where there is no such state (a report that is always on one dataset). */
  reset?: () => void;
  /** Draw the fields themselves on the toolbar, to the right of Filter, as dropdowns (each its own design system `Select` with its `label` above it, 256px wide at the least, the row aligned by its foot), in place of the button, its popover and the chips:
   *  what each is set to is what it shows. For the report whose parameters are two linked choices that it is about as a whole (the Data Validation Error Report's project and dataset), designer, 23 Oct 2026.
   *  `summary` and `reset` are not used then. */
  inline?: boolean;
}

/** The Parameters button, the popover of the report's fields and, beside the button, a chip for each parameter that is set. */
export function ParametersPopover({ parameters }: { parameters: ReportParameters }) {
  const { fields, summary, reset } = parameters;
  // An inline report draws its fields on the toolbar itself (`DataReport`), not as a button.
  if (parameters.inline) return null;
  return (
    <>
      <DialogTrigger>
        <Button color="secondary" size="sm" iconLeading={Sliders04} className="shrink-0">
          Parameters
          {summary.length > 0 ? <span className="ml-1 text-brand-secondary tabular-nums">{summary.length}</span> : null}
        </Button>
        <Popover size="auto" placement="bottom start" className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
          <Dialog aria-label="Report parameters" className="flex flex-col outline-hidden">
            <div className="p-4">{fields}</div>
            {reset ? (
              <div className="flex justify-end border-t border-secondary px-4 py-3">
                <Button color="tertiary" size="sm" iconLeading={RefreshCcw01} isDisabled={summary.length === 0} onPress={reset}>
                  Reset
                </Button>
              </div>
            ) : null}
          </Dialog>
        </Popover>
      </DialogTrigger>
      {summary.map(([label, value]) => (
        <Badge key={label} color="gray" size="md" className="max-w-64 shrink-0">
          <span className="truncate" title={`${label}: ${value}`}>
            {label}: {value}
          </span>
        </Badge>
      ))}
    </>
  );
}
