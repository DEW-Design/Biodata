# 2026-10-14 - Taxonomy Management version 2: every rank, Append on one page

- **Oct 14 2026: Taxonomy Management version 2: every rank, Append on one page.** The designer asked for a version 2 of
  Taxonomy Management that holds the whole hierarchy, not only species, starting with Append. Wireframes were agreed in
  chat first.
  - **Routes.** `/pages/taxonomy/version-2` (the list) and `/pages/taxonomy/version-2/append`. Version 1 is unchanged;
    the Version tool on the Prototype tools bar switches between them (`TxVersionTool`, on both lists and the Append).
  - **Wording unchanged** (the designer: "dont change any wording"): "Species" heading, "Species Type", "Append". Fauna and
    Flora stay in column 2. Rank is a filter in the Filter menu ("retain the rank within filter to maintain consistency")
    and a column.
  - **The model** (`tx-hierarchy.ts`): every rank from Kingdom to Infraspecies is a node, built from the species in the
    shared taxonomy store plus higher taxa appended in version 2 (their own store, `biodata-taxonomy-ranks`). A node's id
    is its path of names. The list starts at Order.
  - **Append** (`tx-v2-append.tsx`): Species Type, then Rank (Order, Family, Genus, Species, Infraspecies), then the
    hierarchy. The new name is a text box; the rank above it is the one choice, a search of that rank that can add what
    was typed as new. Picking an existing taxon fills every rank above it, read only, and the tree beside the fields opens
    to it, highlighted. Adding a new one moves the choice up a rank (the refinement agreed in the wireframe: an existing
    taxon's own parents are not edited here, that is a Rename). Species search is looked up as you type with a
    "Searching species" row (simulated delay, at most 20 matches). More than one new taxon asks first. Infraspecies has up
    to three levels, a rank and a name each; ranks are subsp. for fauna, subsp., var., f. for flora ("right for now").
    No Species Author or Major Group ("lets keep it simple").
  - **NSX code is generated** for a new species or infraspecies (the designer), replacing version 1's typed code for
    version 2 only. The real allocation rule is not known: `nextNsx` takes the nearest relative's letter and the next free
    number. Open: replace with the real rule.
  - **Component change (1.6, 1.3):** `MultiSelect` gained opt-in `onSearchChange`, `filterItems`, `isLoading`,
    `loadingLabel`, `onCreate`, `createLabel`. Defaults leave every existing caller unchanged. `FormRow` gained opt-in
    `wide`. `TxShell` gained `base`, `counts` and `formOnePage` (a one-page form keeps column 2 as Fauna and Flora).
  - **Found, not fixed:** in development, the Agentation toolbar (`app/layout.tsx`, development only) treats "l" and "p"
    as shortcuts whenever focus is not in a text field. react-aria's Autocomplete hands each typed key on to its list, so
    those two letters are swallowed in every searchable dropdown's search, version 1's included. The deployed build has
    no Agentation. Open for the designer: turn its shortcuts off or accept it.
  - **Open:** rows for an order, family or genus are not links (no record page for a higher taxon yet); a species row
    opens version 1's record page. Update taxonomy's Rename, Combine and Split still open version 1's flows. The "Species"
    heading now lists every rank: whether to rename it is the designer's call. Rename, Combine and Split for version 2 are next.
  - Verified: `tsc`, `eslint` on touched files, `check:contracts`; live in Chrome as BioData Admin: list, rank filter,
    hierarchy view, Append of a species under an existing genus (committed, NSX A00216, counts updated), a new genus moving
    the choice to Family, the two-taxa confirmation, Infraspecies with the species lookup and its Searching row, keyboard
    reach of the add-new row (Tab, Enter), zero console errors. Not run: the typography skills (§0.6 item 8); other
    personas (the route is behind the existing `taxonomyManagement` gate). Not committed.
