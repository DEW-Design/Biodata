# 2026-10-25 - Bulk upload of attachments and web links with a project template

- **Oct 25 2026: Bulk upload of attachments and web links with a project template.** The designer asked for every project to take
  attachments and links in bulk: the project card's "Upload dataset" becomes "Upload", a menu of Upload dataset and Upload attachments;
  a spreadsheet template collects each file's metadata, the files are zipped with it, and each file lands on its record's field.

  **What changed.**
  - `ProjectCardActions` takes `onUploadAttachments`; when given (the project page), the button is "Upload" with a menu. The two items
    carry no icon: both are uploads, and `Upload01` twice says nothing (2.12); a different glyph would break 3.12b. A guest gets a new
    "Sign up to upload attachments" prompt. The lab `/proto/dataset-ingestion` passes no handler and keeps "Upload dataset".
  - `bulk-attachments.ts`: the template writer, the zip reader and the row checker. `bulk-attach-modal.tsx`: the modal (download the
    template, add the zip, check, attach), a `FormModal` like "Add attachment", borrowing the drop area and file row from Upload dataset
    and `EmbeddedTable` (4.2h) for the rows.
  - **The Field ID**, the designer's question "how can we get the field ID to the user?": a Field ID is the field's section and label as
    words (`location.reliability`, `voucher.voucher-images`), the same on every record of a type. The template is made for one project, so
    it carries the IDs: a "Records and fields" sheet lists every event, occurrence and observation with each field and its Field ID
    (filterable), and Record ID and Field ID are dropdowns. Nothing new is shown on the record page.
  - **The template** (`BD-5039 attachments template.xlsx`): Start here (the steps, an example, what is filled in for you), Attachments
    (Project ID filled in on 500 rows; Record ID, Field ID; File name or Link address; Title, Description, Created, Creator, Licence,
    Publisher, Rights holder: the artefact viewer's own fields; a hint row under the headers), Records and fields, and a hidden Lists
    sheet. Written by hand as SpreadsheetML, because community SheetJS writes no styles, frozen rows or dropdowns; zipped and read with
    SheetJS's CFB, so no new dependency. Header fills and text colours are DS - Foundations primitives (brand-100, gray-50/100/200/600/900).
  - **Links in bulk:** a row with a Link address instead of a File name. A template of links only is added without a zip.
  - **The check:** each row against this project (Project ID), its records (Record ID), that record's fields (Field ID), the zip (the file
    name, any folder, case ignored), the accepted types (as `kindForFile`), the link, the date and the licence. A file in the zip no row
    names is listed and not attached. A row already on its field is "Already attached" and skipped, so a corrected zip can be added again.
    Ready rows attach; rows to fix are left. Audio and video wait for review as before (`reviewForNewFile`).
  - `FieldFile.meta` (`FileMeta`) keeps the template's details; `fieldArtefact` (artefacts-view.tsx) shapes a file for the viewer once,
    for the project page and the post-6-oct lab, which had copied the mapping. The artefacts table's "Added by" now reads `addedBy`, not
    the viewer's Creator, which the template can set to someone else. `fieldNotesActions.addLink` adds a link through the store's `update`
    (several links at once all land); "Add web link" uses it too. `UploadDropzone` gained opt-in `acceptedFileTypes` and `formats`.

  **Open, for the designer.**
  1. Is the Field ID required? Today a file belongs to a field, never to a record as a whole, so the template requires one.
  2. Should the record page show a field's ID (a copy action on hover, say)? Not built: a new label is a question (4.7 item 3).
  3. Modal or page: the bulk upload is a modal like "Add attachment"; a long check list scrolls the modal. Upload dataset is a page.
  4. The Project ID column is filled in for the person; it could be dropped from the sheet, since the template is per project.

  **Answered by the designer, same day.** (1) Yes: a file can also be attached to a whole record, not only to a field. Not built yet:
  the Field ID stays required until record-level attachments exist in the store, the record view and the Artefacts tab. (2) No: the
  record page does not show Field IDs. (3) The modal stays. (4) The Upload menu's items stay without icons.

  Verified: `tsc`, `eslint` on every touched file, `check:contracts` OK. Live (Playwright, 1440x900, registered user and public user):
  the menu, the template download (opened by SheetJS and openpyxl: 4 sheets, Lists hidden, 5 dropdowns), a zip of the filled template,
  three files, a link, a stray file and macOS clutter: 4 attached, 2 to fix, stray listed, on the Artefacts tab and in the viewer with
  the template's title, date, creator and description; the same zip again shows 4 already attached; keyboard (Enter, ArrowDown, Enter,
  Escape, focus back on Upload); the guest prompt; zero console errors. Not done: `/emil-typography` and `/emil-design-foundations`
  (0.6 item 8); the template has not been opened in Microsoft Excel itself. Not committed.
