# 2026-10-09 - Species sensitivity: attribute values, location areas, labelled ratings, bulk change page

- **Oct 9 2026: Species sensitivity: attribute values, location areas, labelled ratings, bulk change page.** Continues
  2026-10-09-03, on the designer's review of it:
  - **Bulk change didn't say which species were ticked, or offer whole species vs attributes.** The bar above the table now
    names them ("2 selected: Emu, Southern Brown Bandicoot", then "and N more") and its action is "Change N species", which
    opens a bulk change page (`/species-sensitivity/bulk?species=<slug>,<slug>`, `species-sensitivity-bulk.tsx`): the selected
    species with each one's current rating (which the new one replaces; a species can be taken out), then the same data
    release editor as a species' page, Whole species or Specific attributes. A page, not a modal.
  - **An attribute needs its value** ("a particular species in a particular location only"). Specific attributes now reuses
    the nomination form's attribute editor (`ConceptRows`, CONTRACTS 0.9) with the nomination's attribute list: Location as
    areas (`AreasEditor`: draw, shapefile, national park list, coordinates), then the project form's Occurrence and Observation
    fields, each with its own value control (Activity: Nesting; Observer: a person). Stored as the nomination's attribute rows
    (`NominationAttribute`) with a risk and level each. The editor is `species-sensitivity-editor.tsx`, shared by the species
    page and the bulk page.
  - **Location obfuscation was missing from view.** The treatments now use the figure's words (Open data; Coordinates
    obfuscated to 1 km² / 10 km², location text generalised; Embargoed or withheld data; No access). Each risk option shows
    its treatment beside its name, in the list and in the closed field (Low: Obfuscated 1 km²); the field's hint adds only that
    the location text is generalised too (Low, Medium); the list shows the treatment under each risk badge; the species page
    shows the full treatment under each rating.
  - **Unlabelled risk and level fields on an attribute.** Each attribute is its own card (Attribute 1, 2 ...): the attribute,
    its value, then "Data release risk" and "User access level" as labelled fields side by side.
  - The list's Applies to column names each rule with its value ("Location: Coorong National Park; Activity: Nesting").
  - The Fairy Tern seed is rated by attribute and value (Location: Coorong National Park, Medium L2; Activity: Nesting, High
    L3), the Bandicoot by Observer (a placeholder person). Store version 2: older saved ratings in a browser are reset to the
    seeds (they were preview data).
- **Open, for the designer:**
  - Adding an area opens the shared "Add a location" map picker (DLA, nominations), a modal. The designer asked for no modals
    here; drawing on a map needs room, so it was kept rather than rebuilt. Inline instead, or keep?
  - `AreasEditor`'s own copy says "Areas to obscure"; the figures say "obfuscated". Changing it changes the nomination form too.
  - The ratings across attributes are independent: a species could have Location at Low and the whole of its other data open,
    as intended; there is no "whole species plus stricter attributes" combination.
- Verified: `npx tsc --noEmit` (only the stale `.next` type), `npx eslint` on every touched file, `npm run check:contracts` OK;
  live browser pass as BioData Super Admin: the list (treatments, rule values), ticking two species (named in the bar), the bulk
  page (selected species with current ratings, Whole species and Specific attributes, Location with Add area), the Fairy Tern
  page (view with the park and treatments, edit prefilled, Save disabled until a change). No console errors. Test edits removed
  from this browser's storage. Not committed.
