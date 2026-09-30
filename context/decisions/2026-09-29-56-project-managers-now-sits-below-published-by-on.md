# 2026-09-29 - Project managers now sits below Published by on the Project tab, per direct feedback (branch `mohan-wips`)

- **Sept 29 2026: Project managers now sits below Published by on the Project tab, per direct feedback (branch `mohan-wips`).** The two cards were side by side from `xl`; they now stack full width (`project-tab.tsx`, shared by the current and v3 versions; the previous version is unchanged). Verified headlessly at 1792px: both headings start at x 395, Published by at y 1040 and Project managers at y 1271; zero console errors; `tsc` and `eslint` clean. Not committed.
