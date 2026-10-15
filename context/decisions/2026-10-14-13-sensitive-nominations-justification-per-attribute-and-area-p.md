# 2026-10-14 - Sensitive Nominations: justification per attribute and area, protection view grouped by reason

- **Oct 14 2026: justification moves to each item, and the step goes.** The designer: "for all users when selecting attributes, they
  have to provide justification for each attribute. Also for each location. Remove the justification as a separate step but at the
  same time we cannot annoy the users by asking justification for every field when its the same justification for all."
  - **The form (every version, every role).** The Justification step is gone: Species, What to protect, Review (a location
    nomination: Location, Review). Each attribute card, and each area of a Location attribute, has its justification where it is
    chosen. The first item's field is the nomination's justification ("Used for every attribute and area below unless you give one
    its own."); every later item shows "Same justification as <first item>", ticked by default, and unticking it opens that item's
    own required field (the "same as billing address" pattern). "All data" and a location nomination have one Justification row on
    their step. A missing one is reported on that step ("Enter a justification for Sex").
  - **Data.** `NominationAttribute.justification` and `NominationArea.justification` are optional: absent means the nomination's
    `justification` applies. `protectedItems` lists the items in order. Seeds and stored nominations keep working (all absent).
    `AreasEditor` and `AreaList` gained an opt-in `renderArea` slot; `OwnJustification` shows an item's own reason on the version
    1 and 2 record page, which otherwise keeps its Justification row.
- **The protection view (version 3 record, and Review in every version).** The designer found the protected items hard to read
  and asked for a modern pattern. Three proposals were offered (summary and item cards, a table of rules, plain-language
  sentences; patterns named from GitHub's branch protection rules, Stripe Radar's rules and Google Drive's sharing panel, from
  knowledge, not browsed on Mobbin). Chosen: summary and item cards, with the designer's notes: "you cannot say same as warren
  complex in the view mode. the reason must be displayed everytime. If its common then group them together. stress test it with
  more fields like 10 or 12 fields."
  - `ProtectionView` (`nomination-protection.tsx`): a summary card (the species or place, "Protects 12 attributes, 3 areas",
    the number of reasons, and for admins the highest rating), then one card per reason, the reason written out at its head with
    "Covers N items", then each item as one row of aligned columns: name, value (a Location's areas with their method and "View on
    map"), and for admins the risk badge, access level and treatment. While an admin rates under review the two fields sit side
    by side in that column. A Location whose areas give different reasons appears in each card; it is rated once, and later cards
    say "Rated with Location in reason 1".
  - Who sees ratings on the record: both admin roles always ("Not rated" where none), anyone once an accepted nomination has them
    (as before). The Justification row is gone from version 3's record; the reason cards replace it.
  - The form's Review uses the same view under Species and What to protect (without repeating the species), so "Same as" never
    appears in a read view.
- **Stress seed.** NSS-2026-00014, Orange-bellied Parrot, Lana Steiner, Accepted: 12 attributes (Location with three areas, one
  with its own reason; Observer and Determiners sharing a second reason), every attribute rated. Illustrative, not a real
  nomination. Store version 5 adds it to browsers that already had data. It also gives the species a current rating.
- **Open:** whether version 1 and 2's record pages should take `ProtectionView` too (they show the shared reason in a row and
  each own reason under its item); the rating column sits at the far right on a wide screen (aligned like a table, about 600px
  from the value at 1792 wide); whether a Location should be rated per area now that areas carry their own reasons.
- Verified: `npx tsc --noEmit` (only the stale `.next/types` entry), eslint on the nominations folder and `form-page.tsx`,
  `npm run check:contracts` OK (it caught a `<header>` element in the group card, now a `div`). Playwright: Super Admin edits
  NSS-2026-00003, adds Sex, its "Same justification as Warren complex" ticked; unticked and empty, Save refuses with "Enter a
  justification for Sex"; filled, saved, stored as the attribute's own; column 2 lists three steps (v1 new form too). Version 3
  record of NSS-2026-00014 at 1792 (admin: three reason cards, 10/1/2 items, ratings), at 1440 under review with no ratings (12
  pairs of fields side by side, the split Location's second card pointing to reason 1), and NSS-2026-00003 as Registered User at
  390 wide (no ratings, stacks). Review of NSS-2026-00014 shows the same cards. No console errors. Typography skills not run; the
  layers are copied from the Review's existing ones (item name medium primary, value tertiary or secondary, section heading
  semibold, labels tertiary). Not committed.
- **Continued, same day: a table version, and the record page trimmed.** The designer: "can you create a table version. the card
  view makes it look like reason is the main subject here", and of version 3's record: "the status card and the species card and
  the image on the right is not needed."
  - **Table (option 1, the default).** `ProtectionView layout="table"`: an embedded `TableCard` table (fixed layout, paged at 25,
    1040px minimum with ratings, scrolling sideways on a narrow screen): Attribute (the row header), Protected, Reason (always
    written out), and for admins Data release risk (badge and treatment) and User access level. Rows follow the order the
    attributes were chosen; a Location whose areas give different reasons has a row per reason. While an admin rates under review
    the two selects sit in their own columns; the Location's second row says "Rated with Location above". The cards are kept as
    option 2 (`?layout=cards`), compared with the Prototype tools' Layout tool on the version 3 record (4.4). The form's Review
    uses the table. The summary card (species, counts, highest rating) is gone from both layouts.
  - **Record page (version 3).** The "Where it stands" panel is removed; the review decisions are the card's actions again, as
    4.6 has them: Start review when submitted; Accept, with Return for more information, Edit nomination and Reject (destructive,
    below the divider) in "...", while under review. This ends version 3's named departure from 4.6. A note the panel wrote shows
    as one notice under the card (returned, accepted or rejected); "The panel gave no note" is no longer shown. Accept with
    ratings missing shows "Ratings missing" over the table, as version 2 does. The species photo is gone.
  - **Check change (9.4):** `nomination-protection.tsx` is added to 4.2b's list of embedded tables (inside a record tab, the page
    scrolls, few rows), the exception 4.2 already defines; no rule is loosened.
- **Open:** whether the returned-for-more-information note should stay as a notice for the nominator (it was in the removed panel
  and is the only place the nominator sees what the panel needs); which layout to keep, after which the other is deleted (4.4).
- Verified: tsc, eslint, check:contracts OK. Playwright: NSS-2026-00014 as BioData Admin at 1792 (13 rows, the Location in two,
  every reason written out, ratings in columns, Layout "Option 1 of 2"); `?layout=cards` shows reason cards; NSS-2026-00003 as
  admin, Start review from the card, Accept with no rating shows "Ratings missing ... 0 of 1 rated", choosing High sets Level 3,
  Accept opens the confirmation; Registered User has no rating columns; 390 wide scrolls the table sideways. No console errors.
- **Continued: version 3's audit tab and email.** The designer, of version 2's Audit history: "use the same version for audit
  history"; of the Nominator's email row: "this need not go on the screen". Version 3's tab is now "Audit history" with the shared
  `AuditLog` summary (ID; created, decided, last modified, on and by) and "Show all changes (N)" opening the feed, as version 2;
  the email row is gone. Verified on NSS-2026-00014 as BioData Admin; no console errors; check:contracts OK.
- **Asked, not built yet:** the designer asked for a better pattern than "Same justification as Warren complex". Three were
  offered (a shared justification with an override per item; choosing one-for-all or one-each first; a field per item with "copy
  to all"). The designer leaned to the first and asked for it to be explained before it is built.
- **Continued: the main justification, built.** The designer: "yes build it, use main justification". On What to protect, a "Main
  justification" row sits under the attributes ("Why these records should be protected. Used for every attribute and area unless
  you write a different one."), required while any item uses it. Each attribute card and each area shows "Uses the main
  justification · Write a different one" (a link, no checkbox); the link opens "Different justification for <item>", required,
  with "Use the main one instead" under it to close it. No item is the source of the reason any more (`protectedItems` treats them
  alike; `missingForNomination` asks "Enter the main justification" and "Enter a justification for <item>"). "All data" and a
  location nomination keep their single Justification row. Read views are unchanged: every row shows its full reason.
- Verified: tsc, eslint, check:contracts OK. Playwright: NSS-2026-00014 edit shows 11 "Uses the main justification" lines and 3
  different-justification fields (the release site, Observer, Determiners); draft NSS-2026-00002 as Registered User, Continue
  with no main justification asks for it, "Write a different one" on Micro habitat left empty asks for that, both filled, Review
  shows each reason. No console errors.
- **Continued: reason first, one word, per-area ratings, the table chosen.** The designer: "the reason must be asked before the user
  defines the attributes. and lets keep the language uniform. don't juggle between justification and reason. Let's go with
  Reason. yes location can be rated per area. lets go with the table."
  - **Reason first.** "Main reason" now sits right after "What should be protected?", before Attributes ("Why these records
    should be protected. It applies to every attribute and area you add below, unless you write a different one for it."),
    required unless every item has its own. Its field shows as soon as Specific attributes is chosen.
  - **One word.** Every label, hint and message on the nomination screens says reason: "Main reason", "Uses the main reason",
    "Different reason for <item>", "Enter the main reason", "Enter a reason for <item>", "Reason" on All data and a location,
    the version 1 and 2 record's "Reason" row and "Its own reason", the screen index lines. The data field keeps its name,
    `justification`. Other features (project restrictions, DLA) still say justification and were not touched.
  - **A Location is rated per area.** Ratings for a Location attribute are kept per area (`area:<attribute id>:<area id>`,
    `areaRatingKey`, the same key an area's reason uses). The form puts the two rating fields under each area; the version 1 and 2
    record rates each area under it in the area list; the table has a row per area with its own rating; a species' current
    rating gets one rule per area ("Location: Coorong National Park"); `ratingKeyLabel` names any key in messages and in "Already
    protected". Stored ratings move: store version 6 copies a rating kept under a Location attribute's id to each of its areas
    (`ratingsPerArea`), and the seeds are written through the same function.
  - **The table is the layout.** The cards and the Layout tool on version 3's record are deleted (4.4).
- Verified: tsc, eslint, check:contracts OK. Playwright: a version 5 store with NSS-2026-00014's Location rated under its
  attribute id comes back with three area ratings and no attribute rating; the record shows 14 rows (the Location as three) with no
  Layout tool; the edit form shows Main reason above Attributes, no "justification" anywhere in main, and 14 rating pairs (three
  areas and eleven attributes). No console errors.
- **Continued: ratings are admin-only, strictly.** The designer, off version 3's record of accepted NSS-2026-00007 viewed as a
  Registered User: "Data release risk and user access levels are strictly only for biodata admin and super admin only". Version
  3 had shown the rating columns to anyone once a nomination was accepted. Every rating display now reads the one feature,
  `nominationRating` (BioData Admin and Super Admin): version 3's table columns and "Already protected"; version 2's "Current
  rating" (was `nominationReview`) and rating fields; the list's rating columns (was the `canReview` prop); the form's Review
  (already). Both keys pass the same two roles today, so only version 3 changed what anyone sees.
- Verified: tsc, eslint, check:contracts OK. Playwright, NSS-2026-00007 record (versions 3 and 2, What to protect) and both
  lists, for all six signed-in roles: no rating text for Registered User, BioData User, Privileged Admin, Privileged User; shown
  for BioData Admin and Super Admin. No console errors.
- **Continued: version 2 deleted.** The designer: "get rid of version 2 and keep only version 3"; asked whether version 1 goes too,
  the designer chose "Remove only version 2". Deleted: `app/pages/nominations/version-2/` (list, record, new, edit). The Version
  tool offers Version 1 and Version 3 (its description: "Species and locations, a reason per attribute; admins approve, edit and
  rate"); `NominationVersion` is `1 | 3`, and version 3 keeps its number and routes so links stay. The screen index lost version
  2's two lines, and its location line now opens version 3. Code that tests `version >= 2` is version 3's behaviour (noted in
  `nomination-version.tsx`); historical comments that say "version 2" were left as history.
- **Open:** `NominationDetail` (`nomination-detail.tsx`) now renders only for version 1, so its `version >= 2` branches (ratings,
  admin edit, locations) are unreachable; removing them is a clean-up for the designer to approve. A browser with a version 2
  address bookmarked gets "This page could not be found".
- Verified: tsc (only the stale `.next/types` entry), eslint, check:contracts OK. Playwright as BioData Admin: version 1 list and
  record, version 3 list, NSS-2026-00014 and the location form open (200); the Version tool lists Version 1 and Version 3;
  `/pages/nominations/version-2` shows the not-found page. No console errors.
