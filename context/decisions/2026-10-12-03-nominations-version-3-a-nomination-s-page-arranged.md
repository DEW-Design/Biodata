# 2026-10-12 - Nominations version 3: a nomination's page arranged around the task

- **Oct 12 2026: Nominations version 3.** The designer liked the list but found everything inside a nomination confusing, and asked
  for an audit of the user flow (whose task, what they recognise). The audit found: the decision apart from what it needs (Accept
  on the card, the rating fields on another tab under a map, Return and Reject hidden in "..."); two ratings told apart by nothing
  ("Current rating" read as this nomination's); the rating far from what it rates in the form; five names for one idea; an Overview
  tab that restated the card; a history that hid the timeline; a location's area card repeating the place. The designer: "create
  this as version 3 let me review and provide feedback". Built at `/pages/nominations/version-3` (list, record, new, edit), with
  versions 1 and 2 unchanged; the Version tool lists three versions.
  - **The record** (`nomination-record-v3.tsx`, chosen by `nomination-detail-page.tsx` for version 3):
    - The card: the nomination's identity and status; its actions are the record's own (edit, update and resubmit, delete draft).
      An admin's "Edit nomination" waits in "..." while the panel has a step to take.
    - "Where it stands", a panel under the card: three steps (Submitted, Under review or Returned to the nominator, then Decision,
      Accepted or Rejected), each with its date; then the message: what the panel needs (returned), the panel's note (decided),
      or what happens next. For both admin roles: Start review when submitted, and Reject, Return for more information and Accept
      side by side while under review. For the Super Admin it counts the ratings ("0 of 2 rated. Set a data release risk for each
      before accepting."), red once Accept was pressed with some missing; Accept then stays on the page.
    - Tabs: Nomination and History. Nomination: "Already protected" (both admin roles, only when earlier accepted nominations of
      the species carry ratings: each item, its risk badge and level, and a link to the nomination it came from), then each
      protected item as a row with what it is on the left and its rating on the right (fields for the Super Admin while under
      review, the rating once accepted, "Not rated" to admins for an accepted one without), then Justification and the
      nominator's email. A location's row is "Area": "Everything recorded here", the area in words and its map. History is the
      timeline (`AuditFeed`) straight away. The Overview tab is gone.
  - **The form**: on the Review step, each rating sits under the item it rates (the location, the whole species, each attribute)
    instead of a "Data release" block at the end (`inlineRatings`, version 3 only).
  - **Plumbing**: `NominationVersion` is 1, 2 or 3; every version 2 behaviour (`version === 2`) now reads `version >= 2`, so version
    3 inherits it. The screen index lists version 3's list and a record.
  - **Contract departure (named, 4.6):** 4.6 puts a record's actions in its card, one button and the rest in "...". Version 3 puts
    the review decisions in the "Where it stands" panel under the card, as the audit proposed and the designer approved for this
    version. Scoped to version 3; not a precedent (0.1). Also new: the horizontal progress steps (`Progress.IconsWithText`, as on
    profile setup and the explainer card) on a record page.
- **Open, for the designer's review:** whether the nominator should see the rating once accepted (version 3 shows it to everyone, as
  the audit put it; this was already an open question); whether "Already protected" should show for a location (it shows only for
  a species); the shared `Select` draws no red border when invalid (its `isInvalid` only marks the hint), so a missing rating is
  marked by the panel's red count alone: a component fix for every caller (1.9), not made here; the "Area 1 · National park" chip
  in a species' location areas is unchanged.
- Verified: `npx tsc --noEmit` (only the stale `.next/types` entry), eslint on every touched file, `npm run check:contracts` OK.
  Playwright at 1792x1080, version 3: Super Admin on NSS-2026-00001 sees the steps, "Your decision", "0 of 2 rated", Reject, Return
  and Accept; Accept with none rated stays and turns the count red; rating both gives "All 2 rated", Accept, confirm, accepted with
  the steps complete; a second Fairy Tern nomination under review shows "Already protected" with NSS-2026-00005's two items and
  links, which a Registered User does not see; BioData Admin on submitted NSS-2026-00010 has Start review in the panel; Registered
  User on returned NSS-2026-00011 sees "Returned to the nominator", the panel's request and Update and resubmit; the Super Admin's
  edit of NSS-2026-00005 shows each rating under its item. Version 2's pass re-run unchanged. No console errors. Not committed.
