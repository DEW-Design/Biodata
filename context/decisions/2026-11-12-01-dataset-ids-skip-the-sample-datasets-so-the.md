# 2026-11-12 - Dataset ids skip the sample datasets, so the Datasets tab never lists one id twice

- **Nov 12 2026: Dataset ids skip the sample datasets.** The designer opened the Datasets tab on a project page and got a console error: two children with the same key, `DS-2026-00003` (`datasets-view.tsx`, the table's rows).

  **Cause.** The Datasets tab lists the project's three sample datasets (`DS-2025-00012`, `DS-2025-00018`, `DS-2026-00003`) beside the uploads stored in this browser. `nextDatasetId` (`dataset-store.ts`) numbered a new upload from the stored uploads only, so the first uploads of a year took `DS-2026-00001`, `-00002`, and the third took `DS-2026-00003`, the sample's id. Two rows with one id: a duplicate React key, and a row link that opens whichever dataset is found first.

  **What changed.**
  - The sample datasets and `SAMPLE_PROJECT` moved from `project-detail/datasets-view.tsx` to `app/pages/_shared/dataset-upload/sample-datasets.ts` (unchanged), with `SAMPLE_DATASET_IDS`. The view imports them; the store can now see them without importing a view.
  - `nextDatasetId` numbers after the samples' ids as well as the stored ones.

  **Verified.** `tsc`, `eslint` on the three files and `check:contracts` clean. Live: two stored uploads (`DS-2026-00001`, `-00002`) then a third through the real upload form gave `DS-2026-00004`; the Datasets tab listed six rows, each id once, zero console errors.

  **Not fixed, open.** An upload already stored in a browser with a clashing id (for example the designer's `DS-2026-00003`) is left as it is. Renumbering it would orphan its custom-concept review, which is keyed by the dataset id in another store. Clearing the `biodata-datasets` key in local storage removes it; a migration that renumbers it and carries the review's id is possible if wanted. Not committed.
