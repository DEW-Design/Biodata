---
paths:
  - "app/pages/_shared/map-search/**"
  - "app/pages/observations/**"
  - "app/pages/project-registration/**"
  - "app/pages/project-list/**"
  - "app/pages/project-detail/**"
  - "app/pages/_shared/project-*"
  - "app/pages/_shared/nominations/**"
  - "config/data-model-schema.ts"
---

<!-- Moved verbatim from CONTEXT.md on 2026-09-29, unchanged. Hand-maintained: edit in place. -->

# Reference: BDBSA domain research

What BDBSA is, the Project > Site > Visit > Occurrence > Observation model, access tiers, real partner organisations, the ingestion research. Rules live in CONTRACTS.md; this is the reasoning and the how-to behind them.

## BDBSA domain research

The `/pages/<page-name>/<variant>` explorations aren't built from invented content where the real thing is publicly
documented - the Biological Databases of South Australia (BDBSA) is a real DEW program with its own
published fact sheets, and every screen modelling it should stay consistent with what those actually
say. Captured here so the next screen/decision starts from the same grounding instead of re-deriving
or drifting from it. Sources:
[BDBSA overview](https://www.environment.sa.gov.au/topics/science/information-and-data/biological-databases-of-south-australia),
[BDBSA overview fact sheet (PDF)](https://data.environment.sa.gov.au/Content/Publications/bdbsa-overview-fact.pdf),
[BDBSA SuperTables overview (PDF)](https://data.environment.sa.gov.au/Content/Publications/bdbsa-supertable-overview-fact.pdf).

- **What it is.** BDBSA is DEW's centralised repository for South Australian flora/fauna specimen
  and observation records and taxonomic systems - it supports environmental management, research,
  and conservation planning by making biodiversity data accessible.
- **Data hierarchy: Project → Site → Observation → Occurrence.** Projects are the mandatory
  top-level container - **"all data entered into the BDBSA must be assigned to a project
  number."** This directly confirms the "Project as container" reframing from the other designer's
  Projects Figma (see `app/pages/project-detail/option-1`'s comment) and the nested-records tree
  already built there (Site/Observation/Occurrence/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom
  Event) - not an invented shape.
- **"If data does not belong with an existing BDBSA project, you can register a new project"** -
  by completing an online project registration form, or emailing DEWBioDataSupport@sa.gov.au. This
  is a real, sourced requirement for the "create a project inline while uploading a dataset that
  doesn't have one yet" flow discussed earlier (see the HoneyBook/Fabric Mobbin research) - it's not
  a hypothetical nicety, registered users will actually hit this constantly.
- **Real partner organisations named in BDBSA's own material: BirdLife Australia, Birds SA
  (SAOA), and the South Australian Museum.** `Birds SA` was already used as an example org in
  `project-list`'s sample rows - confirmed real, not a placeholder guess. `BirdLife Australia` and
  `South Australian Museum` are two more real names to reach for instead of inventing fresh ones in
  future example content.
- **Access tiers and sensitive data, at the project level.** BDBSA runs an open-access policy by
  default, but **"when a whole dataset is considered sensitive it will be flagged at the project
  level and only distributed under license or with appropriate approval"** - sensitive species'
  precise locations are withheld from general access even when the rest of a project's data is
  public. This is exactly the Level 1 (public) / Level 2 (DLA-licensed) split already named in
  `lib/registered-user-nav.ts`'s Observations/Projects items, and it's a project-level flag, not a
  per-record toggle - worth keeping in mind if/when that gets real UI.

### Data model ingestion research (`/proto/data-model-stress-test`, `/config/data-model`)

A real, working CSV/JSON/XLS/XLSX ingestion stress-test tool (`/proto/data-model-stress-test`) and
a companion transparency page (`/config/data-model`) were built to validate the corrected Event/
Occurrence/Observation model above against actual BDBSA legacy exports (real Site/Visit/Species
Fauna/Species Flora files, survey SU1211) - not just the Figma wireframes the field schema was
originally pulled from. `config/data-model-schema.ts` is the single source of truth both pages read
from - the real per-type field schema (`FIELD_SCHEMA`), the BDBSA-key crosswalk
(`BDBSA_KEY_CROSSWALK`), and the full, current gap list (`KNOWN_GAPS`, with a persisted per-field
"Verified" checkbox on `/config/data-model`) all live there, not duplicated here - **`/config/
data-model` is the canonical place to read the up-to-date gap list, not this file.**

- **Confirmed hierarchy: Project → Site → Visit → Observation - Site and Visit are both real,
  distinct levels.** Directly confirmed with the user after a live scoping question, since
  "observations roll into visits, visits roll into Project (or Survey)" genuinely read two ways
  (skip Site, or just describe the roll-up loosely). It does not skip Site.
- **Project has a real `id`: the Survey Number.** Every row of a real BDBSA export - Site, Visit,
  and Species alike - carries the same Survey Number; it's the one identifier that ties the whole
  hierarchy together, confirmed directly by the user and traced across real rows. Not a per-node
  field - a project-level structural column, same tier as Kind/Type/ID/Parent ID.
- **A real legacy export has no ID-based relationships at all - and the sandbox now derives them
  anyway.** Occurrence → Visit → Site is joined by a composite natural key (Survey Number +
  Zone/Easting/Northing to find the Site, then the Occurrence's own date column matched against
  that Site's visit date) - confirmed by tracing real rows across all 4 files, not assumed.
  `resolveNaturalKeyRelationships` in `/proto/data-model-stress-test` simulates that same traceback
  automatically: real Site/Visit/Occurrence rows get a synthetic ID where the source has none (Site
  from CAMPMAP-QUADSITE-PATCHQUAD or its own coordinates; Occurrence/Observation from the row's NSX
  species code + row number, see the classification entry below), then a derived Parent ID via the
  coordinate+date match, never overriding an explicit one already present. Verified against all 4
  real BDBSA files uploaded together: every record resolves correctly, Project id `1211` down
  through 14 Sites, 14 Visits, 837 Occurrences, and 837 Observations (1702 total records once every
  species row is split into its Occurrence/Observation pair - see below). A record whose Kind is
  known but whose Type isn't is still placed correctly in the Resolved tree - `unresolved` in
  `app/proto/data-model-stress-test/page.tsx` is deliberately keyed off Kind/Parent-shape validity
  only, not Type, since real placement doesn't depend on knowing the exact subtype.
- **Occurrence is a real tree level between Visit and Observation - "each row on the species CSVs
  are occurrences," per the user directly.** Not just a label: `expandSpeciesOccurrences` in
  `/proto/data-model-stress-test` splits every unclassified species row into two records before the
  rest of the pipeline ever runs - an Occurrence (the real-world "this species was recorded here")
  with exactly one Observation child (the ecological detail captured for it). This refines the
  earlier "Occurrences/Observations are always leaves" model rule - an Observation is still always
  a leaf, but an Occurrence may now parent exactly one thing, its own Observation, and nothing else.
  Scoped to this ingestion sandbox for now; the live product trees (`project-detail/option-1`,
  `observation-detail/option-1`) still show Occurrence as a leaf and haven't been revisited against
  this - see the `project_projects_data_model` memory.
- **Which Observation scaffold applies is now derivable, not a fabricated guess - closing the "No
  explicit Observation-type discriminator in real data" gap.** `classifySpeciesRow`
  (`config/data-model-schema.ts`) reads two real columns already on every species row - Taxonomic
  Type (in practice, which file a row came from: SPECIES_FAUNA_*/SPECIES_FLORA_*, since the real
  SPECIESTYPE/"Taxonomic Type" *column* only encodes a narrower group like Bird/Reptile/Plant, not
  literally "Flora"/"Fauna") and Number Observed:
  - Number Observed = "Present but not counted" → Observation:Community, Flora or Fauna alike.
    Originally stated as Flora-only; extended to Fauna once verifying against the real
    SPECIES_FAUNA export turned up the identical value on 4 real Fauna rows - confirmed directly
    with the user rather than silently assumed.
  - Fauna, Number Observed = 1 → Observation:Individual.
  - Fauna, Number Observed > 1 → Observation:Population - confirmed directly against the literal
    wording first suggested ("community observation"): Population is the type this schema actually
    built for a same-species headcount ("Number Observed"/"Cover-Abundance" are Population-only
    fields), Community is a different, whole-patch, multi-species concept.
  Occurrence's own type (Individual/Population) follows the same "one organism vs a group" read,
  independent of which Observation scaffold captures the detail underneath it. Verified against all
  4 real BDBSA files: 310 Individual, 46 Population, and 481 Community observations, 0 unresolved.
  Evidence also still suggests the 4-way Observation type split is a UI-level view over one shared
  species-observation schema, not 4 distinct data schemas: fields scoped Community/Population-only
  here (Crown Extent, DBH, Number Observed, Cover/Abundance) actually appear on every real species
  row regardless of type.
- **Sample/demo data must never self-describe its own bugs.** A deliberately-broken sample record's
  Label (or any other UI-visible field) has to look exactly like a real record would - flagged
  directly by the user off a screenshot: "the records ingested will not have these comments like
  'Quadrat parented under observation'... it's never going to have that. It's just going to be
  QUADRAT AB131 - whatever that might be called." What a broken sample row is actually testing
  belongs in a source-code comment beside it, never in a field the UI renders - applies to any
  future demo/sample data in this codebase, not just this one proto.
