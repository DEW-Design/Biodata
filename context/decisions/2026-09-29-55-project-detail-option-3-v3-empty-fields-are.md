# 2026-09-29 - Project detail Option 3 v3: empty fields are left out of the view, and system fields have no edit icon, per direct feedback (branch `mohan-wips`)

- **Sept 29 2026: project detail Option 3 v3: empty fields are left out of the view, and system fields have no edit icon, per direct feedback (branch `mohan-wips`).**
  - **Empty fields hidden when viewing, for every record type:**
    - The details panel and the full view show only fields with a value (`rowHasValue` in `field-schema.ts`). "Not provided" no longer appears in view mode.
    - A section with nothing to show is left out too (`sectionHasContent` in `v3/field-visibility-store.ts`), for example Tree health on an animal observation.
    - A field that carries notes still shows, so its notes stay reachable.
    - Landscape scores: factors not entered are left out, and the total card shows only once a factor has been entered. Overstorey: canopy type, foliage cover, averages and readings each show only when there is a value.
    - Edit mode is unchanged: "Edit record" still shows every field and section, so empty ones can be filled in.
  - **System and worked-out fields have no edit icon** in view mode (`isLockedRow`: IDs, Legacy IDs, sequence numbers, IBRA region and subregion, crown scores). `FieldRow` gained an additive `editable` prop (default true). The notes menu stays on them.
  - Verified headlessly: the bandicoot observation, the Cleland site and the blue gum observation show no "Not provided" in the panel or the full view; the bandicoot observation has no Tree health section when viewed but has it in Edit record; no edit icon on any ID, IBRA or score field. Zero console errors; `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.
