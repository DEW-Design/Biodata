# 2026-10-14 - Taxonomy version 2: Rename Taxon

- **Oct 14 2026: Taxonomy version 2: Rename Taxon.** Agreed in wireframes; the designer's "okay, lets build it" kept the
  three proposals: the renamed taxon keeps its NSX code (the same taxon, unlike Split and Combine), Rename can also move it
  to another parent, and a name that is already taken blocks it.
  - **Rename Taxon** (`/pages/taxonomy/version-2/rename`, tx-v2-rename.tsx), built as Append, Split and Combine are:
    Species Type, Rank, the taxon picked from a search with the ranks above as label and value and its NSX code ("stays the
    same"), the tree with the taxon highlighted and its new name marked New where it will sit, the parent (starting as the
    current one; any at the rank above in the kingdom moves it there) and the new name, "Becomes ...", what changes under it,
    and a confirmation naming the old and new name, the code, a move, what is renamed below, the synonym, and every rank above.
  - **Names below:** renaming or moving a genus renames its species and infraspecies, and a species its infraspecies (their
    names start with it); a family or order renamed or moved renames nothing below. Species records are renamed with their
    old name kept as a synonym (`retargetTaxa`); other taxa move with one `NodeMove`, which renames those under it.
  - Update taxonomy in version 2 now opens version 2's page for all four changes.
  - **Open:** a renamed higher taxon keeps no record of its old name (only species records have synonyms); record page links
    to a renamed taxon's old address no longer resolve; the parent search offers any taxon at the rank above in the kingdom,
    not only nearby ones (the wireframe's note said "in Macropodidae").
  - Verified: `tsc`, `eslint`, `check:contracts`; live in Chrome as BioData Admin: Rename of the genus Trichosurus to a test
    name, its species (NSX code unchanged, old name added as a synonym) and its subspecies renamed, no old genus left behind,
    the confirmation. Moving to another parent and the clash block were not exercised live. The browser's saved taxonomy
    was backed up before the test and restored after. Not run: the typography skills (0.6 item 8), other personas. Not
    committed.
  - **15 Oct 2026, the designer's review.** (1) The first field is "Taxa Type" on all four version 2 pages (Append, Split,
    Combine, Rename): the form row, its "Details missing" name, and the radio group's accessible name (`SpeciesTypeField`
    gained an opt-in `label`; version 1 keeps "Species Type"). (2) Rename's tree no longer adds the new name as a second,
    New taxon: the taxon itself is renamed in place as the name is typed, moved under the new parent when one is chosen, and
    the names under it follow ("the existing ones must be updated as the user types"). Verified live: Rename of an order,
    the tree updating in place, nothing saved.
  - **15 Oct 2026, layout.** On all four version 2 change forms the hierarchy panel sits in its own column on the right,
    beside every field and held in view while they scroll (`WithHierarchy`, tx-v2-list.tsx); the fields stay together on the
    left, each section capped at 560px ("the editable sections stays nicely together and dont need scrolling"). The
    `FormRow wide` this replaced is no longer used by these forms. Verified live on Rename at 1415px.
  - **15 Oct 2026, moving taken out.** The designer asked where moving came from: it was not a requirement, it was proposed
    here and built on an unanswered question. Rename now changes the name only. An order, family or genus has no parent
    field. A species or infraspecies keeps the genus or species field, because that is part of its name (version 1's Figma
    Rename has New Genus and New Species); the confirmation says "New genus" rather than "Moves to". Verified live: a family shows the name field only; a species shows Genus and the epithet.
