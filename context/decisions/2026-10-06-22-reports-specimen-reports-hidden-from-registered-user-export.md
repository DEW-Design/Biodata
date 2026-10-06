# 2026-10-06 - Reports: specimen reports hidden from Registered User, export on every report, start dates open as today

- **Oct 6 2026: Reports: specimen reports hidden from Registered User, export on every report, start dates open as today.** Three
  items from the designer: "[REPORTS] Registered user doesn't see [the Specimens and restrictions cards] but admin does",
  "[ALL DATE FIELDS ACROSS ALL FORMS]: Default to current sys date", "[ALL REPORTS]: Three dot menu to export as CSV, XLSX".
  - **Asked first.** The Registered User did see those three cards (10 reports against the admin's 12), only with fewer rows inside.
    The designer's answer: "Hide those reports for registered users". For dates, "Required and start-type dates only".
  - **Reports hidden.** New feature `specimenReports` (`config/role-access.config.ts`): every role that has Reports except the
    Registered User, and BioData Admin by the bypass. The Project Sensitive and Restriction, Voucher ID Update and SpecimenDB
    Refresh entries carry it in `reports-data.ts`, so the landing, the switcher, Create a report and My reports drop them, and the
    Specimens and restrictions tab goes with them (a Registered User now has 7 reports). Opening an address directly shows "This
    report is not available to your role" (`ReportPage` checks the entry's `feature` for every report, so the Project Audit Log,
    DLA and DSA reports get the same treatment). Screen index, `ref-roles.md` and the landing's header comment updated. Privileged
    User, Privileged Admin and BioData User still see all three: the instruction named Registered Users only.
  - **Export on every report.** `DataReport` now builds Export CSV and Export XLSX in the hero's "..." menu for all 12 reports
    (`exportName`, required; `report-export.tsx`): the rows in view, every column in table order. The old per-report
    `csvExportAction` is gone; the Data Validation Error report's "Map visualise" and downloads moved to `extraActions`. A column
    that has `text` exports that; any other is read from the text its cell shows (`columnText`), so the older reports (Data
    Ingestion, Post Ingestion, the three specimen reports, Data Validation Error) export without a rewrite. Where a cell is a
    component of its own (Data ingestion's Record ID and Download columns, Voucher ID Update's scientific names) the column got an
    explicit `text`. XLSX is a real workbook (`downloadXlsx`, the `xlsx` package, loaded when first used), one sheet "Report".
  - **Dates.** Add Project's start date (`initialProjectDetails`), the DLA request's start date (`emptyDlaDraft`), the DSA's
    "Valid from" (`emptyDsaDraft`) and a voucher change's date now open as today. The vocabulary, user and notification forms
    already did. End dates, expiries, the embargo end, the filter ranges and the optional "Keep until" stay empty, and editing a
    record keeps what it holds (the project seed overrides the default). CONTRACTS 2.11 now says so, and 4.6 item 4 names both
    exports.
  - **Verified:** `tsc`, `eslint` on `app/pages/_shared`, `config` and the registration types, `check:contracts`. In a live browser: a
    Registered User's landing has none of the three cards and no Specimens tab, the other roles have them, a direct visit says "not
    available"; all 12 reports downloaded a CSV and an XLSX as BioData Admin (same rows and columns as the table, the XLSX read back
    with the library), and the first rows were compared cell by cell with the table (the only differences are case, which the table
    draws in capitals, and thousands separators); DSA and Add Project open with the start date as today and the end date empty.
    Not run: the DLA form's date (its sections need a location first; the draft function is one line), `npm run build`, XLSX opened
    in Excel. Not committed.
  - **Open.** (1) XLSX cells are text: numbers and dates are not typed cells, so a spreadsheet will not sum or sort them as numbers.
    (2) Should Privileged and BioData User roles also lose the three specimen reports? (3) The date default is today by the browser's
    clock and time zone, not Adelaide's.
