// Bulk upload of attachments and web links (designer, 25 Oct 2026). A person downloads the project's own template,
// fills one row per file or link (which record and which field it belongs to, then the details the artefact viewer
// shows), zips the files with the filled-in template, and adds the zip. Each row is checked and the ready ones are
// attached to their fields, as "Add attachment" and "Add web link" do one at a time (record-quick-actions.tsx).
//
// The template is made for one project, so it carries that project's IDs: a "Records and fields" sheet lists every
// event, occurrence and observation with each field a file can document and its Field ID, and the Record ID and
// Field ID columns are dropdowns of those values. That is how a person gets a Field ID: they never type one blind.
//
// A Field ID is the field's section and label, as words: "location.reliability", "voucher.voucher-images". It is the
// same on every record of a type, so a row can be copied down.
//
// The workbook is written by hand (SpreadsheetML in a zip, through SheetJS's CFB) because the community SheetJS
// build writes no styles, frozen rows or dropdowns. The upload is read with SheetJS. Nothing leaves the browser.

import { CFB, read as readWorkbook, utils as sheetUtils, SSF } from "xlsx";
import { dataLicenceOptions, type DataLicence } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { sectionFieldEntries } from "./field-visibility-store";
import { takesNotes } from "./field-notes";
import { kindForFile, type FieldFileKind, type FileMeta, type NotesMap } from "./field-notes-store";
import { KIND_LABEL } from "./record-inspector";
import type { SurveyRecord } from "./survey-data";

// ---------------------------------------------------------------------------------------------------------------
// Field IDs

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The Field ID for a field key (`section:label`). */
export function fieldIdFor(key: string): string {
  const i = key.indexOf(":");
  return `${key.slice(0, i)}.${slug(key.slice(i + 1))}`;
}

export interface AttachableField {
  key: string;
  fieldId: string;
  label: string;
  section: string;
}

/** The fields of a record a file or link can be attached to (the same list as "Add attachment" offers). */
export function attachableFields(record: SurveyRecord): AttachableField[] {
  return record.sections.flatMap((s) =>
    sectionFieldEntries(s)
      .filter((f) => takesNotes(f.label))
      .map((f) => ({ key: f.key, fieldId: fieldIdFor(f.key), label: f.label, section: s.title })),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// The template's columns

export const SHEET_ATTACHMENTS = "Attachments";
const SHEET_START = "Start here";
const SHEET_FIELDS = "Records and concepts";
const SHEET_LISTS = "Lists";

type ColumnId =
  | "project"
  | "record"
  | "field"
  | "file"
  | "link"
  | "title"
  | "description"
  | "created"
  | "creator"
  | "licence"
  | "publisher"
  | "rightsHolder";

/** The Attachments sheet, left to right. A required column's header is shaded; one that is always required also has a "*"
 *  (File name and Link address are one or the other, so they are shaded without one). */
const COLUMNS: { id: ColumnId; header: string; hint: string; width: number; required?: boolean; oneOf?: boolean }[] = [
  { id: "project", header: "Project ID", hint: "Required. Filled in for you.", width: 14, required: true },
  { id: "record", header: "Record ID", hint: "Required. The event, occurrence or observation. Pick from the list.", width: 18, required: true },
  { id: "field", header: "Concept ID", hint: "Required. The concept it documents. Pick from the list, or see Records and concepts.", width: 30, required: true },
  { id: "file", header: "File name", hint: "Required for a file: its exact name in the zip, with its extension.", width: 30, required: true, oneOf: true },
  { id: "link", header: "Link address", hint: "Required for a web link, in place of a file: the full address, starting https://.", width: 34, required: true, oneOf: true },
  { id: "title", header: "Title", hint: "Optional. A fuller title. The file name is used if empty.", width: 30 },
  { id: "description", header: "Description", hint: "Optional. What it shows or records.", width: 40 },
  { id: "created", header: "Created", hint: "Optional. The date it was made, as DD/MM/YYYY.", width: 14 },
  { id: "creator", header: "Creator", hint: "Optional. Who made it.", width: 22 },
  { id: "licence", header: "Licence", hint: "Optional. Pick from the list. CC-BY if empty.", width: 30 },
  { id: "publisher", header: "Publisher", hint: "Optional. The project's publisher if empty.", width: 26 },
  { id: "rightsHolder", header: "Rights holder", hint: "Optional. The publisher if empty.", width: 26 },
];
/** Rows given a Project ID and the dropdowns. More can be added by copying a row down. */
const TEMPLATE_ROWS = 500;
const FIRST_DATA_ROW = 3;

// ---------------------------------------------------------------------------------------------------------------
// Writing the template

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const colName = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : colName(Math.floor(i / 26) - 1) + colName(i % 26));

// Cell styles, by their index in styles.xml below.
const S = { plain: 0, headRequired: 1, headOptional: 2, hint: 3, date: 4, title: 5, wrap: 6, bold: 7 } as const;
type Cell = string | number | null | { v: string | number; s: number };

function rowXml(r: number, cells: Cell[], height?: number) {
  const body = cells
    .map((c, i) => {
      if (c === null || c === "") return "";
      const ref = `${colName(i)}${r}`;
      const { v, s } = typeof c === "object" ? c : { v: c, s: S.plain };
      const style = s ? ` s="${s}"` : "";
      return typeof v === "number"
        ? `<c r="${ref}"${style}><v>${v}</v></c>`
        : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    })
    .join("");
  return `<row r="${r}"${height ? ` ht="${height}" customHeight="1"` : ""}>${body}</row>`;
}

function sheetXml(o: {
  rows: Cell[][];
  widths: number[];
  /** Freeze the rows above this one. */
  freezeRow?: number;
  autoFilter?: string;
  validations?: string[];
  colStyles?: Record<number, number>;
  heights?: Record<number, number>;
  selected?: boolean;
}) {
  const view = o.freezeRow
    ? `<sheetView workbookViewId="0"${o.selected ? ' tabSelected="1"' : ""}><pane ySplit="${o.freezeRow - 1}" topLeftCell="A${o.freezeRow}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="B${o.freezeRow}" sqref="B${o.freezeRow}"/></sheetView>`
    : `<sheetView workbookViewId="0"${o.selected ? ' tabSelected="1"' : ""}/>`;
  const cols = o.widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"${o.colStyles?.[i] ? ` style="${o.colStyles[i]}"` : ""}/>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetViews>${view}</sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols>` +
    `<sheetData>${o.rows.map((cells, i) => rowXml(i + 1, cells, o.heights?.[i + 1])).join("")}</sheetData>` +
    (o.autoFilter ? `<autoFilter ref="${o.autoFilter}"/>` : "") +
    (o.validations?.length ? `<dataValidations count="${o.validations.length}">${o.validations.join("")}</dataValidations>` : "") +
    `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`
  );
}

const listValidation = (sqref: string, source: string, title: string, message: string) =>
  `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorStyle="warning" errorTitle="${esc(title)}" error="${esc(message)}" sqref="${sqref}"><formula1>${source}</formula1></dataValidation>`;

// Fills and text colours from the DS - Foundations primitives (contracts/figma-colours.json), as Excel's ARGB:
// brand-100 dcecef (required headers), gray-100 f2f2f1 (optional headers), gray-50 f8f8f7 (the hint row),
// gray-200 e5e4e2 (header rule), gray-600 706b68 (hint text), gray-900 2e2925 (text).
const STYLES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>` +
  `<fonts count="4">` +
  `<font><sz val="11"/><color rgb="FF2E2925"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FF2E2925"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><i/><sz val="10"/><color rgb="FF706B68"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="14"/><color rgb="FF2E2925"/><name val="Calibri"/><family val="2"/></font>` +
  `</fonts>` +
  `<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFDCECEF"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F1"/><bgColor indexed="64"/></patternFill></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF8F8F7"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left/><right/><top/><bottom style="thin"><color rgb="FFE5E4E2"/></bottom><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="8">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
  `<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
  `<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

export interface TemplateProject {
  code: string;
  name: string;
  publisher: string;
}

const kindLabel = (r: SurveyRecord) => KIND_LABEL[r.kind];

/** The project's bulk upload template, as an .xlsx file's bytes. */
export function buildAttachmentTemplate(project: TemplateProject, records: SurveyRecord[]): Uint8Array {
  const byId = new Map(records.map((r) => [r.id, r]));
  const fieldsOf = records.map((r) => ({ record: r, fields: attachableFields(r) }));
  const fieldIds = [...new Set(fieldsOf.flatMap((x) => x.fields.map((f) => f.fieldId)))].sort();
  const codes = records.map((r) => r.code);
  const example = fieldsOf.find((x) => x.fields.length > 0);
  const exampleField = example?.fields.find((f) => f.label === "Description") ?? example?.fields[0];
  const last = FIRST_DATA_ROW + TEMPLATE_ROWS - 1;

  // Start here: what the template is for and how to fill it, in the order a person does it.
  const start: Cell[][] = [
    [{ v: `Upload attachments to ${project.name} (${project.code})`, s: S.title }],
    [{ v: "Use this template to attach many files and web links to the project's records at once. Only this template is read.", s: S.wrap }],
    [],
    [{ v: "How to use it", s: S.bold }],
    [{ v: "1. On the Attachments sheet, add one row for each file or web link.", s: S.wrap }],
    [{ v: "2. Say where it belongs: the Record ID (an event, occurrence or observation) and the Concept ID (the concept it documents). Both are dropdowns. The Records and concepts sheet lists every record in this project with its concepts and their IDs.", s: S.wrap }],
    [{ v: "3. For a file, type its exact name in File name. For a web link, put the address in Link address instead.", s: S.wrap }],
    [{ v: "4. Add the details you know: title, description, date created, creator, licence. They are shown with the attachment.", s: S.wrap }],
    [{ v: "5. Save this template, then put it in one zip file with the files it names. The zip can hold folders.", s: S.wrap }],
    [{ v: `6. On the project page, choose Upload, then Upload attachments, and add the zip. A template with web links only can be added without a zip.`, s: S.wrap }],
    [{ v: "7. Every row is checked before anything is attached. Fix any row marked To fix and add the zip again: rows already attached are skipped.", s: S.wrap }],
    [],
    [{ v: "Example row", s: S.bold }],
    ...(example && exampleField
      ? [
          [`A photo of ${example.record.name}, documenting its ${exampleField.label.toLowerCase()}:`],
          [`Project ID: ${project.code}`],
          [`Record ID: ${example.record.code}`],
          [`Concept ID: ${exampleField.fieldId}`],
          ["File name: site-photo-north.jpg"],
          ["Title: Looking north from the site marker"],
        ]
      : []),
    [],
    [{ v: "Filled in for you", s: S.bold }],
    [{ v: "File type, size, who added it and when, and the artefact's IDs are set when it is attached. Audio and video wait for a BioData Admin to review them.", s: S.wrap }],
    [{ v: "Accepted files: images (JPG, PNG, WEBP, GIF, TIFF, HEIC), PDF, spreadsheets (XLS, XLSX, CSV), audio and video (MP3, WAV, M4A, MP4, MOV).", s: S.wrap }],
  ];

  const attachments: Cell[][] = [
    COLUMNS.map((c) => ({ v: c.required && !c.oneOf ? `${c.header} *` : c.header, s: c.required ? S.headRequired : S.headOptional })),
    COLUMNS.map((c) => ({ v: c.hint, s: S.hint })),
    ...Array.from({ length: TEMPLATE_ROWS }, () => [project.code]),
  ];
  const col = (id: ColumnId) => colName(COLUMNS.findIndex((c) => c.id === id));
  const range = (id: ColumnId) => `${col(id)}${FIRST_DATA_ROW}:${col(id)}${last}`;
  const validations = [
    listValidation(range("project"), "ProjectID", "Project ID", `This template is for ${project.code}.`),
    listValidation(range("record"), "RecordIDs", "Record ID", "Pick a Record ID from the list. The Records and concepts sheet lists them all."),
    listValidation(range("field"), "FieldIDs", "Concept ID", "Pick a Concept ID from the list. The Records and concepts sheet shows which concepts each record has."),
    listValidation(range("licence"), "Licences", "Licence", "Pick a licence from the list."),
    `<dataValidation type="date" operator="greaterThan" allowBlank="1" showErrorMessage="1" errorStyle="warning" errorTitle="Created" error="Enter a date, as DD/MM/YYYY." sqref="${range("created")}"><formula1>1</formula1></dataValidation>`,
  ];

  const fieldRows: Cell[][] = [
    ["Record ID", "Kind", "Type", "Record name", "Parent ID", "Section", "Concept", "Concept ID"].map((h) => ({ v: h, s: S.headOptional })),
    ...fieldsOf.flatMap(({ record, fields }) =>
      fields.map((f) => [record.code, kindLabel(record), record.type, record.name, byId.get(record.parentId ?? "")?.code ?? project.code, f.section, f.label, f.fieldId]),
    ),
  ];

  const lists: Cell[][] = [
    ["Project ID", "Record ID", "Concept ID", "Licence"],
    ...Array.from({ length: Math.max(1, codes.length, fieldIds.length, dataLicenceOptions.length) }, (_, i) => [
      i === 0 ? project.code : null,
      codes[i] ?? null,
      fieldIds[i] ?? null,
      dataLicenceOptions[i]?.label ?? null,
    ]),
  ];
  const listRef = (c: string, n: number) => `'${SHEET_LISTS}'!$${c}$2:$${c}$${Math.max(2, n + 1)}`;

  const sheets = [
    { name: SHEET_START, xml: sheetXml({ rows: start, widths: [120], selected: true }) },
    {
      name: SHEET_ATTACHMENTS,
      xml: sheetXml({
        rows: attachments,
        widths: COLUMNS.map((c) => c.width),
        freezeRow: FIRST_DATA_ROW,
        validations,
        colStyles: { [COLUMNS.findIndex((c) => c.id === "created")]: S.date },
        heights: { 1: 22, 2: 48 },
      }),
    },
    {
      name: SHEET_FIELDS,
      xml: sheetXml({ rows: fieldRows, widths: [12, 13, 15, 36, 12, 22, 34, 36], freezeRow: 2, autoFilter: `A1:H${fieldRows.length}` }),
    },
    { name: SHEET_LISTS, xml: sheetXml({ rows: lists, widths: [14, 14, 34, 30] }), hidden: true },
  ];

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<bookViews><workbookView activeTab="0"/></bookViews><sheets>` +
    sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}"${"hidden" in s ? ' state="hidden"' : ""} r:id="rId${i + 1}"/>`).join("") +
    `</sheets><definedNames>` +
    `<definedName name="_xlnm._FilterDatabase" localSheetId="2" hidden="1">'${SHEET_FIELDS}'!$A$1:$H$${fieldRows.length}</definedName>` +
    `<definedName name="FieldIDs">${listRef("C", fieldIds.length)}</definedName>` +
    `<definedName name="Licences">${listRef("D", dataLicenceOptions.length)}</definedName>` +
    `<definedName name="ProjectID">${listRef("A", 1)}</definedName>` +
    `<definedName name="RecordIDs">${listRef("B", codes.length)}</definedName>` +
    `</definedNames></workbook>`;

  const files: Record<string, string> = {
    "[Content_Types].xml":
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
      `</Types>`,
    "_rels/.rels":
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": workbook,
    "xl/_rels/workbook.xml.rels":
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
    "xl/styles.xml": STYLES,
    ...Object.fromEntries(sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, s.xml])),
  };
  const zip = CFB.utils.cfb_new();
  CFB.utils.cfb_del(zip, "\u0001Sh33tJ5");
  const encoder = new TextEncoder();
  for (const [path, text] of Object.entries(files)) CFB.utils.cfb_add(zip, path, encoder.encode(text));
  return CFB.write(zip, { fileType: "zip", type: "array" }) as Uint8Array;
}

export const templateFileName = (projectCode: string) => `${projectCode} attachments template.xlsx`;

// ---------------------------------------------------------------------------------------------------------------
// Reading an upload

/** One file from the upload: a file dropped as it is, or one taken out of the zip. */
export interface UploadedFile {
  /** The name without its folders. */
  name: string;
  size: number;
  bytes: Uint8Array;
}

// The zip's own clutter: macOS resource forks, Finder files, Office lock files. (SheetJS's CFB also adds a "Sh33tJ5"
// placeholder entry to every zip it reads.)
const isJunk = (path: string) => /(^|\/)(__MACOSX|\.DS_Store)(\/|$)|(^|\/)(~\$|\._)/.test(path);
const baseName = (path: string) => path.split("/").pop() ?? path;

/** Every file in what was dropped, with zips opened. */
export async function expandUpload(dropped: File[]): Promise<UploadedFile[]> {
  const out: UploadedFile[] = [];
  for (const file of dropped) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!/\.zip$/i.test(file.name)) {
      out.push({ name: file.name, size: file.size, bytes });
      continue;
    }
    const zip = CFB.read(bytes, { type: "array" });
    zip.FileIndex.forEach((entry: { type: number; content?: Uint8Array; name: string }, i: number) => {
      const path: string = zip.FullPaths[i].replace(/^Root Entry\//, "");
      if (entry.type !== 2 || !entry.content || path.endsWith("/") || isJunk(path) || /^\u0001?Sh33tJ5$/.test(entry.name)) return;
      out.push({ name: baseName(path), size: entry.content.length, bytes: Uint8Array.from(entry.content) });
    });
  }
  return out;
}

export type RowStatus = "ready" | "attached" | "problem";

export interface CheckedRow {
  /** The row's number in the spreadsheet, as Excel shows it. */
  row: number;
  recordCode: string;
  fieldId: string;
  /** Resolved when the record and field exist. */
  record?: SurveyRecord;
  field?: AttachableField;
  fileName: string;
  url: string;
  file?: UploadedFile;
  kind?: FieldFileKind;
  meta: FileMeta;
  status: RowStatus;
  problems: string[];
}

export interface UploadCheck {
  /** The template that was read, or null when none was found. */
  template: string | null;
  /** Why the upload could not be read at all. */
  error?: string;
  rows: CheckedRow[];
  /** Files in the upload that no row names. */
  unused: string[];
}

const HEADER_FOR: Record<string, ColumnId> = Object.fromEntries(COLUMNS.map((c) => [slug(c.header), c.id]));
const HINT_ROW = COLUMNS[0].hint;
const URL_OK = /^https?:\/\/\S+\.\S+/;

function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

/** A date cell as "25 Oct 2026": Excel's day number, or typed as DD/MM/YYYY or YYYY-MM-DD. Null when it is not a date. */
function toDay(v: unknown): string | null {
  let d: Date | null = null;
  if (typeof v === "number") {
    const p = SSF.parse_date_code(v);
    if (p) d = new Date(p.y, p.m - 1, p.d);
  } else {
    const s = toText(v);
    const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dmy) d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    else if (ymd) d = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function licenceFor(text: string): DataLicence | null {
  const t = slug(text);
  return dataLicenceOptions.find((o) => slug(o.label) === t || o.id === t || slug(o.label).startsWith(t))?.id ?? null;
}

/** Reads the upload's template and checks every row against the project's records and the files that came with it. */
export function checkUpload(files: UploadedFile[], project: TemplateProject, records: SurveyRecord[], notes: NotesMap): UploadCheck {
  const sheets = files.filter((f) => /\.xlsx?$/i.test(f.name));
  // The template is the workbook with an Attachments sheet. Any other spreadsheet is a file to attach.
  let template: UploadedFile | null = null;
  let table: unknown[][] = [];
  for (const f of sheets) {
    try {
      const wb = readWorkbook(f.bytes, { type: "array" });
      const ws = wb.Sheets[SHEET_ATTACHMENTS];
      if (!ws) continue;
      template = f;
      table = sheetUtils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, blankrows: true, defval: null });
      break;
    } catch {
      // Not a readable workbook: it is treated as an ordinary file.
    }
  }
  if (!template) {
    return {
      template: null,
      error: "No attachments template was found. Add the template you downloaded for this project, filled in, with the files.",
      rows: [],
      unused: [],
    };
  }

  const headerAt = table.findIndex((row) => (row ?? []).some((c) => slug(toText(c)) === "record-id"));
  if (headerAt < 0) {
    return { template: template.name, error: "The Attachments sheet has no Record ID column. Download the template again and copy your rows into it.", rows: [], unused: [] };
  }
  const columnOf = new Map<ColumnId, number>();
  (table[headerAt] ?? []).forEach((c, i) => {
    const id = HEADER_FOR[slug(toText(c))];
    if (id && !columnOf.has(id)) columnOf.set(id, i);
  });
  const get = (row: unknown[], id: ColumnId) => {
    const i = columnOf.get(id);
    return i === undefined ? null : row[i];
  };

  const byCode = new Map(records.map((r) => [r.code.toLowerCase(), r]));
  const fieldsByRecord = new Map(records.map((r) => [r.id, attachableFields(r)]));
  const pool = files.filter((f) => f !== template);
  const byName = new Map<string, UploadedFile>();
  pool.forEach((f) => byName.set(f.name.toLowerCase(), f));
  const used = new Set<string>();
  const seen = new Map<string, number>();

  const rows: CheckedRow[] = [];
  table.slice(headerAt + 1).forEach((raw, i) => {
    const row = raw ?? [];
    const rowNumber = headerAt + 2 + i;
    const projectCode = toText(get(row, "project"));
    if (projectCode === HINT_ROW) return;
    const recordCode = toText(get(row, "record"));
    const fieldId = toText(get(row, "field"));
    const fileName = toText(get(row, "file"));
    const url = toText(get(row, "link"));
    const filled = (["record", "field", "file", "link", "title", "description", "created", "creator", "licence", "publisher", "rightsHolder"] as ColumnId[]).some(
      (id) => toText(get(row, id)) !== "",
    );
    // A row with only its Project ID filled in for it is an empty row.
    if (!filled) return;

    const problems: string[] = [];
    if (projectCode && projectCode.toLowerCase() !== project.code.toLowerCase())
      problems.push(`${projectCode} is another project. This one is ${project.code}.`);

    const record = recordCode ? byCode.get(recordCode.toLowerCase()) : undefined;
    if (!recordCode) problems.push("Add the Record ID.");
    else if (!record) problems.push(`No record ${recordCode} in this project.`);

    const fields = record ? fieldsByRecord.get(record.id) ?? [] : [];
    const field = fields.find((f) => f.fieldId === fieldId.toLowerCase());
    if (!fieldId) problems.push("Add the Concept ID.");
    else if (record && !field) problems.push(`${record.code} (${record.type}) has no concept ${fieldId}.`);

    let file: UploadedFile | undefined;
    let kind: FieldFileKind | undefined;
    if (!fileName && !url) problems.push("Add a file name, or a link address for a web link.");
    else if (fileName && url) problems.push("Use either a file name or a link address, not both.");
    else if (fileName) {
      file = byName.get(baseName(fileName).toLowerCase());
      kind = kindForFile(fileName) ?? undefined;
      if (!kind) problems.push(`${fileName} can't be attached. Use an image, PDF, spreadsheet, audio or video file.`);
      else if (!file) problems.push(`${fileName} is not in the zip. Check its name and extension.`);
      if (file) used.add(file.name.toLowerCase());
    } else if (!URL_OK.test(url)) problems.push("Write the link address in full, starting https://");
    else kind = "link";

    const createdRaw = get(row, "created");
    const created = toText(createdRaw) ? toDay(createdRaw) : null;
    if (toText(createdRaw) && !created) problems.push(`Created is not a date. Write it as DD/MM/YYYY.`);
    const licenceText = toText(get(row, "licence"));
    const licence = licenceText ? licenceFor(licenceText) : null;
    if (licenceText && !licence) problems.push(`Licence ${licenceText} is not one of ${dataLicenceOptions.map((o) => o.label).join(" or ")}.`);

    const meta: FileMeta = Object.fromEntries(
      Object.entries({
        title: toText(get(row, "title")),
        description: toText(get(row, "description")),
        created: created ?? "",
        creator: toText(get(row, "creator")),
        licence: licence ?? "",
        publisher: toText(get(row, "publisher")),
        rightsHolder: toText(get(row, "rightsHolder")),
      }).filter(([, v]) => v),
    );

    // The same file or link twice on one field is listed once; one already on the field is skipped, so a corrected
    // zip can be added again without attaching everything twice.
    const name = fileName ? baseName(fileName) : url;
    let status: RowStatus = problems.length ? "problem" : "ready";
    if (record && field && name) {
      const dupKey = `${record.id}|${field.key}|${name.toLowerCase()}`;
      const earlier = seen.get(dupKey);
      const already = notes[record.id]?.[field.key]?.files.some((f) => (f.url ?? f.name).toLowerCase() === name.toLowerCase());
      if (earlier && status === "ready") {
        status = "problem";
        problems.push(`The same ${url ? "link" : "file"} is on row ${earlier} for this concept.`);
      } else if (already && status === "ready") status = "attached";
      if (!earlier) seen.set(dupKey, rowNumber);
    }
    rows.push({ row: rowNumber, recordCode, fieldId, record, field, fileName, url, file, kind, meta, status, problems });
  });

  const unused = pool.filter((f) => !used.has(f.name.toLowerCase())).map((f) => f.name);
  return { template: template.name, rows, unused };
}
