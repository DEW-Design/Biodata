# 2026-09-28 - Menus flip instead of shrinking; note markers beside the field name, per direct feedback (branch `mohan-wips`)

- **Sept 28 2026: menus flip instead of shrinking; note markers beside the field name, per direct feedback (branch `mohan-wips`).**
  - **The shared `Dropdown` popover keeps its full height** (`min-h-fit` in `components/base/dropdown/dropdown.tsx`). When there isn't room below the trigger, react-aria places the menu above (or beside) it instead of shrinking it into a small scrolling box, an anti-pattern flagged by the designer. The fix is in the component, so every dropdown in the app gets it (CONTRACTS 1.9).
    - Known limit: a menu taller than the space both above and below would overflow the window. Every menu in the app is short.
    - Verified headlessly (1600x900): a field menu whose trigger sits at y 792 opened with placement top, full height (160px) and no scroll; the record Actions menu near the top still opens downward (placement bottom).
  - **A field's note markers** (questionable flag, comment, attachments count and the expand chevron) now sit right after the field name, not after the value (`FieldRow`, `v3/field-notes.tsx`). Verified: the label column reads "Reliability" with the markers, and the value column "1 · Within 10 m".
  - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.
