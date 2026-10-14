# 2026-10-14 - Taxonomy version 2: one taxon per append, a page for every rank

- **Oct 14 2026: Taxonomy version 2: one taxon per append, a page for every rank.** The designer's review of
  2026-10-14-02, agreed in wireframes first. This entry supersedes parts of 02 (the "add as new" parent and the climbing
  choice are gone).
  - **One append adds one taxon** (the designer: "the higher rank is used just to map the newly added under the selected
    rank"). The rank above is picked from taxa already there, with no "add as new"; a missing parent is appended first.
  - **Read-only ranks are label over value**, the record's view treatment (`ValueGrid`, tx-v2-record.tsx), not disabled
    fields ("why are you going for field component when its not editable").
  - **Every append gets a new NSX code**, at every rank, and is **always confirmed** first: the new taxon with its rank, a
    New badge and the code, then every rank above it named ("call out the rank names as well").
  - **The tree shows the taxa beside each rank**: the path to the chosen parent open, every sibling at each rank, the new
    taxon marked New among its siblings ("a realistic hierarchy ... with the parallel concepts of each rank").
  - **Published higher taxa added** (designer: "yes add"): about 100 South Australian classes, orders, families and genera
    from the Australian Faunal Directory and the Australian Plant Census (`PUBLISHED` in tx-hierarchy.ts), no NSX code
    invented for them; existing higher taxa read "Not provided" (designer: "yes we can do that").
  - **A page for every rank** (`/pages/taxonomy/version-2/record?id=<path>`): a species is the species record (Back link
    to All taxa); a higher taxon has the same layout and the same tabs, species-only tabs kept (designer: "leave the
    species only as well"), and its Main tab shows Kingdom down to its own rank and nothing below.
  - **List:** heading Taxa, column 2 "Taxa / All taxa" with Flora and Fauna (the two teams), columns Name, Rank, NSX Code,
    Group, Synonyms, Status; every row opens its page. Group above Class is empty; from Class down it is the class's group.
  - **Bug found and fixed while testing:** right after an append the page re-rendered with the new taxon both in the data
    and as the New preview, two tree items with one id, which hung the tab. The preview is now drawn only when the taxon is
    not in the data yet. First occurrence, so no AUTO check (0.8).
  - **Open:** editing a higher taxon, and its Synonyms view; Rename, Combine and Split at higher ranks; the real NSX
    allocation rule; the Agentation "l" and "p" shortcuts in development (02). Two families named "New" (Flora and Fauna)
    sit in this browser's `biodata-taxonomy-ranks` store from the earlier build of Append; they were not made by these
    tests and were left for the designer.
  - Verified: `tsc`, `eslint` on touched files, `check:contracts`; live in Chrome as BioData Admin: Append Order (Amphibia,
    confirmation with ranks and A00217, record page), Append Family under it (A00218, no hang), the list, zero console
    errors. Test taxa removed from local storage afterwards. Not run: the typography skills (0.6 item 8), other personas.
    Not committed.
  - **Later the same day.** (1) A higher taxon's tabs are the species tabs with only the fields of lower ranks taken out
    (`tabsAt`, tx-v2-record.tsx): the first build had replaced Main with a hierarchy summary, which the designer had not
    asked for ("I only wanted you to remove details related to lower ranks"). Higher Taxa reads as on a species record
    (Order for fauna, Class for flora; the rank above for a taxon at or above that rank). (2) Version 2's action is
    "Append Taxon" (title, breadcrumb, Update taxonomy menu; the button stays "Append"). (3) Eight published infraspecies
    added under the species already here (AFD trinomials, APC subsp.), no NSX code invented; they had been left out by
    oversight. Open: the Version tool did not show on one record page in a live check, not yet looked into.
