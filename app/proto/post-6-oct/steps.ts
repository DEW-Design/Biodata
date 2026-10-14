// The subtraction steps for /proto/post-6-oct (designer, 12 Oct 2026: "we're in proto so show me the variations, show me the
// process of subtractions"). The Prototype tools bar's "Subtraction" control moves through them, and each step keeps everything the
// steps before it removed, so stepping from 0 to 5 is the lab being simplified one thing at a time, on the same real content.
// The direction is Linear's (Mobbin, 12 Oct 2026): no page titles on lists, almost no rules or borders, compact rows, one text size.
// The step is in the address (`?step=`), so a role change keeps it and a step can be linked.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

export interface Step {
  id: number;
  label: string;
  short: string;
  /** What this step takes away (and, where it has to, what takes its place), shown under its name in the tools menu. */
  description: string;
}

export const STEPS: Step[] = [
  { id: 0, label: "0: Today", short: "0", description: "The lab as it stands: dividers, legal rows, a tab strip, a title on every list, tables, a sheet on the project" },
  { id: 1, label: "1: Quiet rail", short: "1", description: "Removes the dividers and the legal rows; sections sit under quiet headings and the admin ones fold away" },
  { id: 2, label: "2: Chrome out of the way", short: "2", description: "Removes the tab strip until a second tab exists, the Home crumb, and the 40px above the panel; the bell joins the account row" },
  { id: 3, label: "3: Headers go", short: "3", description: "Removes every list's title, count, subtitle and rule, and Home's banner; the breadcrumb is the title" },
  { id: 4, label: "4: Grouped rows", short: "4", description: "Removes the table header, row borders and pagination; Projects, DLA, DSA and Nominations become rows grouped by status" },
  { id: 5, label: "5: Project like Linear", short: "5", description: "Removes the sheet, the rules, On this page and the view pill; adds a property line, tabs and a Properties rail" },
];

export const STEP_PARAM = "step";

export function parseStep(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < STEPS.length ? n : 0;
}
