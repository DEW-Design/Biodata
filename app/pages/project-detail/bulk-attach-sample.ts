import { CFB } from "xlsx";
import { sampleFile, sampleWorkbook } from "@/app/_prototype-tools/sample-files";
import { dataLicenceOptions } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { attachableFields, SHEET_ATTACHMENTS, type TemplateProject } from "./bulk-attachments";
import type { SurveyRecord } from "./survey-data";

// The "Upload attachments" modal's sample, for the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts): a zip of a filled-in template and the files it names, the way the modal asks for it.
// The template's rows point at the project's own records and concepts (the records the modal reads, and each concept's Concept ID),
// so every row the modal reads comes out Ready and Attach works straight away. It is a real zip and a real workbook, so the
// modal reads it as it reads a person's.
//
// It answers the fullest branch (the designer, 10 Nov 2026): rows for an image, a PDF and a web link, with a title, description,
// date, creator and licence on each. Honest (CONTRACTS 0.3): the names start with "sample-", the people are placeholders, and
// the link goes to example.com, which is reserved for examples.

const SAMPLE_FILES = [
  { name: "sample-site-photo.png", kb: 64, title: "Looking across the site", description: "A photo of the site, taken for the sample." },
  { name: "sample-survey-report.pdf", kb: 96, title: "Survey report", description: "The report written up after the survey, for the sample." },
] as const;

export async function sampleAttachmentFiles(project: TemplateProject, records: SurveyRecord[]): Promise<File[]> {
  // Up to three different places for an attachment: a different record each, and on it the concept that is most naturally documented by a file
  // (a description or a comment), else its first.
  const places = records
    .flatMap((record) => {
      const fields = attachableFields(record);
      const field = fields.find((f) => /description|comment/i.test(f.label)) ?? fields[0];
      return field ? [{ record, field }] : [];
    })
    .slice(0, 3);
  const licence = dataLicenceOptions.find((o) => o.id === "ccby")?.label ?? "";
  const headings = ["Project ID", "Record ID", "Concept ID", "File name", "Link address", "Title", "Description", "Created", "Creator", "Licence"];
  const rows = places.map(({ record, field }, i) => {
    const file = SAMPLE_FILES[i];
    return file
      ? [project.code, record.code, field.fieldId, file.name, "", file.title, file.description, "10/11/2026", "Olivia Wyatt", licence]
      : [project.code, record.code, field.fieldId, "", "https://example.com/sample-survey-notes", "Survey notes", "A web page of notes, for the sample.", "10/11/2026", "Phoenix Baker", licence];
  });
  const template = await sampleWorkbook("sample-attachments-template.xlsx", { [SHEET_ATTACHMENTS]: [headings, ...rows] });

  const zip = CFB.utils.cfb_new();
  CFB.utils.cfb_del(zip, "\u0001Sh33tJ5");
  const add = async (file: File) => CFB.utils.cfb_add(zip, file.name, new Uint8Array(await file.arrayBuffer()));
  await add(template);
  for (const file of SAMPLE_FILES.slice(0, Math.max(0, places.length))) await add(sampleFile(file.name, file.kb));
  const bytes = CFB.write(zip, { fileType: "zip", type: "array" }) as Uint8Array;
  return [new File([bytes as BlobPart], "sample-attachments.zip", { type: "application/zip" })];
}
