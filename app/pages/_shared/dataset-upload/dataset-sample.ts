import { sampleFile, sampleWorkbook } from "@/app/_prototype-tools/sample-files";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { emptyAcknowledgement, type Acknowledgement } from "@/app/pages/_shared/dataset-upload/acknowledgement-rows";

// The sample answers and files of a dataset upload, for the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts). Shared by the Upload dataset form and the Datasets step of Add Project option 2, which ask the
// same questions (acknowledgement-rows.tsx) and take the same files, so the two cannot drift apart (CONTRACTS 0.9).
//
// It answers the fullest branch (the designer, 10 Nov 2026): First Nations "Authorised Open Data under IIA clearance", which opens the approving
// authority question, and a workbook with columns the controlled vocabularies do not have, which opens the Custom concepts section of the upload
// form. A PDF goes in beside the workbook, so a structured and an unstructured file are both shown.
//
// Honest (CONTRACTS 0.3): the species are the first two birds in the build's own species list (the ones the sample project targets), the file names
// start with "sample-", the sites carry the names of places in the sample project, and no reference or clearance number is made up: the approving
// authority is said to be a placeholder.

const birds = () => REGISTRATION_SPECIES.filter((s) => s.group === "Bird").slice(0, 2);

export const SAMPLE_WORKBOOK_NAME = "sample-coorong-bird-survey.xlsx";
export const SAMPLE_NOTES_NAME = "sample-site-notes.pdf";

/** The answers of the acknowledgement: the open licence and the First Nations answer that asks for an approving authority. */
export function sampleAcknowledgement(): Acknowledgement {
  return {
    ...emptyAcknowledgement,
    licence: "ccby",
    firstNations: "authorised",
    iiaReference: "Sample approving authority (placeholder, not a real clearance)",
    privacyConfirmed: true,
  };
}

/** A real workbook of Site, Visit and Species tabs, with two columns (Water salinity and Tide state) that are not in the controlled vocabularies, which the form flags as custom concepts, and a PDF. */
export async function sampleDatasetFiles(): Promise<File[]> {
  const [first, second] = birds();
  const workbook = await sampleWorkbook(SAMPLE_WORKBOOK_NAME, {
    Site: [
      ["Site Name", "Latitude", "Longitude"],
      ["Coorong north lagoon", -35.7, 139.1],
      ["Coorong south lagoon", -35.95, 139.45],
    ],
    Visit: [
      ["Visit Name", "Site Name", "Start Date", "Observer 1"],
      ["Spring count, north lagoon", "Coorong north lagoon", "2026-09-12", "Olivia Wyatt"],
      ["Spring count, south lagoon", "Coorong south lagoon", "2026-09-13", "Phoenix Baker"],
    ],
    Species: [
      ["Visit Name", "Scientific Name", "Common Name", "Number Observed", "Water salinity (ppt)", "Tide state"],
      ["Spring count, north lagoon", first?.species ?? "", first?.commonName ?? "", 12, 38, "Low"],
      ["Spring count, north lagoon", second?.species ?? "", second?.commonName ?? "", 4, 38, "Low"],
      ["Spring count, south lagoon", first?.species ?? "", first?.commonName ?? "", 7, 62, "Rising"],
    ],
  });
  return [workbook, sampleFile(SAMPLE_NOTES_NAME, 72)];
}
