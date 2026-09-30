# 2026-09-24 - Unified DSA/DLA status model, rolled straight into production per direct

- **Sept 24 2026: Unified DSA/DLA status model, rolled straight into production per direct
  instruction ("it's sitting in a good spot now... let's roll these updates into production").**
  Source: a real business reference sheet ("DLA/DSA - users Workflow Status", a screenshot supplied
  directly) plus a follow-up Slack thread (Suresh Saicharan asking, Adith Mohan/Uma Shankar
  answering) that resolved every open question against it. DSA and DLA used to run two
  independently-invented status sets (DSA: Active/Inactive/Revoked/Draft; DLA: Active/Under Review/
  Rejected/Expired/Withdrawn) - both now share one real workflow, `app/pages/_shared/
  agreement-status.ts`'s `AgreementStatus`: **Draft -> Submitted -> Under Review -> (Approved /
  Auto Approve -> Active) or Rejected; Under Review <-> On Hold; Active -> Closed (auto on expiry,
  or manual); Cancelled reachable from anywhere before Closed.**
  - **Every open question from the sheet was answered directly, not guessed** - each one changed
    the model from what the sheet's numbering alone would have implied:
    1. **Approved is a real, visible status, not a momentary transition.** "If the Start Date of
       the DSA is in the future, the status shall remain as 'Approved'/'Auto Approved' until the
       date before it becomes active." Confirmed with a real worked example: DSA-2026-01415/
       DLA-2026-00510 both carry a `validFrom` in the future and correctly stay `approved` rather
       than jumping straight to `active`.
    2. **Submitted and Under Review are genuinely distinct, and the transition is a manual reviewer
       action** ("Once a reviewer clicks on a submitted request it changes to Under Review... shall
       assist reporting and notifications to reviewers for action") - not automatic, so both DSA
       and DLA gained a real "Start Review" button, not a same-step alias.
    3. **On Hold only applies during review, never once Active** ("will be used by reviewer to hold
       the review in cases where there is pending info from requestor... for active requests only
       cancel option can be used"). Both detail pages only ever show "Put On Hold"/"Resume Review"
       on Under Review, never on Active - Active's only workflow action is Cancel.
    4. **Cancelled is one status, not two** ("I can cancel my own DSA, Admin can also cancel my
       DSA") - who cancelled it is an audit detail this build doesn't track, not a second status;
       the button's own color (`link-destructive` vs `secondary-destructive`) still varies by
       whether it's the page's only action or a peer among others, same convention DLA's own
       Withdraw button already used.
    5. **"Revoke" is not a real status at all - confirmed legacy terminology** ("Revoke will be
       called cancelled. That term was used before WF stages were finalised.") DSA's old `revoked`
       bucket is gone entirely, folded into `cancelled` - not kept as a separate "compliance" axis,
       which is what the sheet's own side-annotation had originally implied before this was asked.
    6. **Sequence #7 is confirmed missing on purpose** ("Yes there was something there that was
       removed") - nothing invented to fill the gap.
  - **`agreement-status.ts`** is the single shared source: `AgreementStatus`, `agreementStatusOrder`
    (draft/submitted/under_review/approved/rejected/active/on_hold/closed/cancelled - the sheet's
    own sequence order, not an invented "healthiest first" ordering), `agreementStatusMeta`
    (label/tabLabel/badgeColor, reusing this build's existing 5-colour status palette - gray/brand/
    warning/error/success - rather than introducing new ones no other status badge in this codebase
    uses), and `effectiveStatus()` - the pure function computing Approved -> Active and Active ->
    Closed once a real date passes. `dsa-data.ts`/`dla-data.ts` now `export type`/`export` alias
    `DsaStatus`/`DlaStatus` and `dsaStatusOrder`/`dsaStatusMeta`/`dlaStatusOrder`/`dlaStatusMeta`
    straight from this file, so every existing call site across both features kept working
    unchanged - only the literal status values themselves needed updating, not every import.
  - **A real, previously-unnoticed `useSyncExternalStore` bug was caught live during verification,
    not shipped**: the first pass applied `effectiveStatus` inside `getSnapshot` itself
    (`() => resolve(dsas)`), which maps over the array and returns a brand-new reference on every
    single call - `useSyncExternalStore` requires a referentially stable snapshot between renders
    when nothing has changed, so this produced React's own "the result of getSnapshot should be
    cached to avoid an infinite loop" warning immediately followed by "Maximum update depth
    exceeded," crashing `/pages/dsa` and `/pages/dla` outright (confirmed via `page.on("pageerror")`
    in a live Playwright pass, not visible from a code read). Fixed by moving the resolution into
    `commit()` - a cached `resolved`/`seedResolved` reference that only recomputes when the store
    actually changes, exactly the pattern `useSyncExternalStore` expects. Fixed identically in both
    `dsa-store.ts` and `dla-store.ts`, the same "a bug caught in one file is often shipped in
    both" convention this file already applies elsewhere.
  - **DSA gained the full review pipeline it never had** (previously Draft -> Active in one step,
    no reviewer step at all) - `dsa-store.ts` gained `startDsaReview`/`holdDsaReview`/
    `resumeDsaReview`/`approveDsa`/`rejectDsa`/`cancelDsa` (replacing the old single `revokeDsa`).
    `approveDsa` needs no extra input at all, unlike DLA's own Approve - a DSA's `validFrom`/
    `validTo` are already fixed from the agreement's own form, so approving just compares that
    date to today and lands on `approved` or `active` directly. DSA has no separate requester-vs-
    reviewer persona to gate any of this behind - `DsaShell` already replaces all of `main` with a
    restricted message for every role but the one that can manage DSAs at all
    (`useFeatureAccess("dsaManagement")`), so every action is unconditionally available once
    `DsaDetail` renders; `DsaDetail`'s own toolbar is now a full set of direct buttons (matching
    DLA's own "every action in the toolbar, always visible" convention from the Sept 23 follow-up)
    instead of hiding Edit/Revoke behind a `Dropdown`.
  - **DLA gained two real capabilities it never had**: a genuine **Draft** status (the wireframe's
    own form had no draft step at all - `dla-store.ts` gained `saveDla`, mirroring `saveDsa`
    exactly, and a brand-new `app/pages/dla/[id]/edit/page.tsx` route, since a draft has to be
    editable to ever get submitted) and **Submitted as its own stage, distinct from Under Review**
    (previously `submitDla` put a new request straight into `under_review`). `dla-form.tsx`'s
    `DlaForm` gained the same `initial`/`onSaveDraft` split `DsaForm` already had (`renewFrom`
    stays a separate, additive case - pre-filling a *new* record from a closed one's fields, not
    editing that closed record in place) plus a `mode: "draft" | "submit"` on `validateDla` (a
    draft only needs the requestor's own organisation, the same "just enough to identify it" rule
    DSA's own draft mode already uses). `dla-store.ts` gained `startDlaReview`/`holdDlaReview`/
    `resumeDlaReview`/`deleteDla` (for a deleted draft) alongside the existing `approveDla`/
    `rejectDla`, and `cancelDla` replacing the old `withdrawDla`.
  - **A shared `RejectModal`** (`app/pages/_shared/agreement-modals.tsx`) replaces DLA's own
    previously-local one - DSA needed the identical "Under Review -> Rejected, reason required"
    modal once it gained the same review step, so it's now one real component both import instead
    of two copies of the same ~35 lines.
  - **Status icons and list-bucket subheadings/empty-state copy rewritten for all 9 statuses** in
    both `dsa-shell.tsx`/`dla-shell.tsx` (icons: `Edit05`/`Send01`/`Clock`/`PauseCircle`/
    `CheckCircle`/`XCircle`/`CheckCircle`/`SlashCircle01`/`MinusCircle`, the same set both shells
    now share) and `dsa-list.tsx`/`dla-list.tsx`/`dsa-detail.tsx`/`dla-detail.tsx`'s own
    subheading/emptyCopy maps - no status left with stale Active/Inactive/Revoked or Active/Under
    Review/Rejected/Expired/Withdrawn-era copy.
  - **Seed data enriched with real examples of every new status**, not left undemonstrated: DSA
    gained 6 new agreements (Submitted/Under Review/On Hold/Approved/Rejected/Cancelled, its 2 old
    `inactive` rows converted to `closed` since both already had a `validTo` in the past) and DLA
    gained 4 (Draft/Submitted/On Hold/Approved, its old `expired`/`withdrawn` rows renamed
    `closed`/`cancelled` directly). Every new record follows this build's own established
    conventions - real BDBSA partner orgs, the Olivia Wyatt/Maya Dewitt/Phoenix Baker/Lana Steiner
    placeholder persona set, real South Australian national parks for DLA locations - never
    invented names or orgs.
  - `/proto/collection-sidebar`'s own `dsaStatusIcons`/`dlaStatusIcons` maps (built for the earlier,
    narrower status sets) now point at one shared 9-status `statusIcons` map, matching the two real
    shells exactly - the lab would otherwise have failed to type-check the moment `DsaStatus`/
    `DlaStatus` became aliases of the same shared `AgreementStatus` union.
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, then an extensive live
    Playwright pass covering both features end to end: all 9 status buckets and their real seeded
    counts confirmed on both `/pages/dsa` and `/pages/dla`; a full DSA transition walk (Submitted ->
    Start Review -> Under Review -> Put On Hold -> On Hold -> Resume -> Under Review -> Approve ->
    correctly landed on Approved, since that record's own start date is in the future) plus a
    separate Reject flow (Under Review -> a required reason -> Rejected) and a full create -> Save
    draft flow; the identical DLA transition walk, including the Approve modal's own live copy
    correctly announcing "moves to Approved and becomes Active on [date]" before confirming, and a
    full create -> Save draft -> Edit draft -> Add Location -> Back flow exercised through real
    in-app navigation (not repeated `page.goto()` calls, which would have reset the in-memory store
    - the same "client nav keeps state, a full reload resets it" convention this build's stores
    already document) - zero console errors across every scenario. Chromium/Playwright installed
    for the session only, removed after; `package.json`/`package-lock.json` confirmed unchanged.