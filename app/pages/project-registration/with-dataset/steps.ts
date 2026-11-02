import type { SectionId } from "../option-2/sections";

// The steps of Add Project option 2 (the business is considering a dataset upload during project creation, 30 Oct 2026): everything
// the project itself says comes first (Project basics, Data owner, Geographic extent, then Method and details), and the Datasets step
// follows it, so a dataset is checked against what the project says it is (the designer, 2 Nov 2026: a location outside the project's
// scope is an error, which does not stop the project being created, because the corrected dataset can be uploaded later). The sections
// are the same ones option 1 has, in the same order, with "dataset" after Method and details.

export const DATASET_FLOW_STEP_TITLES = ["Project Identification", "Data Collection and Methodology", "Datasets", "Privacy and Restrictions"] as const;

/** Which of the four steps a section belongs to, or null for the closing review. A restriction kind is part of Privacy and Restrictions. */
export function datasetFlowStep(id: SectionId): number | null {
  switch (id) {
    case "basics":
    case "owner":
    case "extent":
      return 1;
    case "method":
      return 2;
    case "dataset":
      return 3;
    case "review":
      return null;
    default:
      return 4;
  }
}

/** Option 1's sections with the Dataset section put in after Method and details. */
export function withDatasetSection(sections: SectionId[]): SectionId[] {
  const at = sections.indexOf("method");
  return [...sections.slice(0, at + 1), "dataset", ...sections.slice(at + 1)];
}
