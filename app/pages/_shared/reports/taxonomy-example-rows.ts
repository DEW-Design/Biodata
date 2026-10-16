// The one example record each empty tab of the Flora Taxonomy Report shows (designer, 16 Oct 2026: "In the empty states, can we just add one record. The one
// record could just be mock data."). `DataReport` shows it, marked "Example record", while the tab has no row of its own, and drops it when a real one exists.
// The taxa are the report's sample Flora taxa; the people are the placeholder people (CONTRACTS 0.3); every other value is made up for the example. Nothing
// here is stored, and nothing in Taxonomy Management shows it.

import type { AttributeRow } from "@/app/pages/_shared/reports/taxonomy-herb-attributes-data";
import type { ManagementRow, SynonymRow } from "@/app/pages/_shared/reports/taxonomy-management-data";

const DAY = Date.parse("2026-08-04T12:00:00Z");
const CREATED = Date.parse("2026-10-14T04:10:00Z");

const BLUE_GUM = { nsx: "P01937", common: "South Australian Blue Gum", commonNames: "South Australian Blue Gum" };

export const EXAMPLE_ATTRIBUTE: AttributeRow = {
  id: "example",
  taxonId: "P01937",
  ...BLUE_GUM,
  nsxDescription: "Eucalyptus leucoxylon",
  isCurrent: "Yes",
  isOfficial: "Yes",
  regionGroup: "South Australia",
  regionName: "Southern Lofty",
  attributeGroup: "Life form",
  attributeName: "Growth form",
  source: "",
  dateOfAssessment: "4 Aug 2026",
  comments: "",
  criteria: "",
  trend: "",
  qualityText: "Tree",
  num: "",
  unit: "",
  qualification: "",
  days: ["2026-08-04"],
  latestMs: DAY,
};

const management: Omit<ManagementRow, "id" | "seq" | "speciesName" | "genus" | "species" | "createdBy"> = {
  ...BLUE_GUM,
  family: "Myrtaceae",
  order: "Myrtales",
  majorGroup: "",
  rank1: "",
  infra1: "",
  rank2: "",
  infra2: "",
  rank3: "",
  infra3: "",
  createdOn: "14 Oct 2026, 1:40 pm",
  comments: "",
  modifiedBy: "",
  modifiedOn: "",
  days: ["2026-10-14"],
  createdMs: CREATED,
};

/** A name the Blue Gum was known by. */
export const EXAMPLE_SYNONYM: SynonymRow = {
  ...management,
  id: "example",
  seq: 1,
  speciesName: "Eucalyptus leucoxylon var. exemplaris",
  genus: "Eucalyptus",
  species: "leucoxylon",
  rank1: "var.",
  infra1: "exemplaris",
  createdBy: "",
  createdOn: "4 Aug 2026",
  days: ["2026-08-04"],
  createdMs: DAY,
  synPartly: "",
  questionably: "",
  asMs: "",
  hybrid: "No",
  hybridRank: "",
  hybridFormula: "",
  hybridParent2: "",
  published: "Yes",
  matchesCc: "Yes",
  date: "4 Aug 2026",
  comment: "",
};
