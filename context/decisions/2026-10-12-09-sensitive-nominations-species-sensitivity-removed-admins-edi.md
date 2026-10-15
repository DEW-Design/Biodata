# 2026-10-12 - Sensitive Nominations: species sensitivity removed, admins edit, more locations

- **Oct 12 2026: Sensitive Nominations: species sensitivity removed, admins edit, more locations.** The designer: "The admin and
  super admin must be able to edit the existing or submitted nominations. get rid of species sensitivity we have covered the same
  in nominations itself. Check Return for More information status badge. Populate the location tab as well with few locations.
  Call this Sensitive Nominations". Asked where the name goes, the designer chose "Rename the section everywhere".
  - **Species sensitivity removed.** The column 2 item, its three routes (`/version-2/species-sensitivity`, `/bulk`, `/<slug>`),
    the list, record, bulk and editor components, its store (`biodata-species-sensitivity`, left orphaned in browsers that had it,
    harmless) and its seeds are gone, with the page gate and the screen index lines. What nominations still need moved:
    `species-sensitivity.ts` became `nomination-rating.ts` (the scales, the access rule, `mergeRatings`) and
    `species-sensitivity-fields.tsx` became `nomination-rating-fields.tsx` (`RiskBadge`, the two selects, `RatingValue`,
    `CurrentRatingValue`). A species' current rating is now made from the nominations: its accepted nominations' ratings, merged in
    the order they were accepted (`currentSpeciesRating`), shown on What to protect and in the list's rating columns. Species rated
    only in the removed seeds (Orange-bellied Parrot, Yellow-footed Rock-wallaby and so on) are now open unless a nomination rates
    them. The feature key `speciesSensitivity` is now `nominationRating` (still Super Admin only); the Version tool's description
    and the accept dialog no longer mention Species sensitivity.
  - **Admins edit.** In version 2, a BioData Admin or Super Admin edits any nomination past its draft, whatever its status: "Edit
    nomination" on the record (in "..." beside Start review or Accept, the white button otherwise), the same form, "Review and save",
    "Save changes" with no Save draft. The status stays (`updateNomination`), so the audit log, which lists status moves only, gains
    nothing. The Super Admin's Review step has the rating fields, required once the nomination is accepted (so an accepted one a
    BioData Admin approved without a rating gets one this way), optional before. A nominator's own edit is unchanged, and a
    Registered User still gets "This nomination can't be edited" on someone else's. Version 1 unchanged.
  - **Status badge.** "Returned for more information" ran into the Updated column in the list with the rating columns (216px badge
    in a 167px cell). The columns were rebalanced (Status 18%) and the table's minimum width raised to 1340px, so the badge fits at
    every width (a narrower window scrolls the table sideways, 4.2f). The label is unchanged.
  - **Locations.** Four more seeded location nominations, NSS-2026-00010 to 00013, one per way of choosing an area and across the
    statuses: Coorong Hooded Plover nesting beaches (park list, Submitted, Phoenix Baker), Kangaroo Island Glossy Black-Cockatoo nest
    trees (drawn circle, Returned to Olivia Wyatt), Yellow-footed Rock-wallaby colony, Flinders Ranges (park list, Accepted,
    Medium, Level 2), Dalhousie mound springs (coordinates, Rejected). Illustrative, not real nominations. The store moved to
    version 4: they are added to a browser that already had data, and a nomination made there that took one of those IDs keeps
    everything but its ID, which moves to the next free one.
  - **Name.** `NOMINATION_SECTION_LABEL` is "Sensitive Nominations" (was "Nominate Sensitive Species"): the rail, the breadcrumb,
    the mobile menu, column 2's heading (was "Nominations") and the list's title (was "Sensitive nominations" in version 2 and
    "Sensitive species nominations" in version 1), in both versions. `sectionIcons` now keys on the constant. Left as they were,
    since they are actions or kinds rather than the section's name: Home's quick action "Nominate Sensitive Species", the Add menu's
    "Sensitive species nomination", the record's eyebrows and "Back to nominations".
- **Open:** whether Home's quick action and the Add menu should offer species or location (they open version 1's species form);
  whether the owner's "Save changes" on a submitted nomination should carry `Save01` (3.12; it has had no icon since before this
  task, and the admin's edit reuses it); location IDs share the NSS- series; the earlier open items (the 0.10 clause, "Document
  1.docx").
- Verified: `npx tsc --noEmit` (only the stale `.next/types` entry for project-detail option 2), eslint on every touched file,
  `npm run check:contracts` OK. Playwright at 1792x1080: Super Admin list says Sensitive Nominations in the rail, breadcrumb,
  column 2 and title, no Species sensitivity item, Locations 6; every status badge inside its cell on both tabs at 1792, 1440 and
  1280 wide; Super Admin edits accepted NSS-2026-00009 (rating High shown, changed to Extreme, saved, still Accepted, Level 4);
  BioData Admin on submitted NSS-2026-00010 has Start review with Edit in "...", edits the justification with no rating fields,
  stays Submitted; Super Admin saves returned NSS-2026-00004 with no rating, status kept; an accepted, unrated nomination refuses
  Save with "Set a data release risk for Location", then saves at Low and lists Low, Level 2; NSS-2026-00005's current rating reads
  Coorong Medium and Nesting High from its own nomination; Registered User has no Edit on another's and gets the can't-edit page;
  a version 3 store holding its own NSS-2026-00010 comes back with it at NSS-2026-00014 and the seeds at 00010 to 00013; version
  1's list title. No console errors. Not committed.
