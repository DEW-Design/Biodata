# 2026-10-09 - Species sensitivity: attribute ratings, bulk change, access never below the risk

- **Oct 9 2026: Species sensitivity: attribute ratings, bulk change, access never below the risk.** Continues
  2026-10-09-02. The designer's feedback on the first build:
  - **Nominations are unchanged.** "Revert all changes done on all and my nominations": the Data release risk column on the
    list, the rating rows, "Change data release" and the rating step in Accept on the nomination record are removed. What
    the Super Admin configures is a separate screen, "Species sensitivity" in column 2 of Nominations version 2 (the item
    was "Species register"). Only the version-aware links stay in the nomination files.
  - **The access rule (question 2, answered "go with your recommendations"):** a level may be the risk's standard one or
    higher, never lower (`isAccessAllowed`); the lower levels are disabled in every access select, and choosing a risk sets
    its standard level.
  - **Whole species or specific attributes.** A rating covers the whole species, or only chosen attributes, each with its
    own risk and level. The attributes are the Occurrence and Observation fields of the project form (`SPECIES_CONCEPTS`,
    less "Other"). Attributes not listed stay Negligible and Level 1. Switching from attributes to the whole species starts
    from the highest attribute rating, so protection is never dropped by the switch.
  - **No modal.** A row opens the species' own page (`/species-sensitivity/<species>`), a record page (4.6) edited in place
    (4.8), borrowed from Taxonomy's species page: Edit data release, the editing treatment, Cancel and Save changes in the
    footer, the discard confirmation (the one prompt kept). Tabs: Data release, Audit log (AuditLog and AuditFeed, the
    risk as the status, what changed as the note).
  - **The list at scale:** columns Species, Applies to (Whole species, or the attributes named), Data release risk (the
    highest, as a badge), User access level, Last changed. Sorted by risk, highest first. Negligible is now a gray badge,
    not green, so the few rated species stand out among thousands. Filters: risk, level, applies to, group.
  - **Bulk change:** checkboxes on the table; with rows ticked, a bar above the table sets one risk and level for the whole of
    each species, applied with "Apply to N species" (no Apply-then-confirm modal). With nothing ticked a row click opens the
    species; with rows ticked a row click ticks it (react-aria toggle behaviour). The header checkbox ticks the page in view.
    First table with bulk selection in the app (0.9 item 3: named here, asked for by the designer).
  - **Seeds:** every risk and every level appears at least once among the 21 species (the designer asked for that). The
    ratings are illustrative, not DEW's: Orange-bellied Parrot Extreme L4, Yellow-footed Rock-wallaby High L3, Malleefowl
    Medium L2, Southern Hairy-nosed Wombat Medium L3 (shows a level above the standard), Pygmy Bluetongue Lizard Low L2,
    Fairy Tern by attribute (Location Medium L2, Activity High L3), Southern Brown Bandicoot by attribute (Observer Low L2).
- **Open, for the designer:**
  - Bulk change sets the whole species only; bulk by attribute is not built. Ticking "all 15,000 that match a filter" (beyond
    the page in view) is not built.
  - The species' rating does not yet link to its nominations (an accepted nomination is named in the audit log note only).
  - The list's risk for a species rated by attribute is its highest; whether that reads clearly enough at a glance.
  - In dev, the first visit to a route that has not compiled yet briefly landed on its parent page; a second visit loads it.
    Not seen once compiled. Not investigated further.
- Verified: `npx tsc --noEmit` (only the stale `.next` type for the removed project-detail option 2), `npx eslint` on every
  touched file, `npm run check:contracts` OK; live browser pass as BioData Super Admin (list, bulk change with Level 1
  disabled for Medium, species page view and edit, empty-attribute validation, whole-species switch, save, audit log) and
  BioData Admin (restriction), no console errors. Test edits removed from this browser's storage afterwards. Not committed.
