// Mock audit entries for the Flora and Fauna Taxonomy Reports' audit logs (the designer, 16 Oct 2026: "create some mock data, this is just to show when a particular
// species' taxonomy was either combined, renamed, split and/or appended"). Each is a Rename, Combine, Split or Append of a sample species, written the way a change
// committed in Taxonomy Management is (taxonomy-audit-data.ts): one row for each name it produced. They are made up (CONTRACTS 0.3: the people are the placeholder
// people, and the species are the sample taxa and well-known Australian species, but when each was changed, and the NSX codes of the species a change made, are
// not real), they are shown beside any real change, and nothing here is stored: Taxonomy Management's own change history and Linked Species do not show them.

export interface MockAuditEvent {
  /** When it happened, as an instant. */
  at: string;
  by: string;
  action: "Rename" | "Combine" | "Split" | "Append";
  /** The names before, joined with " + " in the log. A rename and a split have one, a combine several, an append none. */
  before: string[];
  /** One row for each name the change made. */
  made: { nsx: string; name: string; common: string }[];
}

export const MOCK_FLORA_AUDIT: MockAuditEvent[] = [
  { at: "2026-08-12T01:20:41Z", by: "Lana Steiner", action: "Rename", before: ["Eucalyptus leucoxylon"], made: [{ nsx: "P01937", name: "Eucalyptus leucoxylon subsp. pruinosa", common: "South Australian Blue Gum" }] },
  {
    at: "2026-09-03T04:05:12Z",
    by: "Phoenix Baker",
    action: "Split",
    before: ["Xanthorrhoea semiplana"],
    made: [
      { nsx: "P04412", name: "Xanthorrhoea semiplana subsp. semiplana", common: "Yacca" },
      { nsx: "P04413", name: "Xanthorrhoea semiplana subsp. tateana", common: "Tate's Grass-tree" },
    ],
  },
  { at: "2026-09-21T23:48:30Z", by: "Olivia Wyatt", action: "Combine", before: ["Acacia pycnantha subsp. a", "Acacia pycnantha subsp. b"], made: [{ nsx: "P09999", name: "Acacia pycnantha", common: "Golden Wattle" }] },
  { at: "2026-10-08T05:30:07Z", by: "Maya Dewitt", action: "Append", before: [], made: [{ nsx: "P01938", name: "Eucalyptus camaldulensis", common: "River Red Gum" }] },
];

export const MOCK_FAUNA_AUDIT: MockAuditEvent[] = [
  { at: "2026-08-19T02:15:00Z", by: "Lana Steiner", action: "Rename", before: ["Isoodon obesulus"], made: [{ nsx: "M01170", name: "Isoodon obesulus subsp. obesulus", common: "Southern Brown Bandicoot" }] },
  {
    at: "2026-09-09T06:40:55Z",
    by: "Phoenix Baker",
    action: "Split",
    before: ["Trichosurus vulpecula"],
    made: [
      { nsx: "M01131", name: "Trichosurus vulpecula subsp. vulpecula", common: "Common Brushtail Possum" },
      { nsx: "M01132", name: "Trichosurus vulpecula subsp. fuliginosus", common: "Mountain Brushtail Possum" },
    ],
  },
  { at: "2026-09-28T00:12:19Z", by: "Olivia Wyatt", action: "Combine", before: ["Crinia signifera", "Crinia parinsignifera"], made: [{ nsx: "A00215", name: "Crinia signifera", common: "Common Froglet" }] },
  { at: "2026-10-12T07:22:44Z", by: "Maya Dewitt", action: "Append", before: [], made: [{ nsx: "M01003", name: "Tachyglossus aculeatus subsp. multiaculeatus", common: "Short-beaked Echidna" }] },
];
