// What a field means, shown from a help icon beside its name on a record's cards (FieldRow, field-notes.tsx).
//
// Only fields whose name does not explain itself are here (designer, 16 Nov 2026: "only for the ones needed, not for easily
// understandable field names, for example Observers"). A field with no entry shows no icon.
//
// Every line is drawn from a source, never written to fill the gap (CONTRACTS 0.3):
//   - a Darwin Core term the field maps to (survey-data.ts `term`), its definition at dwc.tdwg.org/terms, in plain words;
//   - the field's own code list (field-schema.ts CODE_VOCABS) or its limits (UNIT_FIELDS);
//   - the BAM scoresheet the site scores reproduce (site-scores/*.ts, landscape.ts), in its own words;
//   - IBRA, the Interim Biogeographic Regionalisation for Australia (DCCEEW), and NSX, BDBSA's species code (ref-domain.md).
// The wording is a draft for a content review. Fields left out because nothing in the repo defines them (Photopoint disc
// number, Legacy site ID, Source ID, Event array, Institution rego #, Legacy sighting #, Species seq no., Transfer date, Mud map)
// are for the designer to supply.

export const FIELD_HELP: Record<string, string> = {
  // Location (IBRA; Darwin Core georeferenceProtocol, geodeticDatum, coordinateUncertaintyInMeters, sampleSizeValue)
  "IBRA region":
    "The bioregion the site is in, from the Interim Biogeographic Regionalisation for Australia (IBRA). Worked out from the site's location.",
  "IBRA subregion":
    "The IBRA subregion the site is in, a finer division of its bioregion. Worked out from the site's location.",
  "Location method": "How the coordinates were found, for example with a hand-held GPS or read from a map.",
  Datum: "The geodetic reference system the coordinates are given in, for example GDA2020.",
  Reliability: "How close the recorded coordinates are to the true location, from within 10 m to more than 10 km.",
  "Sample site dimensions": "The size of the area sampled, length by width.",
  "Photopoint direction": "The direction the photo is taken in, in degrees from 0 to 359.",

  // Dates (field-schema.ts CODE_VOCABS dateAccuracy; Darwin Core dateIdentified, identifiedBy)
  "Date accuracy": "How precisely the date is known: to the day, the month, the year or the season, or unknown.",
  "Determination date": "The date the specimen was identified as its species.",
  "Determination date accuracy":
    "How precisely the determination date is known: to the day, the month, the year or the season, or unknown.",
  Determiners: "The people who identified the specimen as its species.",
  "Visit sequence number": "This visit's place among the site's visits: 1/3 is the first of three.",

  // Occurrence (NSX; Darwin Core occurrenceStatus, catalogNumber)
  "NSX code & species": "The species recorded, with its NSX code, the code BDBSA gives each taxon.",
  "Occurrence status": "Whether the species was present at the location, present but not counted, or absent.",
  "Voucher number": "The specimen's catalogue number at the institution that holds it.",

  // Site scores (site-scores/vegetation-condition.ts, conservation-significance.ts, landscape.ts, summary.tsx)
  "Landscape context score":
    "How the land around the block scores, factor by factor: vegetation cover, the block's shape, native vegetation remaining and protected, and wetlands. Every block scores at least 1.",
  "Vegetation condition score":
    "The condition of the site's vegetation against its community's benchmark: native species, life forms, weeds, regeneration and, where there are trees, tree attributes.",
  "Conservation significance score":
    "How significant the site is for conservation, from threatened communities and the threatened flora and fauna recorded there. Every site scores at least 1.",
  "Unit biodiversity score": "Vegetation condition x landscape context x conservation significance.",
  "Total biodiversity score": "The unit biodiversity score x the site's size in hectares.",
};

export const fieldHelp = (label: string): string | undefined => FIELD_HELP[label.trim()];
