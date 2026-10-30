# 2026-10-30 - Audit Log is the one name: History and Audit history are renamed

- **Oct 30 2026: the record pages' history tab is called "Audit Log" everywhere.** The designer: "Across the webapp, change 'History' to 'Audit Log'. And 'Audit History' to 'Audit Log'." The DLA and DSA record pages already had "Audit Log"; five others did not.
  - **What changed (the label; the tab's contents are the shared `AuditLog` and were not touched).**

    | Record page | Tab was | Now |
    | --- | --- | --- |
    | Notification | History | Audit Log |
    | Controlled vocabulary | History | Audit Log |
    | Voucher record | History | Audit Log |
    | Dataset | History | Audit Log |
    | Nomination | Audit history | Audit Log |

  - **Its siblings follow the name.** The Export action on a notification and on a vocabulary read "Export audit log" (they read "Export history"), and the files they download are `<id>-audit-log.csv` (they were `<id>-history.csv`). The `/pages` index descriptions that named the tab ("then History", "entries, details, history", "audit history", "its history across scans") say audit log, and so do the comments in the five files and in `audit-log.tsx`. CONTRACTS 3.13's icon list reads "Audit Log `ClockRewind`" (it read "Audit log and history") and 4.6 item 7 names the vocabulary and dataset tabs "Audit Log"; the scoped rule files were regenerated.
  - **Not changed, on purpose.** The tabs' internal ids (`history`) and the data field `history` on each record: they are code, not words a person reads, and no link uses them. The reports' own "Audit log" tabs and report category (the Flora and Fauna Taxonomy Reports) keep their sentence-case "Audit log": they are named for the designer's sheets ("Taxonomy list Audit Log Report"). Earlier decision files that say History are history.
  - **Checked.** `npx tsc --noEmit`, `npx eslint` on the touched folders and `npm run check:contracts` pass. Live (Playwright, zero console errors) on a notification, a vocabulary, a voucher record, a nomination and a dataset: each has an "Audit Log" tab and no tab named History or Audit history, and opening it shows the record's log; the notification's and the vocabulary's "..." menu says "Export audit log"; the DLA and DSA record pages still read "Audit Log". Not checked: the downloaded file's name (read from the code, not downloaded).
  - **Open, for the designer (0.4).** The tab is "Audit Log" in Title Case, as the DLA and DSA record pages write it and as you did, while most labels in the app are sentence case ("Audit log", as the report tabs have it). Which should it be? It is one string in each of seven places.
