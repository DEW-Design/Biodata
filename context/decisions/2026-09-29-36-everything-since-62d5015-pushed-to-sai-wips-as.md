# 2026-09-29 - Everything since 62d5015 pushed to sai-wips as 8e91c36

- **Sept 29 2026: everything since `62d5015` pushed to `sai-wips` on DEW-Design/Biodata as `8e91c36`, per direct instruction.**
  - **Covers:**
    - The contracts split into scoped rule files, the decision log moved to `context/decisions/` with a generated index, and superseded text archived.
    - The screen-building (`ref-shell`), roles (`ref-roles`) and ingest (`ref-ingest`) references rewritten to current practice.
    - The rules hook, which refuses a change until its area's rules are loaded and reads what is loaded from the transcript, with its tests and the before and after benchmark report.
    - Template Finder.
    - The Prototype tools bar moved to `app/_prototype-tools`.
    - The `/pages` screen index.
    - The public-user Projects column 2.
  - **Checked before pushing:**
    - `tsc`, `eslint --max-warnings=0` on the changed scripts, `npm run check:contracts`, and `npm run test:rules-hook` (60 of 60).
    - The Pages build as deployed (labs removed, `PAGES_BASE_PATH=/Biodata`), run in a separate copy so the running dev server was not touched. It passed; `/pages/template-finder` prerendered, and no `/proto` route was built.
    - No staged file over 500 KB, none with a secret-looking name, and the personal commit address in no file.
  - **How it was pushed:** a fast-forward (the remote tip was `62d5015`), with the `saimaniganahalli1` account. The commit carries the identity the designer chose (2026-09-29-33), set through `git -c`; git config was not changed. No co-author or tool attribution line (checked with the §5.2 grep).
