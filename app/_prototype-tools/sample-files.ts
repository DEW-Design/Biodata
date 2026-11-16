"use client";

// Sample files for the Pre-fill sample content switch (`useSampleContent`, sample-content.ts), so a form that asks for an attachment or a dataset can be
// shown filled. Scaffold (CONTRACTS 1.5, 3.8): it previews a form, it is not product.
//
// Honest (CONTRACTS 0.3): each file is named "sample-..." so no one takes it for a real submission, and carries no real data. A form keeps only a file's
// name and size, never its contents, so a PDF, an image or a Word file is a block of bytes of a believable size. A spreadsheet is the exception: the
// upload reads its headings, so `sampleWorkbook` writes a real workbook (SheetJS, loaded when it is needed) from the rows it is given.

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

/** A file of `kb` kilobytes with the right type for its extension, for a form that keeps a file's name and size. */
export function sampleFile(name: string, kb = 48): File {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const bytes = new Uint8Array(kb * 1024);
  bytes.fill(32);
  return new File([bytes], name, { type: TYPES[ext] ?? "application/octet-stream" });
}

/** A real workbook, one sheet per key, each a grid of rows (the first is the headings), for a form that reads the sheet. */
export async function sampleWorkbook(name: string, sheets: Record<string, (string | number)[][]>): Promise<File> {
  const { utils, write } = await import("xlsx");
  const book = utils.book_new();
  for (const [sheet, rows] of Object.entries(sheets)) utils.book_append_sheet(book, utils.aoa_to_sheet(rows), sheet);
  const bytes = write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([bytes], name, { type: TYPES.xlsx });
}

/** The supporting files most forms are shown with: a report and a photo. */
export const sampleEvidenceFiles = (): File[] => [sampleFile("sample-report.pdf", 96), sampleFile("sample-site-photo.png", 64)];
