# 2026-10-14 - Taxonomy version 2: Split Taxon, and the hierarchy view opens every rank

- **Oct 14 2026: Taxonomy version 2: Split Taxon, and the hierarchy view opens every rank.** Agreed in wireframes; the
  designer's "okay lets do this" kept the drawn defaults for the three open questions.
  - **Hierarchy view:** every node opens its page (`/pages/taxonomy/version-2/record`), not only species. Search and filters
    apply: the tree shows the taxa that match with the taxa above them, those drawn muted (`NodeTree matchIds`), and opens
    fully while a search, Rank or Group filter is on.
  - **Split Taxon** (`/pages/taxonomy/version-2/split`, tx-v2-split.tsx), built as Append Taxon is: one page, Species Type,
    Rank, the taxon picked from a search at its rank (current taxa only) with its ranks above as label and value, the tree
    beside it, the new taxa listed with a generated NSX code each (`nextNsxCodes`), and a confirmation naming the old taxon
    (Superseded), the new ones (New, code), what moves, and every rank above.
  - **Defaults kept:** (1) what the split taxon holds, one rank down, must each be moved to a new taxon, everything under it
    going too; a species moved to a new genus is renamed and keeps its old name as a synonym (`retargetTaxa`); (2) every part
    is a new taxon with a new code, the one keeping the original name included; (3) at least two new taxa.
  - **The model** (tx-hierarchy.ts): a split higher taxon is kept as a record (`#split-` id, not current, `became`), its old
    node retired, the new ones added (`cameFrom`); taxa that are not species records are moved by `moves`, renaming those whose
    name starts with their old parent's; species records are renamed in the taxonomy store, and a species or infraspecies
    record split goes through version 1's `commitSplit`. A superseded record that shares its name with a new one sits beside
    it (current records take the name's place). Its page says it is no longer current and what it became.
  - Update taxonomy in version 2: Append Taxon and Split Taxon open version 2's pages; Rename and Combine are still version 1's.
  - **Open:** a split species record's notice links to version 1's record page (SpeciesRecord's own link); Linked Species is
    not filled for higher taxa yet; Rename and Combine (Merge) for version 2; the Version tool showed on some record and form
    loads and not others in live checks, not looked into.
  - **Not ours, seen in the console:** a parse error in `app/pages/biodata-home/version-2/page.tsx` (another piece of work in
    progress), and extension message-channel errors.
  - Verified: `tsc`, `eslint` on touched files, `check:contracts`; live in Chrome as BioData Admin: the hierarchy view opening
    Tracheophyta; Split of the genus Malurus into two test genera, the species moved and renamed with both subspecies, its
    synonym kept, the superseded Malurus page with its notice. The browser's saved taxonomy was backed up before the test split
    and restored after. Not run: the typography skills (0.6 item 8), other personas. Not committed.
