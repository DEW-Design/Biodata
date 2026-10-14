# 2026-10-12 - Nominations version 2: the Super Admin rates what to protect while reviewing

- **Oct 12 2026: Nominations version 2: the Super Admin rates what to protect while reviewing.** The designer asked to combine
  the nomination's review and approval with the risk rating and the data access level, set on the record's What to protect tab,
  for version 2. This brings back, on the designer's request, part of what 2026-10-09-03 removed ("revert all changes done on
  all and my nominations"): now on What to protect, not as an extra step in the Accept modal.
  - **What to protect, under review, BioData Super Admin, version 2:** each thing protected gets a labelled Data release risk
    and User access level under its value (the whole species under Protection, else each attribute under its areas or value),
    borrowed from the species sensitivity editor's attribute card (`RiskSelect`, `AccessSelect`; a risk sets its standard level,
    a lower level can't be chosen). Each choice is kept on the nomination (`Nomination.ratings`, `setNominationRating`), so a
    reload keeps it before the decision.
  - **Accept** is refused until every thing protected has a risk: it opens What to protect, shows a "Ratings missing" alert
    naming them and marks each empty risk field. Once all are set, the confirmation says the rating is written to Species
    sensitivity, replacing the species' current one. Accepting saves it there (`ratingFromNomination`, `saveSpeciesRating`
    with the note "From nomination <id>", which the species' audit log shows).
  - **Accepted:** What to protect shows each rating read only (`RatingValue`, the species page's view).
  - Unchanged: version 1, a BioData Admin reviewing in version 2 (accepts as in version 1), the nominator's view, and the
    nomination form.
- **Open, for the designer:**
  - Accept replaces the species' rating. A species already rated for other attributes or areas loses those rules; merging
    instead (add the nomination's rules to the existing ones) is the alternative.
  - The two seeded accepted nominations (NSS-2026-00005, NSS-2026-00007) carry no ratings, so their What to protect shows none,
    although Species sensitivity has ratings from them.
  - Whether a BioData Admin should also rate in version 2, or hand the decision to the Super Admin (raised 2026-10-09-02).
  - Whether the nominator should see the rating once accepted (today only the Super Admin does).
  - Ratings can be set only while the nomination is under review, not when it is submitted.
- Verified: `npx tsc --noEmit` (only the stale `.next` type), `npx eslint` on every touched file, `npm run check:contracts`
  OK; Playwright at 1792x1080 as BioData Super Admin on NSS-2026-00001 (version 2): Accept with nothing set opens What to
  protect with the alert naming Location and Activity; Medium and High set Level 2 and Level 3; the choices survive a reload;
  the confirmation names Species sensitivity; after accepting, the ratings show read only and the species' latest change is
  "From nomination NSS-2026-00001" with both attribute rules. BioData Admin in version 2 and Super Admin in version 1 see no
  rating fields. One console warning ("state update on a component that hasn't mounted yet") appeared on a first load and
  appears on the committed code too, so it is not from this change. `/emil-typography` and `/emil-design-foundations` not
  run: no new text layer, the fields are the species sensitivity editor's. Not committed.
- **Oct 12 2026, continued: merge, seeded ratings, the current rating for admins.** The designer answered yes to merging and
  to seeding, and asked that the admin see the species' current risk and access level on the record and on the list.
  - **Merge, never replace** (`mergeRatings`, `addNominationRating`): a species not yet rated takes the nomination's rating;
    if either side is the whole species, the result is the whole species at the higher of the two (an attribute rating counts
    as its highest); if both are by attribute, the nomination's rules are added after the current ones, and a rule for the same
    attribute and value keeps the higher risk and level. The confirmation now says the rating is added to the species' current
    one.
  - **Seeds:** NSS-2026-00005 (Fairy Tern: Location Medium Level 2, Activity High Level 3) and NSS-2026-00007 (Southern Brown
    Bandicoot: Observer Low Level 2) carry the ratings Species sensitivity already holds from them. The nominations store
    moved to version 2 so a browser with saved nominations gets them too.
  - **Current rating, both admin roles (`nominationReview`), version 2:** the first row of What to protect, "Current rating",
    shows what Species sensitivity holds for the species now (Whole species, or each rule with its value, then "Every other
    attribute"), with the species page's rating view (`CurrentRatingValue`, built from `RatingValue`). The list gains a
    sortable "Current rating" column: the risk badge (the highest, where rated by attribute) over the access level, the same
    two-line treatment as the Species sensitivity list's risk cell. Column widths are set for both layouts (4.2f).
  - Not shown to the other roles, or in version 1. A BioData Admin still can't set ratings.
- **Open, for the designer:**
  - On an accepted nomination, Current rating and each attribute's accepted rating can say the same thing (Fairy Tern). They
    differ once a merge or a later edit changes the species; keep both, or drop the per-attribute one after acceptance?
  - Filtering the list by current rating (the Filter menu) is not added.
  - Whether the nominator should see the rating once accepted.
- Verified: tsc (stale `.next` type only), eslint on touched files, `npm run check:contracts` OK; Playwright: version 2 list
  shows Current rating for BioData Super Admin and BioData Admin, not for a Registered User or in version 1; sorted descending
  it runs High, Medium, Low, then Negligible; NSS-2026-00005 as BioData Admin shows the current rating and no rating fields;
  merge with a whole-species Low and the nomination's Medium and High gives whole species High Level 3; merge with an Activity:
  Breeding Extreme rule and an Observer rule keeps Extreme for Activity, keeps Observer and adds Location as rule 3. The same
  pre-existing "state update on a component that hasn't mounted yet" warning appeared on first loads. Not committed.
- **Oct 12 2026, continued: location nominations.** A first build (a location section inside the species form, its own create
  and edit routes, a Location sensitivity register, renamed column 2 headings) was reverted at the designer's word: it did not
  follow the context. Rebuilt as asked:
  - **Nominate a species or a location** (version 2): the list's create button is "Nominate" with a menu, Sensitive species (the
    existing form, unchanged) and Sensitive location, which opens the project form's own "Nominate Sensitive Location" panel
    (`LocationPickerPanel`, `project-registration/location-restriction.tsx`, now exported): location name, the area (Upload
    Shapefile, Draw on the Map, Choose from a List, Coordinates) and justification, then Save. Save submits it (the panel has no
    draft). The panel gained one opt-in prop, `initial`, so the nominator can update a nomination in the same panel; Add Project
    is unchanged. Version 1 keeps "Nominate a new species".
  - **The list:** titled "Sensitive nominations", with underline tabs, Species and Locations (with counts), each its own table,
    search and filter; All and My stay in column 2. Locations: Nomination, Location, Area, Nominated by, Status, Updated. For
    both admin roles the "Current rating" column became two, Data release risk (badge and treatment) and User access level, as on
    Species sensitivity; a location shows its rating once accepted, else "Not rated". Version 1 lists species only.
  - **A location's record page:** the same page, with "Sensitive location nomination", the place's area as a card and map
    under What to protect, one Data release risk and User access level for the Super Admin while under review (Accept refused
    until set), and the rating as Current rating once accepted. The rating stays on the nomination (no location register).
  - `Nomination.kind` and `location`; `saveLocationNomination`; the store moved to version 3 (drops the reverted build's records,
    adds two seeded location nominations: Naracoorte Caves bat maternity cave under review, Bool Lagoon breeding wetland accepted
    at High, Level 3). The switcher and the CSV export name a location nomination by its location.
- **Open, for the designer:**
  - The panel's button says "Save" (as in Add Project); for a nomination it submits. "Submit nomination" instead?
  - Location IDs share the NSS- series ("Nominate Sensitive Species").
  - A location's rating lives only on its nomination; where accepted locations are listed and changed later is not decided.
  - Home's pending-review count includes location nominations, while version 1's list does not show them.
- Verified: tsc, eslint, `npm run check:contracts` OK; Playwright at 1792x1080: as BioData Super Admin the version 2 list shows the
  tabs (Species 7, Locations 2) and the two rating columns; Nominate, Sensitive location opens the panel; a park from the list
  and a justification saved NSS-2026-00010 and opened its record; NSS-2026-00008's Accept is refused until a risk is set, then
  accepted at Medium, Level 2, shown on the record and the list; version 1 shows no tabs, 7 species rows and the old button; a
  Registered User sees the tabs without rating columns and their own location nomination. No console errors. Not committed.
- **Oct 12 2026, continued: the location nomination is the form, not the side panel; admins approve at once.** The designer:
  "the location nomination need not be a side bar ... same as nominating sensitive species layout and steps"; "it must say
  submit nomination for registered users and above. An admin and super admin can directly approve the nomination".
  - **Same form and steps.** `NominationForm` takes a kind: a location has Location (Location name, then Area with the project
    form's `GeoExtentPicker`, map in the Expand dialog), Justification, Review and submit, in column 2 as the species form's four
    sections. Version 2 has its own routes, `/version-2/new` (`?kind=location`) and `/version-2/<id>/edit`, so a nomination stays in
    version 2; the Nominate menu opens them. `LocationPickerPanel` is back as committed (no export, no `initial`).
  - **Submit or approve.** The last step's action is "Submit nomination" for a Registered User and the roles above who do not
    review. A BioData Admin or Super Admin gets "Approve nomination" (`CheckCircle`, through a new opt-in `primaryIcon` on
    `FormPage`) and "Review and approve" as the step's title: it is saved, then accepted by them (`approveNomination`). The Super
    Admin sets the data release risk and user access level on the Review step first (one pair per thing protected; Approve is
    refused with "Set a data release risk for ..." until each is set); a species' rating is then merged into Species sensitivity,
    as when reviewing. A BioData Admin approves without a rating, as in review.
- **Open:** a nomination a BioData Admin approves has no rating ("Not rated" in the list); whether the Super Admin then rates it.
  Version 1's form, the header's Add menu and Home's quick action still open version 1's species form.
- Verified: tsc, eslint, `npm run check:contracts` OK; Playwright: Registered User, Nominate, Sensitive location opens the form
  (3 sections), Continue with nothing filled names both fields, Review shows "Submit nomination" and no rating, submit opens the
  record; Super Admin, location: Approve refused until a risk is set, then accepted; Super Admin, species Emu, All data, Low:
  approved and Species sensitivity's latest change is Emu, whole species, Low, Level 2, "From nomination"; BioData Admin,
  location: "Approve nomination", no rating fields, accepted, listed as Not rated; version 1's form keeps its four sections. No
  console errors. Not committed.
