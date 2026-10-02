import { NSX_SPECIES } from "@/app/pages/project-detail/field-schema";
import type { SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";

// Taxonomy Management: the taxa, their hierarchy, and every field the Figma section draws
// ("Taxonomy Management", Biodata Wireframe Presentation, node 2537:137008), declared once so the
// three layout options render the same fields.
//
// Sources, so nothing here is invented:
// - The taxa are this build's existing NSX species list (NSX_SPECIES in project-detail/field-schema.ts,
//   used by survey records and the Controlled Vocabulary "Taxonomy" table). No NSX code is made up: a
//   taxon created by Combine, Split or Append takes the code the admin types in.
// - Ranks, authorities and the synonyms below are the published names for those species.
// - Option lists are given only where the values are standard and public (yes/no, the EPBC Act and
//   SA National Parks and Wildlife Act categories, the State Herbarium's 13 SA plant regions, the
//   states). Every other list is empty until its Controlled Vocabulary arrives.
//
// Flora's Main is its own frame (node 2541:160901), supplied Sept 30 2026; Fauna's Main is the one
// on the Taxonomy View selected frame.
//
// Labels are Figma's, with the spelling fixed (the designer, Sept 30 2026): "Offcial" -> "Official",
// "Indegenous" -> "Indigenous", "New Higher Level Taxa" -> "New Higher Taxa Level", "Append Taxon" ->
// "Append Species", and " ?" -> "?". No field is added or removed.

export const TX_ROOT = "/pages/taxonomy";

export type Kingdom = "Flora" | "Fauna";

// ── Option lists ──

export const YES_NO = ["Yes", "No"];
export const HIGHER_TAXA_LEVELS = ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus"];
export const INFRASPECIFIC_RANKS = ["subsp.", "var.", "f."];
export const EPBC_CATEGORIES = ["Extinct", "Extinct in the wild", "Critically Endangered", "Endangered", "Vulnerable", "Conservation Dependent"];
export const SA_NPW_CATEGORIES = ["Endangered", "Vulnerable", "Rare"];
export const STATES_OS = ["SA", "WA", "NT", "Qld", "NSW", "Vic", "Tas", "ACT", "OS"];
/** The State Herbarium of South Australia's plant regions (Census of South Australian Plants). */
export const SA_PLANT_REGIONS = [
  "NW - North-Western",
  "LE - Lake Eyre",
  "NU - Nullarbor",
  "GT - Gairdner-Torrens",
  "FR - Flinders Ranges",
  "EA - Eastern",
  "EP - Eyre Peninsula",
  "NL - Northern Lofty",
  "MU - Murray",
  "YP - Yorke Peninsula",
  "SL - Southern Lofty",
  "KI - Kangaroo Island",
  "SE - South-Eastern",
];

// ── Taxa ──

export interface TaxonRank {
  phylum: string;
  cls: string;
  order: string;
  family: string;
  genus: string;
}

export interface Synonym {
  id: string;
  name: string;
  values: Record<string, string>;
}

export type Row = Record<string, string>;

export interface Taxon {
  id: string;
  /** The NSX code. Null only for a taxon with no code recorded. */
  nsx: string | null;
  kingdom: Kingdom;
  group: SpeciesGroup;
  common: string;
  scientific: string;
  ranks: TaxonRank;
  author: string;
  current: boolean;
  /** Field id -> value, for the grid tabs (Main, Status, Species Status). */
  values: Record<string, string>;
  /** Table id -> rows, for the table tabs. */
  tables: Record<string, Row[]>;
  synonyms: Synonym[];
  /** Linked Species: older taxa this one came from, newer taxa it became. Taxon ids. */
  parents: string[];
  children: string[];
}

// Published classification for each NSX species. Flora follows APC (Australian Plant Census), fauna
// follows the Australian Faunal Directory.
const RANKS: Record<string, { ranks: TaxonRank; author: string; synonyms: string[] }> = {
  M03050: { ranks: { phylum: "Chordata", cls: "Aves", order: "Passeriformes", family: "Maluridae", genus: "Malurus" }, author: "(Ellis, 1782)", synonyms: ["Motacilla cyanea"] },
  P01937: { ranks: { phylum: "Tracheophyta", cls: "Magnoliopsida", order: "Myrtales", family: "Myrtaceae", genus: "Eucalyptus" }, author: "F.Muell.", synonyms: [] },
  P04411: { ranks: { phylum: "Tracheophyta", cls: "Liliopsida", order: "Asparagales", family: "Asphodelaceae", genus: "Xanthorrhoea" }, author: "F.Muell.", synonyms: [] },
  M01170: { ranks: { phylum: "Chordata", cls: "Mammalia", order: "Peramelemorphia", family: "Peramelidae", genus: "Isoodon" }, author: "(Shaw, 1797)", synonyms: ["Didelphis obesula"] },
  A00215: { ranks: { phylum: "Chordata", cls: "Amphibia", order: "Anura", family: "Myobatrachidae", genus: "Crinia" }, author: "Girard, 1853", synonyms: ["Ranidella signifera"] },
  M01002: { ranks: { phylum: "Chordata", cls: "Mammalia", order: "Monotremata", family: "Tachyglossidae", genus: "Tachyglossus" }, author: "(Shaw, 1792)", synonyms: ["Myrmecophaga aculeata"] },
  M01130: { ranks: { phylum: "Chordata", cls: "Mammalia", order: "Diprotodontia", family: "Phalangeridae", genus: "Trichosurus" }, author: "(Kerr, 1792)", synonyms: ["Didelphis vulpecula"] },
};

export const epithetOf = (scientific: string) => scientific.split(" ").slice(1).join(" ");

function seedTaxon(s: (typeof NSX_SPECIES)[number], index: number): Taxon {
  const meta = RANKS[s.nsx];
  const kingdom = s.kingdom as Kingdom;
  return {
    id: s.nsx,
    nsx: s.nsx,
    kingdom,
    group: s.group,
    common: s.common,
    scientific: s.scientific,
    ranks: meta.ranks,
    author: meta.author,
    current: true,
    values: {
      // Flora's Main has its own Order field, so a flora taxon is placed by its Class instead.
      higherTaxaLevel: kingdom === "Flora" ? "Class" : "Order",
      higherTaxaName: kingdom === "Flora" ? meta.ranks.cls : meta.ranks.order,
      family: meta.ranks.family,
      genus: meta.ranks.genus,
      species: epithetOf(s.scientific),
      author: meta.author,
      // Every NSX species here is a native, current South Australian species. The two Mains name
      // that differently (Figma): Fauna "Indigenous? / Current? / In SA?", Flora "Current Concept? /
      // Occurs in SA? / Native in SA?".
      ...(kingdom === "Flora"
        ? { order: meta.ranks.order, synonym: "No", currentConcept: "Yes", occursInSa: "Yes", nativeInSa: "Yes", editedOn: "4 Aug 2026", editedBy: "Lana Steiner" }
        : { indigenous: "Yes", current: "Yes", inSa: "Yes", nonSynonym: "Yes", modifiedOn: "4 Aug 2026", modifiedBy: "Lana Steiner" }),
      // Placeholder people and dates (CONTRACTS 0.3).
      createdOn: "12 Mar 2019",
      createdBy: index % 2 ? "Phoenix Baker" : "Olivia Wyatt",
    },
    tables: { commonName: [{ name: s.common, seq: "1", type: "" }] },
    synonyms: meta.synonyms.map((name, i) => ({ id: `${s.nsx}-syn-${i + 1}`, name, values: { genus: name.split(" ")[0], species: epithetOf(name) } })),
    parents: [],
    children: [],
  };
}

export const seedTaxa: Taxon[] = NSX_SPECIES.map(seedTaxon);

/** Ids a taxon made by Combine, Split or Append takes, in order: listed up front for the static export. */
export const NEW_TAXON_IDS = Array.from({ length: 12 }, (_, i) => `new-${i + 1}`);
export const staticTaxonIds = () => [...seedTaxa.map((t) => t.id), ...NEW_TAXON_IDS];

export const GROUP_PLURAL: Record<SpeciesGroup, string> = { Mammal: "Mammals", Bird: "Birds", Reptile: "Reptiles", Amphibian: "Amphibians", Plant: "Plants" };
/** Figma's "Show only" order. Figma also draws Fish; no fish is in the species list yet, so it filters to nothing. */
export const SHOW_ONLY = ["Amphibians", "Birds", "Fish", "Mammals", "Reptiles", "Plants"] as const;


// ── The hierarchy (Taxonomy View) ──

export interface TreeNode {
  id: string;
  name: string;
  rank: string;
  children: TreeNode[];
  /** Set on a species leaf. */
  taxonId?: string;
}

/** Domain > Kingdom > Phylum > Class > Order > Family > Genus > Species, from the current taxa. */
export function buildTree(taxa: Taxon[]): TreeNode {
  const root: TreeNode = { id: "Eukarya", name: "Eukarya", rank: "Domain", children: [] };
  const child = (parent: TreeNode, name: string, rank: string) => {
    let node = parent.children.find((c) => c.name === name && c.rank === rank);
    if (!node) {
      node = { id: `${parent.id}/${name}`, name, rank, children: [] };
      parent.children.push(node);
    }
    return node;
  };
  for (const t of taxa.filter((x) => x.current)) {
    const kingdom = child(root, t.kingdom === "Flora" ? "Plantae" : "Animalia", "Kingdom");
    const genus = [t.ranks.phylum, t.ranks.cls, t.ranks.order, t.ranks.family, t.ranks.genus].reduce(
      (node, name, i) => child(node, name, ["Phylum", "Class", "Order", "Family", "Genus"][i]),
      kingdom,
    );
    genus.children.push({ id: `taxon:${t.id}`, name: t.scientific, rank: "Species", children: [], taxonId: t.id });
  }
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name));
    n.children.forEach(sort);
  };
  sort(root);
  return root;
}

/** Every node id on the way down to a taxon, to open the tree to it. */
export function pathTo(root: TreeNode, taxonId: string): string[] {
  const walk = (n: TreeNode, trail: string[]): string[] | null => {
    if (n.taxonId === taxonId) return trail;
    for (const c of n.children) {
      const found = walk(c, [...trail, n.id]);
      if (found) return found;
    }
    return null;
  };
  return walk(root, []) ?? [];
}

// ── Fields ──

/** selectText: a code picker with its description beside it (EPBC Act). textPair: two text boxes under one label (Hybrid Parent 2). */
export type FieldKind = "select" | "text" | "readonly" | "textarea" | "date" | "checkbox" | "selectText" | "textPair";

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  /** Grid columns the field spans (a row is a 3 column grid unless it has two fields). */
  span?: number;
  /** selectText only: the description is filled from the code, not typed (Figma draws it greyed). */
  textReadOnly?: boolean;
}

export interface GridSection {
  title?: string;
  rows: FieldDef[][];
  /** Two-field rows keep to the three-column grid of the rows around them (as Figma draws the Higher Taxa row). */
  aligned?: boolean;
}

export interface TableDef {
  id: string;
  title: string;
  columns: FieldDef[];
  /** Linked Species draws one "Link Codes" header over a code and a species picker. */
  sharedHeader?: string;
}

export type TabDef =
  | { id: string; label: string; kind: "grid"; sections: GridSection[] }
  | { id: string; label: string; kind: "table"; tables: TableDef[] }
  | { id: string; label: string; kind: "attributes" };

const f = (id: string, label: string, kind: FieldKind = "select", options?: string[], span?: number): FieldDef => ({ id, label, kind, options, span });
const yn = (id: string, label: string) => f(id, label, "select", YES_NO);

/** Fauna's Main (Figma "Fauna - Main", and the Taxonomy View selected frame). */
const MAIN: TabDef = {
  id: "main",
  label: "Main",
  kind: "grid",
  sections: [
    {
      aligned: true,
      rows: [
        [{ ...f("speciesTypeNo", "Species Type No", "selectText", undefined, 2), textReadOnly: true }],
        [f("higherTaxaLevel", "Higher Taxa Level", "select", HIGHER_TAXA_LEVELS), f("higherTaxaName", "Higher Taxa Name")],
        [f("family", "Family"), f("taxonomicSeq", "Taxonomic Seq."), f("subFamily", "Sub Family")],
      ],
    },
    {
      aligned: true,
      rows: [
        [f("genus", "Genus"), f("species", "Species"), f("author", "Author")],
        [f("subspecific", "Subspecific"), f("subspecificAuthor", "Author")],
        [f("infraspecific", "Infraspecific"), f("infraspecificAuthor", "Author")],
      ],
    },
    {
      rows: [
        [yn("indigenous", "Indigenous?"), yn("nonSynonym", "Non Synonym?")],
        [yn("current", "Current?"), yn("inSa", "In SA?")],
        [yn("official", "Official?"), yn("endemicSa", "Endemic To S.A.?")],
      ],
    },
    { rows: [[f("nationalSpeciesIndexNo", "National Species Index No"), { ...f("type", "Type", "selectText"), textReadOnly: true }]] },
    { rows: [[f("comment1", "Comment 1", "textarea")], [f("comment2", "Comment 2", "textarea")]] },
    {
      rows: [
        [f("createdOn", "Created On", "readonly"), f("createdBy", "Created By", "readonly")],
        [f("modifiedOn", "Modified On", "readonly"), f("modifiedBy", "Modified By", "readonly")],
      ],
    },
  ],
};

const DISTRIBUTION_COLUMNS: FieldDef[] = [
  f("description", "Description", "text"),
  f("includeCensus", "Include Census"),
  f("bsAccept", "BS Accept"),
  yn("nativeInReg", "Native in Reg?"),
  yn("estabInReg", "Estab in Reg?"),
  yn("idCertain", "ID Certain?"),
  yn("dsnCertain", "Dsn Certain?"),
  f("consStat", "Cons. Stat"),
  f("colln50", "Colln < 50 yr"),
  f("nameMatch", "Name Match", "text"),
  f("herbariumNo", "Herbarium No.", "text"),
  f("voucherInitials", "Herbarium Voucher Initials", "text"),
  f("surname", "Surname", "text"),
  f("collNo", "Coll.No", "text"),
  yn("isRefHbVoucher", "Is Ref Hb Voucher?"),
  yn("isTaxonVoucher", "Is Taxon Voucher?"),
  f("comment", "Comment", "text"),
  f("adherbName", "Adherb Name", "text"),
  f("regCreatedBy", "Reg Created By", "readonly"),
  f("regCreationDate", "Reg Creation Date", "readonly"),
  f("regEditBy", "Reg Edit By", "readonly"),
  f("regEditDate", "Reg Edit Date", "readonly"),
];

const codeAndText = (id: string, label: string, options?: string[]) => f(id, label, "selectText", options);
const comment = (id: string) => f(id, "Comment", "textarea");

/** Flora's Main (Figma node 2541:160901). No Species Type No: it does not apply to flora. */
const FLORA_MAIN: TabDef = {
  id: "main",
  label: "Main",
  kind: "grid",
  sections: [
    { aligned: true, rows: [[f("higherTaxaLevel", "Higher Taxa Level", "select", HIGHER_TAXA_LEVELS), f("higherTaxaName", "Higher Taxa Name")], [f("family", "Family"), f("order", "Order"), f("majorGroup", "Major Group")]] },
    {
      rows: [
        [f("genus", "Genus"), f("species", "Species"), f("author", "Author")],
        ...[1, 2, 3].map((n) => [f(`infraRank${n}`, `Infraspecific Rank ${n}`, "select", INFRASPECIFIC_RANKS), f(`infraName${n}`, `Infraspecific Name ${n}`), f(`infraAuthor${n}`, "Author")]),
      ],
    },
    {
      rows: [
        [yn("synonym", "Synonym?"), yn("forCensus", "For Census?")],
        [yn("currentConcept", "Current Concept?"), yn("forBs", "For BS?")],
        [yn("synPartly", "Syn Qualifiers: Partly?"), yn("questionably", "Questionably?")],
        [yn("asMs", "As MS?"), f("phrase", "Phrase", "text")],
        [yn("idCertain", "ID Certain?"), yn("occursInSa", "Occurs in SA?")],
        [yn("endemicInSa", "Endemic in SA?"), yn("nativeInSa", "Native in SA?")],
        [yn("estabInSa", "Estab in SA?"), yn("collectedLast50", "Collected last 50yrs?")],
      ],
    },
    { rows: [[yn("hybrid", "Hybrid?")], [f("hybridRank", "Hybrid Rank"), f("hybridFormula", "Hybrid Formula")], [f("hybridParent2Nsx", "Hybrid Parent 2 NSX Code"), f("hybridParent2Taxon", "Hybrid Parent 2 Taxon")]] },
    { rows: [[f("lifeSpan", "Life Span", "readonly")]] },
    { rows: [[yn("published", "Published?"), yn("matchesCc", "Matches CC?")], [f("date", "Date", "date"), f("howCreated", "How Created")]] },
    { rows: [[f("comments", "Comments", "textarea")]] },
    {
      rows: [
        [f("createdOn", "Created On", "readonly"), f("createdBy", "Created By", "readonly")],
        [f("renamedOn", "Renamed On", "readonly"), f("renamedBy", "Renamed By", "readonly")],
        [f("editedOn", "Edited On", "readonly"), f("editedBy", "Edited By", "readonly")],
      ],
    },
  ],
};

export const FLORA_TABS: TabDef[] = [
  FLORA_MAIN,
  { id: "saRegions", label: "SA Regions", kind: "table", tables: [{ id: "saRegions", title: "SA Regions", columns: [f("region", "Region", "select", SA_PLANT_REGIONS), ...DISTRIBUTION_COLUMNS] }] },
  {
    id: "ausDistribution",
    label: "Australian & Overseas Distribution",
    kind: "table",
    tables: [{ id: "ausDistribution", title: "Australian & Overseas Distribution (from various sources)", columns: [f("stateOs", "State / OS", "select", STATES_OS), ...DISTRIBUTION_COLUMNS] }],
  },
  {
    id: "refHerb",
    label: "Reference Herb Data",
    kind: "table",
    tables: [
      {
        id: "refHerb",
        title: "Ref Herb Data",
        columns: [
          f("area", "Area (SAReg / State / OS)", "select", [...SA_PLANT_REGIONS, ...STATES_OS.filter((s) => s !== "SA")]),
          f("voucherInitial", "Herb. Voucher: Initial", "text"),
          f("surname", "Surname", "text"),
          f("collnNo", "Colln no.", "text"),
          f("adNo", "AD No. AD-X YYY WW n", "text"),
          f("areaVoucher", "Area Voucher?", "text"),
          f("taxonVoucher", "Taxon Voucher?", "text"),
          f("comment", "Comment", "text"),
        ],
      },
    ],
  },
  { id: "attributes", label: "Attributes", kind: "attributes" },
  {
    id: "status",
    label: "Status",
    kind: "grid",
    sections: [
      { title: "AUS. Conservation Status", rows: [[codeAndText("epbcAct", "EPBC Act", EPBC_CATEGORIES)], [comment("epbcComment")], [codeAndText("ausWorkingStatus", "Aus Working Status (UCN)")], [comment("ausWorkingComment")]] },
      {
        title: "SA Conservation Status",
        rows: [
          [codeAndText("saNpwAct", "SA NPW Act", SA_NPW_CATEGORIES)],
          [codeAndText("saAusWorkingStatus", "Aus Working Status (UCN)")],
          [comment("saNpwComment")],
          [codeAndText("saStatusRegSummary", "SA Status (Reg Summary)")],
          [comment("saStatusComment")],
        ],
      },
      { title: "Pest Plant Status", rows: [[yn("isProclaimed", "Is Proclaimed?")], [codeAndText("notifyDescription", "Notify Description", ["Y", "N"])], [codeAndText("controlDescription", "Control Description", ["Y", "N"])]] },
    ],
  },
  { id: "commonName", label: "Common Name", kind: "table", tables: [{ id: "commonName", title: "Common Name", columns: [f("name", "Common Name", "text"), f("seq", "Seq", "text"), f("type", "Type")] }] },
  {
    id: "linkedSpecies",
    label: "Linked Species",
    kind: "table",
    tables: [
      { id: "linkedParents", title: "Linked Species - Parents (Older Taxa)", sharedHeader: "Link Codes", columns: [f("code", "Link code", "text"), f("species", "Linked species")] },
      { id: "linkedChildren", title: "Linked Species - Children (Newer Taxa)", sharedHeader: "Link Codes", columns: [f("code", "Link code", "text"), f("species", "Linked species")] },
    ],
  },
];

export const FAUNA_TABS: TabDef[] = [
  MAIN,
  {
    id: "speciesStatus",
    label: "Species Status",
    kind: "grid",
    sections: [
      { rows: [[codeAndText("saStatusCode", "SA Status Code")], [comment("saStatusCodeComment")]] },
      { rows: [[codeAndText("australianStatus", "Australian Status")], [comment("australianStatusComment")]] },
      { rows: [[codeAndText("npwActStatusCode", "NPW Act Status Code", SA_NPW_CATEGORIES)], [comment("npwActComment")]] },
      { rows: [[codeAndText("epbcAct", "EPBC Act", EPBC_CATEGORIES)], [comment("epbcComment")]] },
    ],
  },
  { id: "ausDistribution", label: "Australian Distribution", kind: "table", tables: [{ id: "ausDistribution", title: "Australian Distribution", columns: [f("region", "Geographic Region", "select", STATES_OS), f("comment", "Attribute Comment", "text")] }] },
  { id: "commonName", label: "Common Name", kind: "table", tables: [{ id: "commonName", title: "Common Name", columns: [f("name", "Common Name", "text"), f("seq", "Seq", "text"), f("type", "Type")] }] },
  { id: "regionalData", label: "Regional Data", kind: "table", tables: [{ id: "regionalData", title: "Regional Data", columns: [f("region", "SA Region"), f("comment", "Attribute Comment", "text")] }] },
  { id: "speciesReference", label: "Species Reference", kind: "table", tables: [{ id: "speciesReference", title: "Species Reference", columns: [f("newSpeciesNo", "New Species No"), f("nsx", "NSX Code", "text"), f("species", "Species", "text")] }] },
  { id: "attributes", label: "Attributes", kind: "attributes" },
];

export const tabsFor = (kingdom: Kingdom) => (kingdom === "Flora" ? FLORA_TABS : FAUNA_TABS);

/** Attributes: the filter bar, the table, and the Personal Notifications list behind its button. */
export const ATTRIBUTE_FILTERS: FieldDef[] = [f("regionGroup", "Region Group"), f("regionName", "Region Name"), f("attributeGroup", "Attribute Group"), f("attributeName", "Attribute Name")];
export const ATTRIBUTE_COLUMNS: FieldDef[] = [
  f("isCurrent", "Attribute is Current?", "checkbox"),
  f("isOfficial", "Attribute is Official?", "checkbox"),
  f("regionGroup", "Region Group", "text"),
  f("regionName", "Region Name"),
  f("attributeGroup", "Attribute Group", "text"),
  f("attributeName", "Attribute Name"),
  f("source", "Source", "text"),
  f("dateOfAssessment", "Date of Assessment", "date"),
  f("comments", "Comments", "text"),
  f("criteria", "Criteria", "text"),
  f("trend", "Trend"),
  f("qualityText", "Quality Text", "text"),
  f("num", "Num", "text"),
  f("unit", "Unit"),
  f("qualification", "Qualification"),
];
export const NOTIFICATION_COLUMNS: FieldDef[] = [f("userName", "User Name", "text"), f("email", "Email Address", "text")];

/** The synonym editor, one per kingdom ("Synonyms Only" on). */
export const FLORA_SYNONYM: GridSection[] = [
  { rows: [[f("nsx", "NSX Code", "readonly"), f("nsxDesc", "NSX Desc", "readonly"), f("scientificNameId", "ScientificNameID", "readonly")]] },
  { aligned: true, rows: [[f("higherTaxaLevel", "Higher Taxa Level", "select", HIGHER_TAXA_LEVELS), f("higherTaxaName", "Higher Taxa Name")], [f("family", "Family"), f("order", "Order"), f("majorGroup", "Major Group")]] },
  {
    rows: [
      [f("genus", "Genus"), f("species", "Species"), f("author", "Author")],
      ...[1, 2, 3].map((n) => [f(`infraRank${n}`, `Infraspecific Rank ${n}`, "select", INFRASPECIFIC_RANKS), f(`infraName${n}`, `Infraspecific Name ${n}`), f(`infraAuthor${n}`, "Author")]),
    ],
  },
  { rows: [[yn("synPartly", "Syn Qualifiers: Partly?"), yn("questionably", "Questionably?")], [yn("asMs", "As MS?"), f("phrase", "Phrase", "text")]] },
  {
    rows: [
      [yn("hybrid", "Hybrid?")],
      [f("hybridRank", "Hybrid Rank"), f("hybridFormula", "Hybrid Formula")],
      // Figma draws Hybrid Parent 2 as two text boxes, and "Published?" twice (here and beside Matches CC).
      [f("hybridParent2", "Hybrid Parent 2", "textPair"), yn("published1", "Published?")],
    ],
  },
  { rows: [[yn("published2", "Published?"), yn("matchesCc", "Matches CC?")], [f("date", "Date", "date")]] },
  { rows: [[f("comments", "Comments", "textarea")]] },
];

export const FAUNA_SYNONYM: GridSection[] = [
  { rows: [[f("nsx", "NSX Code", "readonly"), f("nsxDesc", "NSX Desc", "readonly")]] },
  { aligned: true, rows: [[f("higherTaxaLevel", "Higher Taxa Level", "select", HIGHER_TAXA_LEVELS), f("higherTaxaName", "Higher Taxa Name")], [f("family", "Family"), f("subFamily", "Sub Family"), f("genus", "Genus")]] },
  { rows: [[f("species", "Species"), f("author", "Author")], [f("subspecific", "Subspecific"), f("subspecificAuthor", "Author")], [f("infraspecific", "Infraspecific"), f("infraspecificAuthor", "Author")]] },
  { rows: [[yn("indigenous", "Indigenous?"), yn("current", "Current?"), yn("official", "Official?")]] },
  { rows: [[f("creationDate", "Creation Date", "date"), f("modifiedDate", "Modified Date", "date")]] },
  { rows: [[f("comments", "Comments", "textarea")]] },
];

export const synonymFieldsFor = (kingdom: Kingdom) => (kingdom === "Flora" ? FLORA_SYNONYM : FAUNA_SYNONYM);

// ── The four actions ──

export type ChangeType = "rename" | "combine" | "split" | "append";

export const CHANGE_META: Record<ChangeType, { title: string; nav: string; verb: string; commitLabel: string; shape: string; summary: string }> = {
  rename: { title: "Rename Taxon", nav: "Rename Taxon", verb: "Rename", commitLabel: "Commit & Modify", shape: "1 to 1", summary: "Give a taxon a new name. It keeps its concept; the old name becomes a synonym." },
  combine: { title: "Combine Taxon", nav: "Combine Taxon", verb: "Combine", commitLabel: "Commit & Modify", shape: "2+ to 1", summary: "Merge two or more taxa into one new taxon. The old taxa become its parents." },
  split: { title: "Split Taxon", nav: "Split Taxon", verb: "Split", commitLabel: "Commit & Modify", shape: "1 to 2+", summary: "Divide one taxon into two or more new taxa. The old taxon becomes their parent." },
  append: { title: "Append Species", nav: "Append Species", verb: "Append", commitLabel: "Append", shape: "New", summary: "Add a new species to the hierarchy." },
};
export const CHANGE_TYPES: ChangeType[] = ["rename", "combine", "split", "append"];

/** The name parts of a new (or an old) taxon, as the action screens ask for them. */
export interface NameParts {
  /** The new taxon's NSX code, typed by the admin: nothing assigns one (the designer, Sept 30 2026). */
  nsx: string;
  higherTaxaLevel: string;
  higherTaxaName: string;
  genus: string;
  species: string;
  speciesAuthor: string;
  infra: { rank: string; name: string }[];
  /** Append only. */
  order: string;
  majorGroup: string;
  family: string;
}

export const emptyNameParts = (): NameParts => ({
  nsx: "",
  higherTaxaLevel: "",
  higherTaxaName: "",
  genus: "",
  species: "",
  speciesAuthor: "",
  infra: [
    { rank: "", name: "" },
    { rank: "", name: "" },
    { rank: "", name: "" },
  ],
  order: "",
  majorGroup: "",
  family: "",
});

export function partsOf(t: Taxon): NameParts {
  return { ...emptyNameParts(), higherTaxaLevel: "Order", higherTaxaName: t.ranks.order, genus: t.ranks.genus, species: epithetOf(t.scientific), speciesAuthor: t.author, order: t.ranks.order, family: t.ranks.family };
}

/** "Genus species subsp. name", from the parts filled in. */
export function nameFromParts(p: NameParts): string {
  const infra = p.infra.filter((i) => i.name.trim()).map((i) => `${i.rank ? `${i.rank} ` : ""}${i.name.trim()}`);
  return [p.genus.trim(), p.species.trim(), ...infra].filter(Boolean).join(" ");
}

/** Every genus and species epithet already in use, for the pickers. */
export function nameOptions(taxa: Taxon[], kingdom: Kingdom | null) {
  const pool = taxa.filter((t) => !kingdom || t.kingdom === kingdom);
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    genera: uniq(pool.map((t) => t.ranks.genus)),
    species: uniq(pool.map((t) => epithetOf(t.scientific))),
    authors: uniq(pool.map((t) => t.author)),
    families: uniq(pool.map((t) => t.ranks.family)),
    orders: uniq(pool.map((t) => t.ranks.order)),
    higherNames: (level: string) =>
      uniq(
        pool.map((t) =>
          level === "Kingdom" ? (t.kingdom === "Flora" ? "Plantae" : "Animalia") : level === "Phylum" ? t.ranks.phylum : level === "Class" ? t.ranks.cls : level === "Order" ? t.ranks.order : level === "Family" ? t.ranks.family : level === "Genus" ? t.ranks.genus : "",
        ),
      ),
  };
}

export interface TaxonChange {
  id: string;
  type: ChangeType;
  at: string;
  by: string;
  inputs: { id: string; name: string }[];
  outputs: { id: string; name: string }[];
}
