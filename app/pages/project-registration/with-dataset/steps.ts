import type { SectionId } from "../option-2/sections";

// The steps of Add Project option 2 (the business is considering a dataset upload during project creation, 30 Oct 2026): what a
// person has to say themselves comes first (the project's name, its data owner and contacts, and where it is: Project basics, Data
// owner and Geographic extent, the designer's "steps until geographic area"), then the Datasets step, so what it holds can build up
// the rest of the project. The sections are the same ones option 1 has, in the same order, with "dataset" after the geographic extent.

export const DATASET_FLOW_STEP_TITLES = ["Project Identification", "Datasets", "Data Collection and Methodology", "Privacy and Restrictions"] as const;

/** Which of the four steps a section belongs to, or null for the closing review. A restriction kind is part of Privacy and Restrictions. */
export function datasetFlowStep(id: SectionId): number | null {
  switch (id) {
    case "basics":
    case "owner":
    case "extent":
      return 1;
    case "dataset":
      return 2;
    case "method":
      return 3;
    case "review":
      return null;
    default:
      return 4;
  }
}

/** Option 1's sections with the Dataset section put in after the geographic extent. */
export function withDatasetSection(sections: SectionId[]): SectionId[] {
  const at = sections.indexOf("extent");
  return [...sections.slice(0, at + 1), "dataset", ...sections.slice(at + 1)];
}
