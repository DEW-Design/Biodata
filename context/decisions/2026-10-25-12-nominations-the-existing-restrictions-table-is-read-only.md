# 2026-10-25 - Nominations: the existing restrictions table is read only

- **Oct 25 2026: Nominations: the existing restrictions table is read only.** Follows `2026-10-25-11-*`. The designer, on a screenshot of the Status column: "no need for any action button here. Just show the changes."
  - The species step's table shows each restriction's Nomination, Where, Restricted and Status badge, and nothing to press. "Request a change", "Change requested", "Withdraw request", What to protect's "Changes requested" row and the prefill from a requested restriction (all from 11) are removed. The warning now ends: "If one should change, such as a new location or another attribute, nominate the change on the next step."
  - A nomination saved with `removals` keeps them and still shows "Change requested" on Review and the record; nothing new can add one. The Main reason and Attributes copy for that case is kept for those records.
  - CONTRACTS 4.2h's row-action example is "Remove" only; rules regenerated.
  - **Open:** whether `removals` (and its display on Review and the record) should be removed entirely, since nothing sets it now; how the panel learns that a new nomination is meant to change an existing restriction rather than add one (the reason is the only place today).
  - Verified: `tsc` (only the stale `.next` route types), `eslint`, `check:contracts`; live as Registered User on version 3: Painted Dragon shows the warning and two accepted restrictions with status badges only; zero console errors. Not committed.
