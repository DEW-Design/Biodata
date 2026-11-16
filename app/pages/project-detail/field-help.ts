// What a field means, shown from a help icon beside its name on a record's cards (FieldRow, field-notes.tsx).
//
// Every field a record card draws has an entry, except the ones listed below. A field with no entry shows no icon. On 16 Nov 2026
// the designer first asked for it only on the complex names, then ("apply the help icon logic across all field names (or concept
// names)") on all of them.
//
// Every line is drawn from a source, never written to fill the gap (CONTRACTS 0.3):
//   - a Darwin Core term the field maps to (survey-data.ts `term`), its definition at dwc.tdwg.org/terms, in plain words;
//   - the field's own code list, options or limits (field-options.ts, field-schema.ts CODE_VOCABS, UNIT_FIELDS);
//   - the BAM scoresheet the site scores reproduce (site-scores/*.ts, landscape.ts), in its own words;
//   - IBRA, the Interim Biogeographic Regionalisation for Australia (DCCEEW), and NSX, BDBSA's species code (ref-domain.md).
// The second group below ("Described from the field's own name and options") says only what the field's name and its option
// list already say, in a sentence. The option lists are illustrative until the Control Vocabulary supplies the real ones
// (field-options.ts), so those lines name the kind of thing the field records and never what a value means.
// All wording is a draft for a content review.
//
// No entry, because nothing in the repo says what the field is: Site grouping, Specific property details, Paddock, Mud map,
// Photopoint disc number, Event array, Source ID, Species seq no., Institution rego #, Transfer date, Association dominance,
// Regeneration, Line. They are for the designer to supply.

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

  // ── Described from a Darwin Core term (survey-data.ts `term`) ──
  "Recorded by": "The people who recorded this in the field.",
  "Site ID": "The site's BioData identifier, set by the system.",
  "Site name": "The name the site is known by.",
  Altitude: "The height of the site above sea level, in metres.",
  "Site comment": "Any other note about the site.",
  "Location comment": "Any other note about the location.",
  "Occurrence ID": "This occurrence's BioData identifier, set by the system.",
  "Occurrence comment": "Any other note about the occurrence.",
  "Observation ID": "This observation's BioData identifier, set by the system.",
  "Observation comment": "Any other note about the observation.",
  "Institution name": "The institution that holds the voucher.",

  // ── Described from the field's own name and options (field-options.ts) ──
  // Event
  "Custom properties": "Extra fields the project added to this record, each with its own name and value.",
  Description: "A description of the record in free text.",
  "Legacy site ID": "The identifier this site had in the BDBSA data it was carried over from.",
  "Legacy visit ID": "The identifier this visit had in the BDBSA data it was carried over from.",
  "Legacy sighting #": "The identifier this sighting had in the BDBSA data it was carried over from.",
  "Photopoint marker present": "Whether a marker is fixed at the photopoint.",
  "Number of landform features within block": "How many landform features lie within the block.",
  "Does the block contain a wetland feature?": "Whether a wetland lies within the block.",
  "Start date": "The date the event started.",
  "Start time": "The time of day the event started.",
  "End date": "The date the event ended.",
  Duration: "How long the event ran, in days, hours and minutes.",

  // Occurrence
  "Occurrence name": "The name this occurrence is known by.",
  "Taxonomic type": "The kind of organism recorded, such as fauna or flora.",
  "Voucher type": "What was kept as evidence of the record, such as a specimen or a photograph.",
  "Voucher images": "Photographs of the voucher.",

  // Observation
  "Observation name": "The name this observation is known by.",
  "Disturbance impact": "The disturbances seen at the location, each a code with its status.",
  "Air temperature (max)": "The highest air temperature recorded, in degrees Celsius or Fahrenheit.",
  "Air temperature (min)": "The lowest air temperature recorded, in degrees Celsius or Fahrenheit.",
  "Climatic condition": "The climate conditions at the time of the observation, such as dry or wet.",

  // Observation: the animal or plant
  Activity: "What the animal was doing when it was recorded.",
  Sex: "The sex of the animal, as a code with its description.",
  Measurements: "Measurements taken of the individual, each a type, a value and a unit.",
  "Gravid?": "Whether the female is carrying eggs or young.",
  Teats: "The condition of the female's teats.",
  Vagina: "The condition of the female's vagina.",
  "Pouch status": "Whether the female has young in her pouch.",
  "No. in pouch": "The number of young or embryos in the pouch.",
  Testes: "The condition of the male's testes.",
  "Animal life stage": "The life stage or stages of the animal, such as juvenile or adult.",
  "Plant life stage": "The life stage or stages of the plant, such as seedling or flowering.",
  "Planted/Released": "Whether the individual was planted or released, rather than occurring naturally.",
  "Number observed": "How many individuals were seen. \"Present but not counted\" is for a species noted without a count.",
  "Is annual herb?": "Whether the plant is an annual herb, one that completes its life cycle in a year.",
  "Cover/abundance & desc": "How much ground the species covers and how many individuals there are, as a code from 1 to 5 with its description.",
  "Ephemerals present?": "Whether ephemeral plants, those that appear only briefly after rain, were present.",

  // Observation: tree and ground condition
  "Crown extent": "How far the tree's crown extends, as a percentage from 0 to 100.",
  "Crown extent score": "Worked out from the crown extent.",
  "Crown density": "How dense the tree's crown is, as a percentage from 0 to 100.",
  "Crown density score": "Worked out from the crown density.",
  "Extent of reproduction": "How much of the tree is reproducing, from none to abundant.",
  "Extent bark cracking": "How much the tree's bark is cracked, from none to severe.",
  DBH: "The tree's diameter at breast height, in millimetres.",
  "Leaf die off": "How much of the tree's foliage has died, from none to severe.",
  "New tip growth": "How much new growth there is at the tips of the branches, from none to abundant.",
  "Epicormic growth": "How much of the tree's growth is epicormic, shoots from the trunk or branches, from none to abundant.",
  "Mistletoe load": "How much mistletoe is growing on the tree, from none to heavy.",
  "Leaf damage": "How much of the tree's foliage is damaged, from none to severe.",
  "Fire scars": "Scars left on the plants by past fire.",
  "Bare earth estimate": "An estimate of how much of the ground is bare earth, as a percentage from 0 to 100.",
  "Litter estimate": "An estimate of how much of the ground is covered by leaf litter, as a percentage from 0 to 100.",

  // Observation: landform, geology and soil
  "Site slope": "How steep the ground is, in degrees from 0 to 90.",
  "Site aspect": "The compass direction the slope faces, in degrees from north, 0 to 359.",
  "Land form pattern": "The broad pattern of the landscape, such as hills or plains.",
  "Land form element": "The part of the landscape the site is on, such as a crest or a lower slope.",
  "Geological surface": "Whether the ground surface is unconsolidated, consolidated or mixed.",
  "Outcrop cover": "How much of the surface is rock outcrop.",
  "Outcrop lithology": "The type of rock in the outcrop.",
  "Surface strew size": "The size of the loose stones on the surface, from fine gravel to boulders.",
  "Surface strew cover": "How much of the surface is covered by loose stones.",
  "Surface strew lithology": "The type of rock in the loose stones on the surface.",
  "Soil texture class": "The texture of the soil, from sand to heavy clay.",
  "Landform comment": "Any other note about the landform.",

  // Observation: vegetation community
  "Vegetation conditions": "The overall condition of the vegetation, from excellent to very poor.",
  "SA structural formation": "The structural formation of the vegetation, such as open forest or woodland.",
  "Assemblage information": "The vegetation assemblage, each row a Muir code with a canopy code.",
  "Upper stratum (code & desc)": "The species of the upper stratum, as a code with its description.",
  "Life form & desc": "The life form, such as tree, shrub or grass, as a code with its description.",
  "Collection method & desc": "How the record was collected, such as seen, heard or captured and released, as a code with its description.",
  "Strata & desc": "The stratum the record belongs to, upper, mid or ground, as a code with its description.",
  "Macro habitat & desc": "The broad habitat, such as woodland or riparian, as a code with its description.",
  "Micro habitat & desc": "The fine-scale habitat, such as leaf litter or under a rock, as a code with its description.",
};

export const fieldHelp = (label: string): string | undefined => FIELD_HELP[label.trim()];
