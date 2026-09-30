// The ingestion of an uploaded dataset, simulated. There is no server: this stands in for the slow
// step ("go through the data model, map it against the structure, then spit out the tree") so the
// project page can show its progress. Nothing here reads a real file. It is shared by the project
// page's ingestion chip and the /proto/dataset-ingestion lab.
//
// Progress is derived from elapsed time (`viewAt`), never counted by a timer, so it survives a
// re-render, a navigation and a reload: a dataset stores when its run started and what it will end in.

// The three things the designer named. Reading the file is folded into the first: it is the quick
// part, and three stages fit the task card's three-column progress.
export const STAGES = [
  { id: "model", label: "Checking against the data model", weight: 0.25 },
  { id: "map", label: "Mapping to the project's structure", weight: 0.45 },
  { id: "tree", label: "Building the records tree", weight: 0.3 },
] as const;

/** How long the whole ingestion takes, at normal speed. */
export const TOTAL_MS = 30_000;

// How a run ends. "success" adds everything; "partial" adds what it could and lists the rows it could
// not place; the three "fail-" outcomes stop at one stage and add NOTHING (an ingestion is all or
// nothing unless only some rows are the problem), so the project is exactly as it was.
export type Outcome = "success" | "partial" | "fail-model" | "fail-map" | "fail-save";

/** Where each failing outcome stops: which stage, and how far through it (0 to 1). */
const FAILURES: Record<Extract<Outcome, `fail-${string}`>, { stage: number; at: number }> = {
  "fail-model": { stage: 0, at: 0.8 },
  "fail-map": { stage: 1, at: 0.6 },
  "fail-save": { stage: 2, at: 0.35 },
};

/** What is being ingested: the file, its size in rows, and the project it goes into. */
export interface IngestionSubject {
  fileName: string;
  /** Rows in the file. The real files are not read, so this is simulated from their size. */
  rows: number;
  projectCode: string;
}

/** A believable row count from a file's size in bytes (a spreadsheet row is roughly 64 bytes). */
export function rowsFromSize(bytes: number): number {
  return Math.max(24, Math.round(bytes / 64));
}

/** With problems ("partial"), this many rows cannot be placed. */
export const unmappedRowsFor = (rows: number) => Math.max(3, Math.round(rows * 0.15));

/** Why an ingestion did not add everything. `file` is the person's to fix; `system` is ours: retry. */
export interface Reason {
  id: string;
  kind: "file" | "system";
  title: string;
  /** Which file, sheet and rows. Empty when the problem isn't in the file. */
  where: string;
  /** What to do about it, in one sentence. */
  fix: string;
}

// ILLUSTRATIVE: real validation is not built yet (it is next). These reasons are shaped by the data
// model and the BDBSA export research (Survey Number, Zone, Easting and Northing, visit dates, species
// codes) so the states can be judged, and must be replaced by what the real checks produce.
export function reasonsFor(outcome: Exclude<Outcome, "success">, subject: IngestionSubject): Reason[] {
  const { fileName, rows, projectCode } = subject;
  const unmapped = unmappedRowsFor(rows);
  switch (outcome) {
    case "partial":
      return [
        {
          id: "species-code",
          kind: "file",
          title: `${unmapped} rows couldn't be placed`,
          where: `${fileName}, sheet Species, rows ${rows - unmapped + 1} to ${rows}`,
          fix: `The species code isn't in the taxonomy. Correct those rows and upload them as a new file; the other ${rows - unmapped} rows are already added.`,
        },
      ];
    case "fail-model":
      return [
        {
          id: "columns",
          kind: "file",
          title: "Required columns are missing",
          where: `${fileName}, sheet Visit`,
          fix: "Zone, Easting and Northing aren't in the file. Add them and upload again.",
        },
        {
          id: "template",
          kind: "file",
          title: "This isn't the current template",
          where: `${fileName}, sheet Species`,
          fix: "The column headings don't match template version 2. Download the latest template and copy your rows across.",
        },
      ];
    case "fail-map":
      return [
        {
          id: "survey",
          kind: "file",
          title: "The Survey Number doesn't match this project",
          where: `${fileName}, every row`,
          fix: `The rows carry Survey Number 1211, but this project is ${projectCode}. Check you are adding to the right project, or correct the number.`,
        },
        {
          id: "dates",
          kind: "file",
          title: "Visit dates fall outside the project",
          where: `${fileName}, rows 1 to ${Math.min(12, rows)}`,
          fix: "These visits are dated before the project started. Correct the dates or the project's start date.",
        },
      ];
    case "fail-save":
      return [
        {
          id: "save",
          kind: "system",
          title: "We couldn't save your records",
          where: "",
          fix: "Something went wrong on our side. Try again; if it keeps failing, contact BioData support.",
        },
      ];
  }
}

/** Where on the 0 to 1 line the run stops: the end, or the point in a stage where it fails. */
export function endOf(outcome: Outcome): number {
  if (outcome === "success" || outcome === "partial") return 1;
  const { stage, at } = FAILURES[outcome];
  return STAGES.slice(0, stage).reduce((n, st) => n + st.weight, 0) + STAGES[stage].weight * at;
}

/** Milliseconds of ingestion done by the time the run stops (the cap on elapsed time). */
export const runLengthMs = (outcome: Outcome) => endOf(outcome) * TOTAL_MS;

export interface RunView {
  subject: IngestionSubject;
  /** 0 to 1 over the whole ingestion. */
  overall: number;
  /** 0-based index of the stage in motion (the last one once done). */
  stageIndex: number;
  /** One percent per stage in the task card's own convention: 0 upcoming, 100 done, in between = current. */
  stagePercents: number[];
  done: boolean;
  rowsMapped: number;
  /** Known once mapping has finished. */
  unmapped: number;
  /** 0 to 1 through the last stage. */
  treeProgress: number;
  outcome: Outcome;
  /** Some rows were added and some were not. */
  partial: boolean;
  /** The run stopped and added nothing. Only true once it has stopped. */
  failed: boolean;
  /** The stage it stopped at, once failed. */
  failedStage: number | null;
  /** Real seconds until the run ends at the given speed; 0 once done. */
  secondsLeft: number;
  /** Why not everything was added, once done. Empty on success. */
  reasons: Reason[];
}

/** The state of a run `elapsedMs` of ingestion in (already capped by the caller or not; it is capped here). */
export function viewAt(outcome: Outcome, elapsedMs: number, subject: IngestionSubject, speed = 1): RunView {
  const end = endOf(outcome);
  const overall = Math.min(end * TOTAL_MS, elapsedMs) / TOTAL_MS;
  // Compared with a little slack: summing stage weights in floating point can land a hair under the
  // cap and leave a finished run "in progress".
  const done = overall >= end - 1e-9;
  const failing = outcome.startsWith("fail-");
  const failedStage = failing && done ? FAILURES[outcome as keyof typeof FAILURES].stage : null;
  let start = 0;
  let stageIndex = STAGES.length - 1;
  const stagePercents = STAGES.map((stage, i) => {
    const stageEnd = start + stage.weight;
    const fraction = Math.min(1, Math.max(0, (overall - start) / stage.weight));
    if (overall >= start && overall < stageEnd) stageIndex = i;
    start = stageEnd;
    if (fraction >= 1) return 100;
    if (fraction <= 0) return 0;
    return Math.min(99, Math.max(1, Math.round(fraction * 100)));
  });
  const mappingDone = stagePercents[1] === 100;
  return {
    subject,
    overall,
    stageIndex,
    stagePercents,
    done,
    rowsMapped: Math.round(subject.rows * (stagePercents[1] / 100)),
    unmapped: outcome === "partial" && mappingDone ? unmappedRowsFor(subject.rows) : 0,
    treeProgress: stagePercents[2] / 100,
    outcome,
    partial: outcome === "partial",
    failed: failedStage !== null,
    failedStage,
    secondsLeft: done ? 0 : Math.max(0, (end * TOTAL_MS - overall * TOTAL_MS) / speed / 1000),
    reasons: done && outcome !== "success" ? reasonsFor(outcome as Exclude<Outcome, "success">, subject) : [],
  };
}
