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
  Event: ["Block", "Site", "Transect", "Ramble", "Quadrat", "Visit"],
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
// - Fauna, Number Observed > 1 -> Observation:Population. An abundance range ("2 - 10") counts as
//   more than one, so it is a Population too (20 Oct 2026, the Bioblitz matrix).
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
  // An abundance class ("2 - 10", "11 - 100", "101 - 1000", as the Bioblitz matrix writes it) is a group:
  // a Population, unless the class itself tops out at one animal.
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(normalized);
  if (range) {
    return Number(range[2]) <= 1
      ? { occurrenceType: "Individual", observationType: "Individual" }
      : { occurrenceType: "Population", observationType: "Population" };
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
// with no entry here falls back to generic passthrough (every type has one now: Block, Transect, Ramble,
// Quadrat and the two Occurrence types were added 21 Oct 2026, from the designer's record-page frames) - see `/config/data-model` for the full reasoning and the known
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
// The field blocks the Event and Occurrence record pages share (Transect, Ramble, Quadrat, Block and the two
// Occurrence types), taken from the designer's record-page frames (20 and 21 Oct 2026): the same Temporal
// Details, Observers, Location Information and Photopoint sections, in the frames' own order, under their
// exact labels. Each section is its own list so a type that lacks one (Block has no Zone/Easting table;
// an Occurrence has no Photopoint) simply leaves it out. The record's own ID, Attached Resources and Nested
// Records, and the Custom Property rows are not fields here: the ID is structural, the other two are
// calculated or open-ended, as for Site and Visit.
const TEMPORAL_FIELDS = ["Start Date", "End Date", "Duration", "Date Accuracy"];
const OBSERVER_FIELDS = ["Observer 1", "Observer 2", "Observer 3"];
const LOCATION_FIELDS = ["IBRA Region", "IBRA Sub Region", "Location Method", "Datum", "Reliability", "Sample Site Dimensions", "Location Comment"];
const PHOTOPOINT_FIELDS = ["Photopoint Marker Present", "Photopoint Disc Number", "Photopoint Direction"];

// The Ramble frame draws Location Details as a table of coordinates (entered, and the GDA2020 equivalent).
const COORDINATE_FIELDS = ["Zone", "Easting", "Northing", "Latitude", "Longitude"];

// Transect, Quadrat, Ramble and Block: Name, Description, Source ID and Comment, then the shared sections.
function eventFields(type: string, opts: { coordinates?: boolean } = {}): string[] {
  return [
    `${type} Name`,
    "Description",
    "Source ID",
    `${type} Comment`,
    ...TEMPORAL_FIELDS,
    ...OBSERVER_FIELDS,
    "Location Details",
    ...(opts.coordinates ? COORDINATE_FIELDS : []),
    ...LOCATION_FIELDS,
    ...PHOTOPOINT_FIELDS,
  ];
}

// Occurrence Individual and Population: the same Occurrence Details, Temporal, Observers and Location; the
// Individual frame also has a Voucher section.
const OCCURRENCE_DETAILS = [
  "Legacy Sighting #",
  "Species Seq No",
  "Occurrence Name",
  "Description",
  "Taxonomic Type",
  "NSX Code & Species",
  "Occurrence Status",
  "Occurrence Comment",
];
const VOUCHER_FIELDS = [
  "Voucher Type",
  "Voucher Series",
  "Voucher Number",
  "Voucher Images",
  "Institution Name",
  "Institution Rego #",
  "Determination Date",
  "Determination Date Accuracy",
  "Determiner 1",
  "Determiner 2",
  "Transfer Date",
];

// The four Observation frames (21 Oct 2026), in each frame's own section order and under its labels. Where
// a frame draws a field and its description as one row ("Life Form & Desc", two lines: the code, then its
// description), it is one field here and the plain name still reads as an alias (`FIELD_ALIASES`).
// Spellings are normalised, so a frame's "Is Annual Herb ?" and "Gravid ?" are the existing "Is Annual
// Herb?" and "Gravid?". Names keep no unit ("Crown Extent", "DBH", "Bare Earth Estimate"); the unit is in
// `FIELD_UNITS`. The frames' "Association Dominace" is read as Association Dominance.
// Not fields: the Observation ID, Attached Resources, Nested Records and Custom Property (as everywhere);
// the Individual frame's Measurements table, the Community frame's Assemblage Information and Overstorey
// Measurements tables (open-ended rows; Overstorey's calculated averages below are fields), and the
// calculated Landscape Context score card's own values.
const CODE_AND_DESC_FIELDS = ["Life Form & Desc", "Collection Method & Desc", "Strata & Desc", "Macro Habitat & Desc", "Micro Habitat & Desc"];
const TREE_HEALTH_FIELDS = [
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
];
const SPECIES_TAIL_FIELDS = ["Animal Life Stage", "Plant Life Stage", "Planted/Released"];

const POPULATION_FIELDS = [
  "Observation Name",
  "Description",
  "Observation Comment",
  "Number Observed",
  "Line",
  "Is Annual Herb?",
  ...CODE_AND_DESC_FIELDS,
  "Cover/Abundance & Desc",
  "Activity",
  "Association Dominance",
  ...SPECIES_TAIL_FIELDS,
  ...OBSERVER_FIELDS,
  ...TEMPORAL_FIELDS,
  "Location Details",
  ...LOCATION_FIELDS,
];

const INDIVIDUAL_FIELDS = [
  "Observation Name",
  "Description",
  "Observation Comment",
  "Line",
  ...CODE_AND_DESC_FIELDS,
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
  ...SPECIES_TAIL_FIELDS,
  ...TREE_HEALTH_FIELDS,
  ...OBSERVER_FIELDS,
  ...TEMPORAL_FIELDS,
  "Location Details",
  ...LOCATION_FIELDS,
];

const COMMUNITY_FIELDS = [
  "Observation Name",
  "Description",
  "Vegetation Conditions",
  "SA Structural Formation",
  "Disturbance Impact (Code & Desc)",
  "Upper Stratum (Code & Desc)",
  "Ephemerals Present?",
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
  ...OBSERVER_FIELDS,
  ...TEMPORAL_FIELDS,
  "Location Details",
  ...COORDINATE_FIELDS,
  ...LOCATION_FIELDS,
];

const NON_BIOTIC_FIELDS = [
  "Observation Name",
  "Description",
  "Fire Scars",
  "Bare Earth Estimate",
  "Litter Estimate",
  "Climatic Condition",
  "Disturbance Impact (Code & Desc)",
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
  ...OBSERVER_FIELDS,
  ...TEMPORAL_FIELDS,
  "Location Details",
  ...COORDINATE_FIELDS,
  ...LOCATION_FIELDS,
];

// A frame's "Life Form & Desc" is read from a column called "Life Form" as well: every file and converter
// written before the frames merged code and description keeps mapping. Matched like the field itself
// (case, spacing and punctuation ignored).
export const FIELD_ALIASES: Record<string, string[]> = {
  "Life Form & Desc": ["Life Form"],
  "Collection Method & Desc": ["Collection Method"],
  "Strata & Desc": ["Strata"],
  "Macro Habitat & Desc": ["Macro Habitat"],
  "Micro Habitat & Desc": ["Micro Habitat"],
  "Cover/Abundance & Desc": ["Cover/Abundance"],
  "Disturbance Impact (Code & Desc)": ["Disturbance Impact"],
  "Upper Stratum (Code & Desc)": ["Upper Stratum"],
};

export const FIELD_SCHEMA: Record<string, string[]> = {
  "Event:Block": eventFields("Block"),
  "Event:Transect": eventFields("Transect"),
  "Event:Ramble": eventFields("Ramble", { coordinates: true }),
  "Event:Quadrat": eventFields("Quadrat"),
  "Occurrence:Individual": [...OCCURRENCE_DETAILS, ...TEMPORAL_FIELDS, ...OBSERVER_FIELDS, ...VOUCHER_FIELDS, "Location Details", ...LOCATION_FIELDS],
  "Occurrence:Population": [...OCCURRENCE_DETAILS, ...TEMPORAL_FIELDS, ...OBSERVER_FIELDS, "Location Details", ...LOCATION_FIELDS],
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
  "Observation:Non-biotic": NON_BIOTIC_FIELDS,
  "Observation:Community": COMMUNITY_FIELDS,
  "Observation:Individual": INDIVIDUAL_FIELDS,
  "Observation:Population": POPULATION_FIELDS,
};

export const ALL_SCHEMA_FIELD_NAMES = Array.from(new Set(Object.values(FIELD_SCHEMA).flat()));

// Every name a column may carry that means a schema field: the field names, and the older plain names.
export const ALL_SCHEMA_FIELD_NAMES_WITH_ALIASES = Array.from(new Set([...ALL_SCHEMA_FIELD_NAMES, ...Object.values(FIELD_ALIASES).flat()]));

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
  },
  "Observation:Individual": {
    Weight: "gms",
    Height: "cm",
    "Crown Extent": "%",
    "Crown Density": "%",
    DBH: "mm",
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
      "Crown Extent %, DBH (the Tree Health section, an Individual section in the 21 Oct frames and Community's before), Number Observed, and Cover/Abundance - scoped here to one type - actually appear on every row of the real SPECIES_FAUNA and SPECIES_FLORA exports, fauna and flora alike. Strong evidence the real BDBSA system stores one shared species-observation schema, and our 4-way Individual/Population/Community/Non-biotic split is a UI-level view over it, not 4 distinct data schemas.",
  },
  {
    title: "Observers is one column in real data, not three",
    description:
      'We modelled "Observer 1"/"Observer 2"/"Observer 3" from the Site/Visit Figma frames. Real SPECIES data stores this as a single "Observers"/"COLLECTORNR" column. BDBSA\'s 20/10 check describes an observer as a record of its own (OBSERVERNR, OBSERVERNAME, OBSERVERTYPE, OBSERVERSURNAME, OBSERVERINITIALS, OBSERVERPREFNAME, OBSERVERCOMM, ISCURATOR): only the first two are seen in a file we hold, as the columns of the BDBSA observer register (the OBSERVERS tab of the Data Returns Template). An observer is probably a reference to a person, not a field of text.',
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
      "Every real coordinate across all 4 files is a projected Zone/Easting/Northing grid reference - none of the real exports carry a Latitude/Longitude pair at all, even though every Observation type's own schema includes both. BDBSA's 20/10 check names LATITUDE1 and LONGITUDE1 for them; neither is in any file we hold, so they are reported, not yet seen.",
  },
  {
    title: "Photopoint fields are split across Site and Visit, not identical on both",
    description:
      'Our schema lists the same 3 Photopoint fields on both Event:Site and Event:Visit. Real data splits them: "Marker Present"/"Disc Number" (ISPHOTOPOINT/PHOTODISCNR) are on Site; "Direction" (PHOTODIRECTION) is on Visit - neither file has all 3. BDBSA\'s 20/10 check gives all three codes for both Site and Visit, so the split may be in the exports and not in the database. Still to confirm: a Site export with PHOTODIRECTION and a Visit export with ISPHOTOPOINT / PHOTODISCNR.',
  },
  {
    title: 'Start Date: the Visit export Heathfield sent has VISITDATE, not EDITED_VISIT',
    description:
      'The crosswalk maps Visit "Start Date" to EDITED_VISIT, read off the SU1211 export. The 2019 Heathfield VISIT tab carries VISITDATE instead, and no EDITED_VISIT; its species rows carry VISITDATE as well. It is the only existing crosswalk code that the files we now hold do not show (41 of 42 do). Two names for one date, or a rename between exports - to confirm with BDBSA.',
  },
  {
    title: "Exports and code tables spell the same location columns differently",
    description:
      'The exports use OLD-prefixed names (OLDLOCDATUMNR, OLDZONE, OLDEASTING, OLDNORTHING); BDBSA\'s own code tables, in the Data Returns Template, use the bare ones (LOCDATUMNR, LOCMETHODNR, RELIABNR). The 20/10 check lists LOCDATUMNR for an Observation\'s Datum, which is the code-table name; the Site export shows OLDLOCDATUMNR. A match on text alone will not bridge the two.',
  },
  {
    title: "BDBSA publishes its code tables, and the ingestion keeps words",
    description:
      'The Data Returns Template\'s Codes tab holds the real lookups: location method (LOCMETHODNR), datum (LOCDATUMNR), location reliability (RELIABNR), collection method (METHODNR), species type, and date reliability. Checked against the Heathfield submission, they reproduce BDBSA\'s own output (GDA94 is 4, 251-500m is 4, "Observed-no method stated" is 6, "Sign-diggings" is 13, Plant is P, Day is D). The form converter still keeps the words, because it was built before these tables were found. Decision: emit BDBSA\'s codes instead, or keep both.',
  },
  {
    title: "The Observation frames merge a code and its description into one field",
    description:
      'The four 21 Oct Observation frames draw Life Form, Collection Method, Strata, Macro Habitat, Micro Habitat, Cover/Abundance, Disturbance Impact and Upper Stratum as one row each, two lines: the code, then its description ("Life Form & Desc"). They are one field each now, where the schema had a code field and a separate description field. The value an upload supplies is the code (MUIRCODE, METHODNR, STRATANR ...); the description is read from the code table. The plain names ("Life Form", "Collection Method") still read as the same field, so files written before the frames keep mapping. Is the description stored beside the code, or only looked up?',
  },
  {
    title: "Tree Health moved to Individual, and the Community frame has no comment",
    description:
      'Crown Extent, Crown Density, DBH, Leaf Die off, Mistletoe Load and the rest of Tree Health are a section of the Individual frame now; the schema had them on Community. BDBSA\'s real species rows carry them regardless of type, so nothing in the data contradicts it. The Community frame also has no Observation Comment, though BDBSA\'s SPCOMM is a comment on every species row. The sandbox puts a species comment on the Occurrence ("Occurrence Comment") where the Observation type has no comment field. Confirm that is where it belongs.',
  },
  {
    title: "Individual and Population Observations have no coordinates",
    description:
      'Their frames have a Location Details shapefile and no Zone, Easting, Northing, Latitude, Longitude table (Community and Non-biotic have one, and the Ramble frame). A species row in a real export carries its coordinates anyway. The sandbox reads them to find the record\'s Visit, and then drops them from it: the place is the Site\'s. Confirm that a species record never has its own coordinates.',
  },
  {
    title: "Tables in the frames, and typos",
    description:
      'The Individual frame draws Measurements as a table of Type, Value and Unit (Weight 400 gms, Height 15 cm, Tail Length 2 cm, Left Arm Length 5 cm): an open list of measurement types. Weight and Height stay as fixed fields because BDBSA\'s WEIGHT column is real; Tail Length and Left Arm Length have no field. The Community frame\'s Assemblage Information (Muir and Canopy) and Overstorey Measurements tables are open lists too; only Overstorey\'s calculated averages are fields. Also in the frames: "Association Dominace" is read as Association Dominance, and the Individual frame draws Datum and Reliability twice under Location Information (one of each here).',
  },
  {
    title: "Block is a record type now, and nothing says where it sits",
    description:
      'The Block frame has the same sections as Transect and Quadrat (details, temporal, observers, location, photopoint, custom properties) plus typed Comments, and its Nested Records show Events, Occurrences and Observations. The BAM and RAM scoresheets open with a Block tab (name, size, landscape region, assessors, date), and a block holds several sites. The sandbox accepts Block as an Event type, but does not make one from a scoresheet, and the tree still starts at Site. Is a Block the parent of its Sites, and does a scoresheet\'s Block tab become one?',
  },
  {
    title: "The Occurrence frames have no count, and two labels are unresolved",
    description:
      'Neither Occurrence frame has a Number Observed, which only the Population Observation carries, yet the count is what decides the Occurrence type (1 is an Individual, more is a Population). The sandbox drops the count from an Individual or Community Observation (it is implied by the type) rather than carry it on an Occurrence, which has no field for it. In the Individual frame the Voucher section reads "Voucher Series ?????" (kept here as "Voucher Series") and Location Method is drawn twice (once as "12 [Location method name]", once as "[Description]"), so it is one field here. Both need confirming.',
  },
  {
    title: "Repeating sections are not fields: typed Comments on a Block, Custom Property on every type",
    description:
      'The Block frame ends with a Comments section of "[Comment type]" rows, and every frame ends with Custom Property rows ("[Custom field name]" and "[Custom field value]"). Both repeat an open-ended number of times, so a flat column cannot hold them. Custom properties already work as any column the schema does not know (flagged for review); typed comments have no equivalent yet.',
  },
  {
    title: "A flat BDBSA return has no Site and no Visit",
    description:
      'The return format (Release of Data: survey number, zone, easting, northing, date, species ...) is one row per species record. The BAM and RAM scoresheets end in it (EK-flora) and so does the Bioblitz "Input Data Formatted" tab. The sandbox makes a Site from a survey and a place (coordinates, or the general location comment when there are none) and a Visit from a Site and a date. The return cannot say two visits to one place on one day are different visits, or that a place has a name; those are inferred, and a BAM or RAM site with no coordinates is only as good as its comment.',
  },
  {
    title: "The scoresheets record things the model has no field for",
    description:
      'BAM and RAM exist to score a block: condition scores, weed cover and threat, regeneration, annual herbs, palatability, utilisation tallies (intact, modified, over-utilised), age class, offset points. Their sheets are locked and calculated, and the finished return carries only the species list. None of it has a home on a Site, Visit, Occurrence or Observation here, so the sandbox does not read it. Whether it belongs in the model, or stays with the scoresheet, is a decision.',
  },
  {
    title: "BDBSA's own conversions are not always right, and the template tabs can be wrong",
    description:
      'Checked this way: the Bioblitz matrix and BDBSA\'s "Input Data Formatted" tab for it hold the same 440 records, except that 28 records the matrix calls habitat Edge are Pool in the BDBSA tab, and the BDBSA tab has one extra Nematoda row with no abundance. RAM-VA1\'s formula-driven "BDBSA Flora" tab puts latitude and longitude in the Easting and Northing columns and leaves the survey number blank; the finished EK_flora tab is right. Reading the user\'s own entry, not BDBSA\'s tab for it, is what exposes these.',
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
  // The frames draw a code and its description as one field ("Life Form & Desc"): the confirmed column is
  // the code's; the description is looked up from the code table (its column is in the 20/10 check).
  "Life Form & Desc": "MUIRCODE",
  "Collection Method & Desc": "METHODNR",
  "Strata & Desc": "STRATANR",
  "Macro Habitat & Desc": "MACROHABNR",
  "Micro Habitat & Desc": "MICROHABNR",
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
  // No Zone/Easting/Northing/Latitude/Longitude: the Individual and Population frames have no coordinate
  // table (Location Details is a shapefile), so `GEO_CROSSWALK` is not spread in here.
  ...LOCATION_META_CROSSWALK,
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
    "Disturbance Impact (Code & Desc)": null,
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
    "Disturbance Impact (Code & Desc)": null,
    "Ephemerals Present?": null,
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
    // Tree Health: a section of the Individual frame (it was Community's). Real species rows carry these
    // columns on every row, so the confirmed codes move with the section.
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
    "Cover/Abundance & Desc": "COVCODE",
  },
};

// ── The 20/10 check: newer BDBSA codes, beside the confirmed crosswalk ──
//
// The designer, 20 Oct 2026: for the fields the crosswalk above calls "No equivalent found" (and a
// few it maps differently), BDBSA has since given the codes it uses in its database. They sit to
// the right of the confirmed column and never replace it: `BDBSA_KEY_CROSSWALK` is what has been
// seen in a real export; this is what BDBSA reports, with where each code was actually found.
//
// "Seen" is exact: the code is the whole text of a column header in a real BDBSA export (a SITE,
// VISIT or SPECIES tab of the Heathfield 2019 submission) or of a code table in the Data Returns
// Template. The word DESCRIPTION is not enough (it is a heading, not a column), and neither is a
// match in our own mapping workbook, which cannot be evidence for itself. Checked 20 Oct 2026
// against: the Heathfield Council Depot Ramble Oct 2019 workbook (SITE, VISIT, SPECIES, SPECIES
// FAUNA tabs, raw column rows), and the BDBSA Data Returns Template (Codes, OBSERVERS tabs). The
// SU1211 exports the crosswalk was first built from are not held, so a code absent here may still
// be in them.
const SEEN_SITE = "Heathfield export, SITE tab";
const SEEN_VISIT = "Heathfield export, VISIT tab";
const SEEN_CODES = "Data Returns Template, Codes tab";
const SEEN_OBSERVERS = "Data Returns Template, OBSERVERS tab";

export interface ReportedCode {
  code: string;
  // Where the code is the whole text of a header, empty when no file we hold shows it.
  seenIn: string[];
}

export interface ReportedCodes {
  codes: ReportedCode[];
  // How to show it when it is not just the codes joined (a composite key).
  display?: string;
  // What a reader should know that the codes alone do not say.
  note?: string;
}

const unseen = (code: string): ReportedCode => ({ code, seenIn: [] });
const seen = (code: string, ...where: string[]): ReportedCode => ({ code, seenIn: where });

export const BDBSA_REPORTED_CODES: Record<string, Record<string, ReportedCodes>> = {
  "Event:Site": {
    Description: { codes: [unseen("DESCRIPTION")] },
    "Photopoint Direction": { codes: [seen("PHOTODIRECTION", SEEN_VISIT)], note: "Seen on the VISIT export, not on the SITE export." },
  },
  "Event:Visit": {
    "Legacy Visit ID": {
      codes: [seen("CAMPMAP", SEEN_SITE), seen("QUADSITE", SEEN_SITE), seen("PATCHQUAD", SEEN_SITE)],
      display: "CAMPMAP + QUADSITE + PATCHQUAD (composite, no single ID column)",
      note: "Seen on the SITE export, the same key as the Site.",
    },
    "Photopoint Marker Present": { codes: [seen("ISPHOTOPOINT", SEEN_SITE)], note: "Seen on the SITE export, not on the VISIT export." },
    "Photopoint Disc Number": { codes: [seen("PHOTODISCNR", SEEN_SITE)], note: "Seen on the SITE export, not on the VISIT export." },
  },
  "Observation:Individual": {
    Description: { codes: [unseen("DESCRIPTION")] },
    // The description half of a frame's combined "& Desc" field; the code half is in the confirmed column.
    "Life Form & Desc": { codes: [unseen("MUIRDESC")], note: "The description half; the code is MUIRCODE." },
    "Collection Method & Desc": {
      codes: [seen("METHODDESC", SEEN_CODES)],
      note: "The description half; the code is METHODNR. Seen as the description column of the collection method code table, not on a species row.",
    },
    "Strata & Desc": { codes: [unseen("STRATADESC")], note: "The description half; the code is STRATANR." },
    "Macro Habitat & Desc": { codes: [unseen("MACROHABDESC")], note: "The description half; the code is MACROHABNR." },
    "Micro Habitat & Desc": { codes: [unseen("MICROHABDESC")], note: "The description half; the code is MICROHABNR." },
    Height: { codes: [unseen("HEIGHT")], note: "Reported with a question mark: not confirmed by BDBSA." },
    "Animal Life Stage": { codes: [unseen("LIFESTAGECODE")] },
    "Observer 1": {
      codes: [
        seen("OBSERVERNR", SEEN_OBSERVERS),
        seen("OBSERVERNAME", SEEN_OBSERVERS),
        unseen("OBSERVERTYPE"),
        unseen("OBSERVERSURNAME"),
        unseen("OBSERVERINITIALS"),
        unseen("OBSERVERPREFNAME"),
        unseen("OBSERVERCOMM"),
        unseen("ISCURATOR"),
      ],
      note: "Eight columns describe one observer, so an observer is a record, not a field. The first two are the BDBSA observer register's own columns.",
    },
    "Location Details": { codes: [unseen("SURVEYLOCDESC")] },
    "Location Method": { codes: [seen("LOCMETHODNR", SEEN_SITE, SEEN_CODES)], note: "Seen on the SITE export and as the location method code table, not on a species row." },
    Datum: { codes: [seen("LOCDATUMNR", SEEN_CODES)], note: "Seen only as the datum code table. The SITE export has OLDLOCDATUMNR." },
    "Location Comment": { codes: [seen("LOCCOMM", SEEN_SITE)], note: "Seen on the SITE export, not on a species row." },
  },
};

export function reportedCodesFor(kindType: string, field: string): ReportedCodes | undefined {
  return BDBSA_REPORTED_CODES[kindType]?.[field];
}

// "DESCRIPTION", or "OBSERVERNR, OBSERVERNAME, ..." - the one line the JSON comment and the Excel
// column both show, so the two can never say different things about the same field.
export function reportedCodesText(entry: ReportedCodes): string {
  return entry.display ?? entry.codes.map((c) => c.code).join(", ");
}

