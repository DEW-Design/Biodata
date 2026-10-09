# 2026-10-09 - Nominations version 2: species register for the BioData Super Admin

- **Oct 9 2026: Nominations version 2: species register for the BioData Super Admin.** The designer asked for an elevated
  Nominate Sensitive Species for the BioData Super Admin: on top of the nominations, rate every species' data release risk
  and user access level, view them in a table, search for one and change it, and control both for nominated species too.
  Built as a second version, compared with the Version tool on the Prototype tools bar (`NominationVersionTool`,
  `_shared/nominations/nomination-version.tsx`):
  - Version 1, `/pages/nominations`: unchanged.
  - Version 2, `/pages/nominations/version-2` (list), `/version-2/<id>` (record), `/version-2/species-register`.
  - **The scales** come from the DEW figures the designer shared ("Risk Ratings and Treatments", Figures 2 to 7), in
    `species-sensitivity.ts`: risk Negligible, Low (1 km2), Medium (10 km2), High (embargoed or withheld), Extreme (no access);
    access Level 1 Public, Level 2 DLA, Level 3 Government, Level 4 Admin only. Every species starts at Negligible and
    Level 1 (the designer). Badge colours follow the pyramid's bands (success, sky, blue, orange, error).
  - **Species register** (column 2 item under All and My nominations, Super Admin only): the collection list (4.2) with
    search by common, scientific or family name, the Filter menu (risk, access level, group), sort by risk descending so the
    rated species come first, and Last changed (date, who, the nomination that made it). A row opens a Change modal (no
    species record page exists here). Export CSV exports the register while it is open.
  - **Nominated species:** the Super Admin's Accept asks for the risk and level (prefilled with the species' current
    rating) and records the change against the nomination; "Change data release" in the record's "..." menu edits it any
    time; the Overview shows both; the list gains a Data release risk column. A BioData Admin still accepts as in version 1.
  - Picking a risk proposes the level the figures pair with it (`STANDARD_ACCESS`); the level can still be changed, and the
    hint says when it differs from the usual one.
  - New feature key `speciesSensitivity`, in `SUPER_ADMIN_ONLY`; the register route is in `wholePageGates`.
  - Seeds are not invented ratings: the 4 species the shared dataset already holds as Level 2 records are Low / Level 2, and
    the two accepted nominations are rated as their decision notes describe (Fairy Tern Medium, Southern Brown Bandicoot Low).
- **Open, for the designer:**
  - Scale: the preview dataset has 21 real species, not 15,000. Placeholder rows were not generated (CONTRACTS 0.3); a
    clearly-labelled scale test needs the designer's say-so.
  - May the access level be set below the standard one for a risk (Extreme with Level 1)? Today it is allowed with a hint.
  - Should a BioData Admin who accepts a nomination also rate the species, or hand it to the Super Admin?
  - Bulk change (select many species, set one rating) is not built.
  - Should the risk and level be shown to the nominator, or only to the Super Admin (today only the Super Admin)?
  - The register lives under Nominations; Taxonomy Management is the other candidate home.
- Verified: `npx tsc --noEmit` (only a stale `.next` type for the removed project-detail option 2), `npx eslint` on every
  touched file, `npm run check:contracts` OK; live browser pass as BioData Super Admin (register, change modal, record,
  Accept modal, version 2 list) and BioData Admin (version 2 list without register or risk), no console errors. Not committed.
