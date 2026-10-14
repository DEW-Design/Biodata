# 2026-10-12 - Sensitive Nominations: rate on What to protect, admin edit opens there

- **Oct 12 2026: the rating moves to where the thing rated is chosen.** The designer: "A biodata super admin and admin must be able
  to set the data risk level and access level in the same screen" (the What to protect step), "look how confusing this is" (the
  "Data release" block on Review, a pair per attribute away from the attribute, the second one empty), "edit nomination must take
  straight to this page", "why does the user have to go to this page" (Review).
  - **Same screen.** In the form (versions 2 and 3), each attribute's card on What to protect carries its Data release risk and
    User access level under its value, once the attribute is chosen; "All data" has one pair in a "Data release" row under the
    choice; a location nomination has its pair on the Location step under Area. A missing rating (required on approval, or once
    accepted) is reported on that step, not on Review. Review shows each rating as read ("Data release", the risk badge, level and
    treatment, or "Not rated") under its item; the "Data release" block and version 3's editable fields on Review are gone.
  - **Both admin roles rate.** `nominationRating` left `SUPER_ADMIN_ONLY`, so the BioData Admin now rates too: in the form, and
    on the record page while reviewing (versions 2 and 3), which it could not before. `ref-roles.md` updated.
  - **Edit opens on What to protect.** An admin's "Edit nomination" opens the form on What to protect (a location's on Location),
    not Review. A nominator's own edit still opens on Review (not asked).
  - **Save from any step.** In an admin's edit, "Save changes" (secondary, `Save01`) sits beside Continue on every step but the
    last, where it stays the primary. It validates the whole form as before. `FormPage` gained an opt-in `saveLabel` (default
    "Save draft", every other form unchanged).
- **Open:** whether a nominator's own edit should also open on the step they would change; whether an admin's own new nomination
  ("Approve nomination") should also be approvable before Review; the "Data release" row copy ("How records of this species are
  released, and who sees them as held.") is new and unreviewed.
- Verified: `npx tsc --noEmit` (only the stale `.next/types` entry for project-detail option 2), eslint on the touched files,
  `npm run check:contracts` OK. Playwright at 1792x1080: Super Admin (v2) and BioData Admin (v3) edit NSS-2026-00003 open on Step
  2 with the rating pair in the Location card and Save changes beside Continue; Review shows "Data release: Not rated" under the
  attribute, no block; BioData Admin on location NSS-2026-00010 opens on Location with the pair under Area; BioData Admin changes
  accepted NSS-2026-00009 to Extreme on Step 1 and saves straight from there (stored `extreme`, `level-4`, still Accepted). No
  console errors. Not committed.
- **Continued, same day: Review tells an item from its rating.** The designer, off a screenshot of Review: "it looks very confusing
  how the actual field (Activity/location etc) and the data release are given the same visual treatment". "Data release" had been
  drawn as a label and value row like the attribute rows, so it read as another attribute. Now each protected item is one block,
  divided from the next: the item's name (medium, primary) and value (tertiary) on the left, as the location's name and area are
  drawn in the same summary, with its areas under it; its rating in a column of its own on the right (`lg:grid-cols-[1fr_20rem]`,
  stacking below `lg`), headed "Data release", then the badge, level and treatment (`RatingValue`). Borrowed from version 3's
  record page (`itemRow`, item left, rating right). "All data" and a location are drawn the same way. Verified at 1792 and 1100 wide
  with Location (High, Level 3) and Sex (Medium, Level 2); tsc, eslint, check:contracts clean; no console errors.
