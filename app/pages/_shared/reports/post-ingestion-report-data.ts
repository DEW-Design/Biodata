// The Project Dataset Post Ingestion report: the same ledger of dataset submissions as the Data Ingestion
// Report, carrying the PROJECT's own facts beside each submission (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk
// node 1503:7729, with 28 columns; its Columns list is node 1510:15114).
//
// A row is an `IngestionRow` (ingestion-report-data.ts) joined to its project, so this report and the first one can
// never disagree about a submission. Where each project fact comes from:
//   - title, description, status and its colour: the project list (`projects`);
//   - start date and end date: the project event Explore searches (`searchEvents`), where an end date that is a dash
//     means the project has none (`hasEndDate`), and the cell is then left empty;
//   - restriction, embargo type and sensitive type: the project's restrictions as registered. Only Adelaide Hills
//     Bushland Survey has a hand-written registration; every other project is built from Explore's data and carries no
//     restrictions at all (`seedFromExplore` gives them `initialRestrictions()`), so for them the three cells are empty
//     rather than an invented "No";
//   - method and dataset type: the template the file was checked against (`datasetTemplates`).

import { ADELAIDE_HILLS_ID, adelaideHillsSeed } from "@/app/pages/project-detail/project-seed";
import { EMBARGO_TYPE_OPTIONS } from "@/app/pages/project-registration/data";
import type { RestrictionTypeKey, RestrictionsState } from "@/app/pages/project-registration/types";
import { projects } from "@/app/pages/_shared/project-list-data";
import { hasEndDate, searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { datasetTemplates } from "@/app/pages/_shared/template-finder/template-data";
import type { BadgeColor } from "@/components/base/badges/badges";
import type { IngestionRow } from "@/app/pages/_shared/reports/ingestion-report-data";

export interface PostIngestionRow extends IngestionRow {
  projectDescription: string;
  projectStatusColor: BadgeColor<"pill-color">;
  /** ISO day, or empty when the project has none recorded. */
  projectStart: string;
  /** ISO day, or empty when the project has no end date. */
  projectEnd: string;
  /** "Yes" when the project is restricted, empty when the app holds no restriction data for it. */
  restriction: string;
  embargoType: string;
  sensitiveType: string;
  method: string;
  datasetType: string;
}

// What each kind of restriction is called in the "Sensitive type" column: what the restriction protects. An embargo has
// its own column, so it is not repeated here.
const SENSITIVE_LABELS: Partial<Record<RestrictionTypeKey, string>> = {
  species: "Species",
  locations: "Locations",
  metadata: "Project metadata",
  other: "Other",
};

interface ProjectFacts {
  description: string;
  statusColor: BadgeColor<"pill-color">;
  start: string;
  end: string;
  restriction: string;
  embargoType: string;
  sensitiveType: string;
}

function restrictionsOf(projectId: string): RestrictionsState | null {
  return projectId === ADELAIDE_HILLS_ID ? adelaideHillsSeed.project.restrictions : null;
}

function embargoLabels(restrictions: RestrictionsState): string {
  if (!restrictions.enabledTypes.has("embargo")) return "";
  return restrictions.embargo.types
    .map((t) => (t === "other" && restrictions.embargo.typeOther ? restrictions.embargo.typeOther : (EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label ?? "")))
    .filter(Boolean)
    .join(", ");
}

function sensitiveLabels(restrictions: RestrictionsState): string {
  return (Object.keys(SENSITIVE_LABELS) as RestrictionTypeKey[])
    .filter((key) => restrictions.enabledTypes.has(key))
    .map((key) => SENSITIVE_LABELS[key])
    .join(", ");
}

const factsByProject = new Map<string, ProjectFacts>();
function factsFor(projectId: string): ProjectFacts {
  let facts = factsByProject.get(projectId);
  if (facts) return facts;
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const event = searchEvents.find((e) => e.id === project.id && e.type === "Project");
  const restrictions = restrictionsOf(project.id);
  facts = {
    description: project.description,
    statusColor: project.statusColor,
    start: event?.startDate ?? "",
    end: event && hasEndDate(event.endDate) ? event.endDate : "",
    restriction: restrictions ? (restrictions.hasRestrictions ? "Yes" : "No") : "",
    embargoType: restrictions ? embargoLabels(restrictions) : "",
    sensitiveType: restrictions ? sensitiveLabels(restrictions) : "",
  };
  factsByProject.set(projectId, facts);
  return facts;
}

/** A submission with its project's facts beside it. */
export function withProjectFacts(row: IngestionRow): PostIngestionRow {
  const facts = factsFor(row.projectId);
  const template = datasetTemplates.find((t) => t.title === row.template);
  return {
    ...row,
    projectDescription: facts.description,
    projectStatusColor: facts.statusColor,
    projectStart: facts.start,
    projectEnd: facts.end,
    restriction: facts.restriction,
    embargoType: facts.embargoType,
    sensitiveType: facts.sensitiveType,
    method: template?.collectionMethod ?? "",
    datasetType: template?.speciesType ?? row.templateType,
  };
}

// ── Display ──
// A day in Adelaide, for "Ingested on": the wireframe's column is a date, and the review and approval columns beside it
// are days too. The row's own `at` still carries the time, for sorting.
const dayInAdelaide = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Adelaide" });
export const formatAdelaideDay = (ms: number) => dayInAdelaide.format(ms);
