# 2026-09-28 - form header actions follow the record-page pattern, per page feedback off a screenshot of the nomination form's Cancel and Save draft ("these buttons have to be consistent with the approach we took for DLA/DSA"), and the designer's choice (record-page pattern).

- **Sept 28 2026: form header actions follow the record-page pattern, per page feedback off a screenshot of the nomination form's Cancel and Save draft ("these buttons have to be consistent with the approach we took for DLA/DSA"), and the designer's choice (record-page pattern).** The nomination, DLA and DSA forms already shared one header (`FormPage`); the change is to that shared header, so every form moves at once: nominations, DLA, DSA, Add Project option 2, the User Management forms and the `/patterns/forms` example.
  - **Now:** Save draft is the one visible button, and Cancel sits in a "..." menu beside it, rendered by the same `RecordActionBar` the DLA, DSA and User Management record pages use.
  - **When there is no draft to save** (editing a live record), Cancel is the only action, so it shows as its own secondary button. It was a text link before.
  - Cancel still asks before discarding unsaved changes.
  - `RecordActionBar` gained an additive `keepMenu` prop (default off), so a one-item menu can stay a menu. Its existing callers are unchanged.
  - CONTRACTS.md §4.1 item 1, the `/patterns/forms` page and `FormPage`'s header comment now describe this.
  - **Not done:** the menu holds only Cancel, so there is no divider in it yet. It will have one once a second action joins it.
  - **Verified live at 1708x1024:**
    - New nomination, DLA and DSA forms, and the docs example, each show Save draft and a "..." button, and no Cancel button.
    - The menu holds Cancel, and choosing it on an untouched form returns to the nominations list.
    - Enter opens the menu, and Escape closes it with focus back on "..." (CONTRACTS 1.9).
    - Editing submitted DLA-2026-00515 shows a lone Cancel button.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.