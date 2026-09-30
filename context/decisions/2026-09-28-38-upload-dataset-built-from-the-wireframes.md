# 2026-09-28 - Upload dataset built, from the wireframes

- **Sept 28 2026: Upload dataset built, from the wireframes** (Figma `YMproGZfrFB5jUqPHPxMhk`: upload `67:33213`, success `71:7163`, ingestion report `71:7769`). Designer decisions taken this round:
  1. **Workflow status** is the business sheet "DataSet - users Workflow Status": File Uploaded, Pre-flight Validation Requested, Pre-flight Validation in Progress, Validation Passed or Failed, Save draft or Submit, Processing (post-flight), Under Review or Auto-Approved, Approved. The sheet's step 8 ("All Records Approved = complete") is struck through and is not modelled.
  2. **Real file validation is left out for now**, to be picked up next (see "Next up" below).
  3. **The report is seen per person for the projects they can access, and BioData Admin sees all**, with the reviewed-by and approved-by columns filled by the admin's review.
  4. **The ingestion report sits under Reports**, and is worked through together with data validation. It is not built here.
  - **Upload (`/pages/project-list/<id>/upload`), reached from "Upload dataset" on the project card** (every project; it used to show a "not built yet" toast). The wireframe's left project list is lo-fi chrome and is not reproduced; the route is under the project. It follows the form pattern (CONTRACTS 4.1): `FormPage`, with the two sections in column 2 (`FormSectionList`):
    - **Upload files:** the instructions (.XLS and .XLSX), the drop area and file queue, and the recommended templates.
    - **Data upload acknowledgement:** data licence (CC-0, CC-BY), security classification (Official, Official Sensitive), First Nations considerations (three options; Authorised or Restricted reveals a required "IIA reference / authority name"), and the privacy confirmation, ending in "Confirm and upload".
    Mandatory details block Continue for the section being left, with the "Details missing" alert, never ahead of it. Cancel asks before discarding.
  - **Departures from the wireframe, on purpose:**
    - the three "select one" groups are radio buttons, not checkboxes (a checkbox lets two be ticked);
    - all four acknowledgement groups are mandatory (only the IIA field carried an asterisk);
    - no Save draft: a draft has nothing to save before validation (the sheet's "Save draft" comes after validation passes);
    - the dash in "Restricted - subject to IIA conditions" is a hyphen (CONTRACTS 2.3);
    - the "click here" link reads "review the project's Privacy and Restrictions (opens in a new tab)", so the form is not lost; it opens the project page, because the tab is not URL-addressable;
    - the template cards keep the wireframe's names, descriptions and two facts, but have no image (a placeholder box in the wireframe) and their Excel and PDF downloads are disabled with a "Coming soon" tooltip, since there are no template files (the Template Finder section is where they will be browsed).
  - **The drop area and queue are composed, not a DEW component** (`dataset-upload/upload-dropzone.tsx`): react-aria's real `DropZone` and `FileTrigger` with the DEW `Button`, `FeaturedIcon` and `ProgressBarBase`, in `app/pages`, not `components/**` (CONTRACTS 1.4). Progress is real: each file is read in the browser with `FileReader` and the bar follows its progress events. The wireframe's XLS file glyph is not in the icon set (the "File Type Icon" gap logged earlier), so the queue uses the generic file icon. **For the designer:** the Untitled UI File upload component (which the wireframe uses) would replace this if you authorise ingesting it (CONTRACTS 1.4).
  - **Success is a toast, not a screen:** "Your files are uploaded" with the new dataset id, then back to the project. **It has no "View report" button yet**, because the report does not exist and a button that goes nowhere is a dead button; it is added with the report (the toast already supports an action button).
  - **Data:** one persisted zustand store (`biodata-datasets`, `dataset-upload/dataset-store.ts`). A dataset keeps the project, the file names and sizes (never contents), the acknowledgement, the uploader, the date and its status, and starts at "File uploaded". The full status vocabulary from the sheet is defined in `dataset-data.ts`, but only "File uploaded" is written.
  - **Access:** new `datasetUpload` feature (every signed-in role; a guest gets the sign-up invite on the button, and the restriction with all three columns on a direct visit). The role switcher's whole-page gate now also matches by pattern (`/pages/project-list/<id>/upload`), so switching to a guest while on the page goes Home instead of staying stranded.
  - **Verified live at 1708x1024 as registered user, with real .xlsx and .xls files:**
    - the project card button opens the page; three columns; breadcrumb Home / Projects / project / Upload dataset;
    - Continue with no file stays put with "Add at least one file"; a .txt is refused with a message; two spreadsheets show real sizes (16 KB, 4 KB), "Complete" and 100%; a file can be removed;
    - Confirm with nothing lists all four missing groups; choosing Restricted reveals the IIA field, which is required, hides and clears when None is chosen;
    - Confirm and upload shows the toast, returns to the project and stores the dataset (`DS-2026-00001`, status File uploaded); a second upload is `DS-2026-00002` and the first is kept;
    - a clean cancel goes straight back; a dirty cancel asks first, and Discard leaves;
    - as a guest the button shows the sign-up invite and a direct visit shows the restriction; switching to a guest from the page goes Home; an unknown project shows "This project isn't available"; BioData Admin and privileged users open the form;
    - the page never scrolls beyond the viewport; zero console errors.
    `check:contracts` and `eslint --max-warnings=0` are clean on every touched file.
  - **Not covered:** dropping a file by drag (the click path was tested with real files; the drop area is react-aria's own `DropZone`); the drop area at phone width.
  - **Next up, per the designer (Sept 28 2026):**
    1. **Data validation** (pre-flight): real checking of the uploaded file against the templates, the statuses from the workflow sheet, the "Validate" action, and the error and success files.
    2. **The ingestion report under Reports** (the wireframe's Dataset Validation Report: filters, chips and the 21-column table, seen per person, admin sees all), and the toast's "View report" button.
    Needs from the designer then: the required columns per template, the business rules, and the option lists behind the report's filters.