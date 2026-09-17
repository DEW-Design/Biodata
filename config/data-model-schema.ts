// The real BDBSA ingestion field schema - the single source of truth both `/proto/data-model-
// stress-test` (the interactive upload/validation sandbox) and `/config/data-model` (the
// transparent, human-reviewable reference) read from. Kept here, not duplicated in either
// consumer - two independent copies of ~130 field names would drift the moment one changed, the
// same reasoning `ALL_SCHEMA_FIELD_NAMES` already existed for.
//
// Every field name below is real, pulled directly from that type's own Figma ingestion-template
// frame (Site: `YMproGZfrFB5jUqPHPxMhk` node `1970-143360`; Visit: node `1970-143651`; Observation
// Non-biotic/Community/Individual/Population: nodes `1970-146387`/`1970-146929`/`1970-147841`/
// `1970-148287`) - values always stripped, per the user directly: "we need to strip out any
// 'value' that's visible in these wireframes."

export type RecordKind = "Event" | "Occurrence" | "Observation";

export const VALID_TYPES_BY_KIND: Record<RecordKind, string[]> = {
  Event: ["Site", "Transect", "Ramble", "Quadrat", "Visit"],
  Occurrence: ["Individual", "Population"],
  Observation: ["Individual", "Non-biotic", "Community", "Population"],
};

export function isRecordKind(value: string): value is RecordKind {
  return value === "Event" || value === "Occurrence" || value === "Observation";
}

// "Each row on the species CSVs are occurrences - if there's 10 rows, that's 10 occurrences. This
// is just a nuance that sits between visits and observations" - per the user directly, closing the
// "No explicit Observation-type discriminator in real data" gap this file used to carry (see the
// removed `KNOWN_GAPS` entry below). Confirmed live, in this order:
// - Occurrence is a real tree level, not just a label: Visit -> Occurrence -> Observation. Every
//   species-CSV row becomes its own Occurrence record, which has exactly one Observation child.
// - Fauna, Number Observed > 1 resolves to Observation:Population, not the literally-stated
//   "community observation" - confirmed directly against this schema's own field list: "Number
//   Observed"/"Cover-Abundance" are already Population-only fields above, built for exactly this
//   case ("a count of the same species together"), while Community's schema is a whole-patch,
//   multi-species vegetation assessment (Crown Extent, DBH, canopy fields) - a different concept.
//
// The classification itself needs only two real columns already on every species row - Taxonomic
// Type (Flora/Fauna - in practice read from which file a row came from, SPECIES_FAUNA_*/
// SPECIES_FLORA_*, since the real SPECIESTYPE/"Taxonomic Type" column encodes a narrower taxonomic
// group like Bird/Reptile/Plant, not literally "Flora"/"Fauna" - see `/proto/data-model-stress-
// test`'s `expandSpeciesOccurrences` for how the file-name signal is derived and threaded through)
// and Number Observed:
// - Number Observed = "Present but not counted" -> Observation:Community, Flora or Fauna alike.
//   Originally stated as a Flora-only rule, extended to Fauna once verifying against the real
//   SPECIES_FAUNA export turned up the identical value on 4 real Fauna rows - confirmed directly
//   with the user rather than assumed: same value, same underlying meaning (a presence noted
//   without an individual count) regardless of species type.
// - Fauna, Number Observed = 1 -> Observation:Individual.
// - Fauna, Number Observed > 1 -> Observation:Population.
// A numeric Flora count (anything other than "Present but not counted") isn't itself something the
// user directly confirmed - it follows the same 1-vs-many split as Fauna below, since it's the same
// field with the same meaning either way, rather than being left unhandled.
//
// Occurrence's own type (already a narrower Individual/Population list above, not Observation's
// four) follows the same "one organism vs a group" read of the row - Individual only when exactly
// one organism was counted, Population otherwise - independent of which Observation scaffold
// captures the ecological detail underneath it.
export type TaxonomicType = "Flora" | "Fauna";

export interface OccurrenceClassification {
  occurrenceType: "Individual" | "Population";
  observationType: "Individual" | "Community" | "Population";
}

// Returns `null` when Number Observed is neither "Present but not counted" nor a real positive
// count - an unrecognised value leaves the row unclassified rather than guessing. `taxonomicType`
// is still a required input (not everything about the row can be inferred from Number Observed
// alone - a numeric count still needs Flora/Fauna to know it applies at all), it just no longer
// gates the "Present but not counted" branch.
export function classifySpeciesRow(taxonomicType: TaxonomicType, numberObserved: string): OccurrenceClassification | null {
  const normalized = numberObserved.trim().toLowerCase();
  if (normalized === "present but not counted") {
    return { occurrenceType: "Population", observationType: "Community" };
  }
  const count = Number(numberObserved);
  if (!Number.isFinite(count) || count <= 0) return null;
  if (count === 1) return { occurrenceType: "Individual", observationType: "Individual" };
  return { occurrenceType: "Population", observationType: "Population" };
}

// Keyed by `${kind}:${type}`. A record whose kind:type has an entry here gets exactly that
// schema's own fields, always shown even when blank (matching how the real templates render every
// field, dash if empty) - any other populated column either belongs to a *different* type's schema
// (a real mistake) or is a genuinely novel name (a legitimate Custom Property field). A `kind:type`
// with no entry here (Occurrence's two types, Transect/Ramble/Quadrat - no template provided yet)
// falls back to generic passthrough - see `/config/data-model` for the full reasoning and the known
// gaps this schema doesn't cover yet.
//
// Two real limitations, deliberately not modelled - logged at `/config/data-model`, not built
// speculatively:
// - **Repeating sub-tables aren't modelled as columns.** Community's "Assemblage Information" and
//   "Overstorey Measurements", and Individual's "Measurements" are each an open-ended list of rows,
//   not a fixed field - a flat CSV/JSON field can't represent "however many rows the user added."
//   Overstorey's own *aggregate* fields (Overstorey Height Average, ...) are included; the raw
//   repeating rows are not.
// - **Units are a separate, explicit concept (`FIELD_UNITS` below), never baked into the field
//   name.** Originally "DBH (mm)"/"Weight (gms)" - reverted per the user directly once cross-
//   checking against a real BDBSA export confirmed the real column is just "Weight"/"DBH", no unit
//   suffix, so the old naming could never auto-match it. Field names here now match the real
//   column exactly; the unit (when one applies) lives in `FIELD_UNITS`, keyed the same way.
export const FIELD_SCHEMA: Record<string, string[]> = {
  "Event:Site": [
    "Legacy Site ID",
    "Site Name",
    "Description",
    "Site Grouping",
    "Specific Property Details",
    "Altitude",
    "Mud Map",
    "Paddock",
    "Site Comment",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Location Details",
    "IBRA Region",
    "IBRA Sub Region",
    "Location Method",
    "Datum",
    "Reliability",
    "Sample Site Dimensions",
    "Location Comment",
    "Photopoint Marker Present",
    "Photopoint Disc Number",
    "Photopoint Direction",
  ],
  "Event:Visit": [
    "Legacy Visit ID",
    "Visit Name",
    "Description",
    "Visit Seq No.",
    "Source ID",
    "Visit Comment",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Start Date",
    "End Date",
    "Duration",
    "Date Accuracy",
    "Photopoint Marker Present",
    "Photopoint Disc Number",
    "Photopoint Direction",
  ],
  "Observation:Non-biotic": [
    "Description",
    "Fire Scars",
    "Bare Earth Estimate",
    "Litter Estimate",
    "Climatic Condition",
    "Disturbance Impact",
    "Disturbance Impact Description",
    "Observation Comment",
    "Site Slope",
    "Site Aspect",
    "Land Form Pattern",
    "Land Form Element",
    "Geological Surface",
    "Outcrop Cover",
    "Outcrop Lithology",
    "Surface Strew Size",
    "Surface Strew Cover",
    "Surface Strew Lithology",
    "Soil Texture Class",
    "Landform Comment",
    "Landscape Context Score",
    "IBRA Association",
    "IBRA Subregion",
    "Vegetation Cover",
    "Block Shape",
    "Number of Landform Features within Block",
    "Air Temperature Max",
    "Air Temperature Min",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Start Date",
    "End Date",
    "Duration",
    "Date Accuracy",
    "Location Details",
    "IBRA Region",
    "IBRA Sub Region",
    "Location Method",
    "Datum",
    "Reliability",
    "Sample Site Dimensions",
    "Location Comment",
    "Zone",
    "Easting",
    "Northing",
    "Latitude",
    "Longitude",
  ],
  "Observation:Community": [
    "Description",
    "Vegetation Conditions",
    "SA Structural Formation",
    "Disturbance Impact",
    "Disturbance Impact Description",
    "Ephemerals Present?",
    "Observation Comment",
    "Landscape Context Score",
    "IBRA Association",
    "IBRA Subregion",
    "Vegetation Cover",
    "Block Shape",
    "Native Veg. Remaining",
    "Native Veg. Protected",
    "Wetland/Riparian",
    "Number of Landform Features within Block",
    "Does the Block Contain a Wetland Feature?",
    "Canopy Type",
    "Projected Foliage Cover",
    "Overstorey Height Average",
    "Crown Depth Average",
    "Canopy Diameter Average",
    "Gaps Average",
    "Crown Separation Ratio",
    "Overstorey Measurement Count",
    "Crown Extent",
    "Crown Extent Score",
    "Crown Density",
    "Crown Density Score",
    "Extent of Reproduction",
    "Extent Bark Cracking",
    "DBH",
    "Leaf Die off",
    "New Tip Growth",
    "Epicormic Growth",
    "Mistletoe Load",
    "Leaf Damage",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Start Date",
    "End Date",
    "Duration",
    "Date Accuracy",
    "Location Details",
    "IBRA Region",
    "IBRA Sub Region",
    "Location Method",
    "Datum",
    "Reliability",
    "Sample Site Dimensions",
    "Location Comment",
    "Zone",
    "Easting",
    "Northing",
    "Latitude",
    "Longitude",
  ],
  "Observation:Individual": [
    "Description",
    "Observation Comment",
    "Line",
    "Life Form",
    "Life Form Description",
    "Collection Method",
    "Collection Method Description",
    "Strata",
    "Strata Description",
    "Macro Habitat",
    "Macro Habitat Description",
    "Micro Habitat",
    "Micro Habitat Description",
    "Activity",
    "Association Dominance",
    "Sex",
    "Regeneration",
    "Weight",
    "Height",
    "Gravid?",
    "Teats",
    "Vagina",
    "Pouch Status",
    "No. in Pouch",
    "Testes",
    "Animal Life Stage",
    "Plant Life Stage",
    "Planted/Released",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Start Date",
    "End Date",
    "Duration",
    "Date Accuracy",
    "Location Details",
    "IBRA Region",
    "IBRA Sub Region",
    "Location Method",
    "Datum",
    "Reliability",
    "Sample Site Dimensions",
    "Location Comment",
    "Zone",
    "Easting",
    "Northing",
    "Latitude",
    "Longitude",
  ],
  "Observation:Population": [
    "Description",
    "Observation Comment",
    "Number Observed",
    "Line",
    "Is Annual Herb?",
    "Life Form",
    "Life Form Description",
    "Collection Method",
    "Collection Method Description",
    "Strata",
    "Strata Description",
    "Macro Habitat",
    "Macro Habitat Description",
    "Micro Habitat",
    "Micro Habitat Description",
    "Cover/Abundance",
    "Cover/Abundance Description",
    "Activity",
    "Association Dominance",
    "Animal Life Stage",
    "Plant Life Stage",
    "Planted/Released",
    "Observer 1",
    "Observer 2",
    "Observer 3",
    "Start Date",
    "End Date",
    "Duration",
    "Date Accuracy",
    "Location Details",
    "IBRA Region",
    "IBRA Sub Region",
    "Location Method",
    "Datum",
    "Reliability",
    "Sample Site Dimensions",
    "Location Comment",
    "Zone",
    "Easting",
    "Northing",
    "Latitude",
    "Longitude",
  ],
};

export const ALL_SCHEMA_FIELD_NAMES = Array.from(new Set(Object.values(FIELD_SCHEMA).flat()));

// Units, kept separate from the field name itself - "let's actually get rid of any units in the
// concept names, like Weight (gms) - let's just keep Weight... handle that in the units bit in the
// json," per the user directly. Keyed the same way as `FIELD_SCHEMA` (`${kind}:${type}`, then field
// name), read by `serializeIngestedFields` in the sandbox to add a real `// Unit: gms` annotation
// next to the field in the exported JSON - the same annotation mechanism already used for
// `// double check this` and `// BDBSA: <key>`, just a third, independent note. Only fields that
// genuinely carry a real-world unit are listed; everything else has none, honestly (no invented
// units for e.g. a text or code field).
export const FIELD_UNITS: Record<string, Record<string, string>> = {
  "Observation:Non-biotic": {
    "Bare Earth Estimate": "%",
    "Litter Estimate": "%",
    "Landscape Context Score": "pts",
  },
  "Observation:Community": {
    "Landscape Context Score": "pts",
    "Crown Extent": "%",
    "Crown Density": "%",
    DBH: "mm",
  },
  "Observation:Individual": {
    Weight: "gms",
    Height: "cm",
  },
};

// Real, confirmed findings from hand-checking this schema against 4 actual BDBSA legacy exports
// (SITE/VISIT/SPECIES_FAUNA/SPECIES_FLORA, survey SU1211) - not hypothetical. Rendered at
// `/config/data-model` so they stay visible and reviewable rather than buried in a proto file's
// comments. Each one is a real decision still waiting to be made, not a bug to silently patch.
export interface KnownGap {
  title: string;
  description: string;
}

export const KNOWN_GAPS: KnownGap[] = [
  {
    title: "No species-identity field",
    description:
      'Real Observation:Individual/Population data always carries an "NSX code" (the species\' real BDBSA identifier) - nothing in our schema captures "which species" at all today.',
  },
  {
    title: "Real column names rarely match our schema's field names",
    description:
      'Confirmed empirically: METHODNR vs "Collection Method", STRATANR vs "Strata", MICROHABNR vs "Micro Habitat" share no normalizable text at all. Case/spacing-insensitive matching (what this tool does today) cannot bridge this - it needs an explicit BDBSA-Key-to-Field crosswalk table, not fuzzy name matching.',
  },
  {
    title: "Community/Population-only fields appear on every species row in real data",
    description:
      "Crown Extent %, DBH, Number Observed, and Cover/Abundance - scoped here as Community-only or Population-only - actually appear on every row of the real SPECIES_FAUNA and SPECIES_FLORA exports, fauna and flora alike. Strong evidence the real BDBSA system stores one shared species-observation schema, and our 4-way Individual/Population/Community/Non-biotic split is a UI-level view over it, not 4 distinct data schemas.",
  },
  {
    title: "Observers is one column in real data, not three",
    description:
      'We modelled "Observer 1"/"Observer 2"/"Observer 3" from the Site/Visit Figma frames. Real SPECIES data stores this as a single "Observers"/"COLLECTORNR" column.',
  },
  {
    title: "Duplicate column headers silently lose data",
    description:
      'The real SPECIES_FLORA export has "Date Accuracy" as a column header twice (once for Observation Date, once for Determination Date). This tool\'s row model is a plain object keyed by column name, so the second occurrence silently overwrites the first - confirmed data loss, with no warning shown today.',
  },
  {
    title: '"Source ID" doesn\'t exist on Visit in real data at all - only Observations have it',
    description:
      'Revised once the real VISIT export was fully hand-checked: it carries no SOURCEID/"Source ID" column at all. The real column only exists on Species rows (SOURCEID/"Source ID") - our schema has this backwards, modelling it on Event:Visit and not on any Observation type.',
  },
  {
    title: "Site has no coordinate fields in our schema, but every real Site row has them",
    description:
      "Event:Site's own field list has no Zone/Easting/Northing - yet the real SITE export carries OLDZONE/OLDEASTING/OLDNORTHING (plus a second EAST/NORTH pair, purpose unconfirmed) on every row, and the sandbox already reads them internally for its own natural-key traceback. They're just never shown or validated as real Site fields.",
  },
  {
    title: "Non-biotic's landform/geology/soil fields actually live on the real Site record",
    description:
      'Site Slope, Site Aspect, Land Form Pattern/Element, Geological Surface, Outcrop Cover/Lithology, Surface Strew Size/Cover/Lithology, and Soil Texture Class - modelled here as an Observation:Non-biotic field - are all real columns on the SITE export (SITESLOPE, SITEASPECT, LANDFORMPATNCODE, ...), not a separate Observation row captured per visit.',
  },
  {
    title: "Visit's real observer model is per-taxonomic-group, not 3 generic Observer fields",
    description:
      'The real VISIT export has no generic "Observer 1/2/3" at all - instead, up to 5 observer slots for each of 8 taxonomic groups (Mammal, Reptile, Amphibian, Bird, Plant, Fish, Physical, Invertebrate - e.g. MAMOBS1..MAMOBS5, BIRDOBS1..BIRDOBS5), 40 real columns in total. A materially different shape from what this schema assumes for every type that carries "Observer 1/2/3".',
  },
  {
    title: "No Latitude/Longitude anywhere in real data",
    description:
      "Every real coordinate across all 4 files is a projected Zone/Easting/Northing grid reference - none of the real exports carry a Latitude/Longitude pair at all, even though every Observation type's own schema includes both.",
  },
  {
    title: "Photopoint fields are split across Site and Visit, not identical on both",
    description:
      'Our schema lists the same 3 Photopoint fields on both Event:Site and Event:Visit. Real data splits them: "Marker Present"/"Disc Number" (ISPHOTOPOINT/PHOTODISCNR) are on Site; "Direction" (PHOTODIRECTION) is on Visit - neither file has all 3.',
  },
];

// The crosswalk itself - "my only ask was to have BDBSA key mapped to the template," per the user
// directly, after an earlier pass mistakenly replaced our own Figma-shaped field names with raw
// BDBSA ones for an unclassified upload. That was the wrong fix: this map instead annotates our
// existing template with each field's real BDBSA column, without ever changing our own field names.
//
// Keyed by `${kind}:${type}`, then by our own field name. Three honest states per field, not two:
// - a string value: the confirmed real BDBSA column name for that field. A handful of fields have
//   no single real column at all - a genuinely composite key, or the same real-world value spelled
//   two different ways across files - noted as a short string (e.g. "CAMPMAP + QUADSITE + PATCHQUAD
//   (composite, no single ID column)") rather than forced into a fake single column name.
// - `null`: hand-checked against the real export and confirmed there is genuinely no equivalent
//   column (e.g. "Description" - Figma has it, the legacy system never captured it).
// - absent from the map entirely: not yet hand-checked - say nothing, rather than guess.
//
// All 6 real-schema'd types are now hand-checked against the 4 real BDBSA exports (SITE/VISIT/
// SPECIES_FAUNA/SPECIES_FLORA, survey SU1211) - "I believe this should be considered now," per the
// user directly, once Site/Visit's own real headers and the species classification work
// (`classifySpeciesRow` above) had already been fully read and traced. Previously only
// `Observation:Individual`/`Observation:Population` were checked (and even then, missed
// Zone/Easting/Northing/Latitude/Longitude entirely - fixed below via `GEO_CROSSWALK`). Several new,
// real structural findings surfaced doing this full pass - see the new `KNOWN_GAPS` entries below
// for each one, rather than silently folding them into the mapping with no record of what changed.
//
// `LOCATION_META_CROSSWALK`/`GEO_CROSSWALK` factor out the two field blocks that repeat, verbatim,
// across several types' own Figma templates (a "where is this, and how well do we know it" trailer,
// and a Zone/Easting/Northing/Latitude/Longitude coordinate block) - confirmed real per-type
// mappings, not an assumption that every type shares identical real data.
const LOCATION_META_CROSSWALK: Record<string, string | null> = {
  "Location Details": null,
  "IBRA Region": null,
  "IBRA Sub Region": null,
  "Location Method": null,
  Datum: null,
  Reliability: null,
  // VEGQUADSIZE1/VEGQUADSIZE2 (a length x width pair, a real composite, not one column) are
  // captured once per Visit in real data - overridden back to `null` on Event:Site below, since a
  // Site can have more than one Visit, each with its own quadrat size.
  "Sample Site Dimensions": "VEGQUADSIZE1 + VEGQUADSIZE2 (composite, captured per Visit)",
  "Location Comment": null,
};

// Real data has no Latitude/Longitude anywhere in any of the 4 files - every real coordinate is a
// projected Zone/Easting/Northing grid reference (see the new Known Gap below).
const GEO_CROSSWALK: Record<string, string | null> = {
  Zone: "OLDZONE",
  Easting: "OLDEASTING (Site/Species files) / easting (Visit - no OLD prefix there)",
  Northing: "OLDNORTHING (Site/Species files) / northing (Visit - no OLD prefix there)",
  Latitude: null,
  Longitude: null,
};

const SPECIES_SHARED_CROSSWALK: Record<string, string | null> = {
  Description: null,
  "Observation Comment": "SPCOMM",
  Line: "LINENR",
  "Life Form": "MUIRCODE",
  "Life Form Description": null,
  "Collection Method": "METHODNR",
  "Collection Method Description": null,
  Strata: "STRATANR",
  "Strata Description": null,
  "Macro Habitat": "MACROHABNR",
  "Macro Habitat Description": null,
  "Micro Habitat": "MICROHABNR",
  "Micro Habitat Description": null,
  Activity: "ACTIVITY",
  "Association Dominance": "ASSOCDOMINANCE",
  "Animal Life Stage": null,
  "Plant Life Stage": null,
  "Planted/Released": "PLANTEDRELEASED",
  // Real data has no generic Observer 1/2/3 slots at all on a species row - a single "Observers"/
  // COLLECTORNR column instead (see the existing "Observers is one column" Known Gap above) - null
  // here because that one column doesn't map 1:1 onto any specific "Observer N" slot.
  "Observer 1": null,
  "Observer 2": null,
  "Observer 3": null,
  "Start Date": null,
  "End Date": null,
  Duration: null,
  "Date Accuracy": "DATEACCURACY",
  ...LOCATION_META_CROSSWALK,
  ...GEO_CROSSWALK,
};

export const BDBSA_KEY_CROSSWALK: Record<string, Record<string, string | null>> = {
  "Event:Site": {
    "Legacy Site ID": "CAMPMAP + QUADSITE + PATCHQUAD (composite, no single ID column)",
    "Site Name": "CAMPNAME",
    Description: null,
    "Site Grouping": null,
    "Specific Property Details": "PROPERTY",
    Altitude: "ALTITUDE",
    "Mud Map": "MAPCODE",
    Paddock: "PADDOCK",
    "Site Comment": null,
    "Observer 1": null,
    "Observer 2": null,
    "Observer 3": null,
    ...LOCATION_META_CROSSWALK,
    "Sample Site Dimensions": null, // overridden - see `LOCATION_META_CROSSWALK`'s own comment
    "Location Details": "LOCSHORTDESC",
    "Location Comment": "LOCCOMM",
    "Location Method": "LOCMETHODNR",
    Datum: "OLDLOCDATUMNR",
    Reliability: "RELIABNR",
    "Photopoint Marker Present": "ISPHOTOPOINT",
    "Photopoint Disc Number": "PHOTODISCNR",
    "Photopoint Direction": null, // the real column (PHOTODIRECTION) is on Visit, not Site
  },
  "Event:Visit": {
    "Legacy Visit ID": null,
    "Visit Name": null,
    Description: null,
    "Visit Seq No.": "FIELDSEQNR",
    "Source ID": null, // the real SOURCEID/"Source ID" column only exists on Species rows, not Visit at all
    "Visit Comment": "VISITCOMM",
    "Observer 1": null,
    "Observer 2": null,
    "Observer 3": null, // real data has no generic Observer slots on Visit at all - see the new Known Gap
    "Start Date": "EDITED_VISIT",
    "End Date": null,
    Duration: null,
    "Date Accuracy": null,
    "Photopoint Marker Present": null, // the real column (ISPHOTOPOINT) is on Site, not Visit
    "Photopoint Disc Number": null, // the real column (PHOTODISCNR) is on Site, not Visit
    "Photopoint Direction": "PHOTODIRECTION",
  },
  "Observation:Non-biotic": {
    Description: null,
    "Fire Scars": "ISFIRESCARS",
    "Bare Earth Estimate": "ESTIMBAREEARTH",
    "Litter Estimate": "ESTIMLITTER",
    "Climatic Condition": "CLIMATECOND",
    "Disturbance Impact": null,
    "Disturbance Impact Description": null,
    "Observation Comment": "HABITATCOMM",
    // The next 9 fields are all real columns - but on the Site record, not a separate Observation
    // row. See the new "Non-biotic's landform/geology/soil fields live on Site" Known Gap.
    "Site Slope": "SITESLOPE",
    "Site Aspect": "SITEASPECT",
    "Land Form Pattern": "LANDFORMPATNCODE",
    "Land Form Element": "LANDFORMNR",
    "Geological Surface": "GEOSURCODE",
    "Outcrop Cover": "OUTCROPNR",
    "Outcrop Lithology": "OUTLITHNR",
    "Surface Strew Size": "STREWSIZENR",
    "Surface Strew Cover": "STREWCOVERNR",
    "Surface Strew Lithology": "STRLITHNR",
    "Soil Texture Class": "TEXCLASSCODE",
    "Landform Comment": null,
    "Landscape Context Score": null,
    "IBRA Association": null,
    "IBRA Subregion": null,
    "Vegetation Cover": null,
    "Block Shape": null,
    "Number of Landform Features within Block": null,
    "Air Temperature Max": null,
    "Air Temperature Min": null,
    "Observer 1": null,
    "Observer 2": null,
    "Observer 3": null,
    "Start Date": null,
    "End Date": null,
    Duration: null,
    "Date Accuracy": null,
    ...LOCATION_META_CROSSWALK,
    ...GEO_CROSSWALK,
  },
  "Observation:Community": {
    Description: null,
    "Vegetation Conditions": "VEGCONDNR",
    "SA Structural Formation": "STRFORMATIONNR",
    "Disturbance Impact": null,
    "Disturbance Impact Description": null,
    "Ephemerals Present?": null,
    "Observation Comment": "SPCOMM",
    "Landscape Context Score": null,
    "IBRA Association": null,
    "IBRA Subregion": null,
    "Vegetation Cover": null,
    "Block Shape": null,
    "Native Veg. Remaining": null,
    "Native Veg. Protected": null,
    "Wetland/Riparian": null,
    "Number of Landform Features within Block": null,
    "Does the Block Contain a Wetland Feature?": null,
    "Canopy Type": null,
    "Projected Foliage Cover": null,
    "Overstorey Height Average": null,
    "Crown Depth Average": null,
    "Canopy Diameter Average": null,
    "Gaps Average": null,
    "Crown Separation Ratio": null,
    "Overstorey Measurement Count": null,
    "Crown Extent": "CROWN_EXTENT_PERC (Fauna) / Crown Extent Percent (Flora)",
    "Crown Extent Score": "CROWN_EXTENT_SCORE",
    "Crown Density": "CROWN_DENSITY_PERC (Fauna) / Crown Density Percent (Flora)",
    "Crown Density Score": "CROWN_DENSITY_SCORE",
    "Extent of Reproduction": "EXTENT_REPRODUCTION (Fauna) / Extent of Reproduction (Flora)",
    "Extent Bark Cracking": "EXTENT_BARK_CRACKING",
    DBH: "DBH",
    "Leaf Die off": "LEAF_DIE_OFF (Fauna) / Leaf Die Off (Flora)",
    "New Tip Growth": "NEW_TIP_GROWTH (Fauna) / New Tip Growth (Flora)",
    "Epicormic Growth": "EPICORMIC_GROWTH (Fauna) / Epicormic Growth (Flora)",
    "Mistletoe Load": "MISTLETOE_LOAD (Fauna) / Mistletoe Load (Flora)",
    "Leaf Damage": "LEAF_DAMAGE (Fauna) / Leaf Damage (Flora)",
    "Observer 1": null,
    "Observer 2": null,
    "Observer 3": null,
    "Start Date": null,
    "End Date": null,
    Duration: null,
    "Date Accuracy": null,
    ...LOCATION_META_CROSSWALK,
    ...GEO_CROSSWALK,
  },
  "Observation:Individual": {
    ...SPECIES_SHARED_CROSSWALK,
    Sex: "SEX",
    Regeneration: null,
    "Weight": "WEIGHT",
    "Height": null,
    "Gravid?": "ISGRAVID",
    Teats: "TEATS",
    Vagina: "VAGINA",
    "Pouch Status": "POUCH",
    "No. in Pouch": "NUMPOUCH",
    Testes: "TESTES",
  },
  "Observation:Population": {
    ...SPECIES_SHARED_CROSSWALK,
    "Number Observed": "NUMOBSERVED",
    "Is Annual Herb?": null,
    "Cover/Abundance": "COVCODE",
    "Cover/Abundance Description": null,
  },
};
