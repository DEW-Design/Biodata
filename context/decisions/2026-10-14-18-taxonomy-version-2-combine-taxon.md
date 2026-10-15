# 2026-10-14 - Taxonomy version 2: Combine Taxon

- **Oct 14 2026: Taxonomy version 2: Combine Taxon.** Agreed in wireframes and a plain-language explanation of what moves
  and what is renamed (the designer is not from a scientific background: only species and infraspecies names change, since
  their first word is the genus; whole branches move unchanged otherwise).
  - **Combine Taxon** (`/pages/taxonomy/version-2/combine`, tx-v2-combine.tsx): Split Taxon in reverse, built the same way.
    Species Type, Rank, two or more taxa picked (the second and later searches only offer the taxa beside the first), the
    ranks above as label and value, the tree with the picked taxa highlighted and the combined one marked New, the combined
    taxon's name (keep one of theirs, or a new one), its generated NSX code, what moves with "Becomes" for renamed species,
    and a confirmation naming the superseded taxa, the new one, what moves and every rank above.
  - **Decided:** same parent only (designer: "yes"); a name clash among what moves blocks the combine until one is renamed
    (designer: "yes block combine until you fix it"); the combined taxon is always new with a new NSX code, the name kept or
    not (the proposal; the designer said "go ahead" without changing it).
  - **The model:** each combined higher taxon is kept as a record (`#combine-` id, not current, `became`), its node retired,
    the combined one added (`cameFrom`); species records go through version 1's `commitCombine`, which makes their names the
    new one's synonyms. `TaxonPicker` gained opt-in `label`, `within` and `exclude`; `NodeTree` gained `highlightIds`.
  - **Bug found and fixed while testing (Split had it too):** a combined or split taxon that kept a name could share its id
    with the node the renamed species records build, so the made record was skipped and then retired, and its page said
    "Taxon not found". Added records now lay their facts on that node and are never retired. First occurrence, no AUTO
    check (0.8).
  - Update taxonomy in version 2 now opens version 2's Append, Split and Combine; Rename is still version 1's.
  - Verified: `tsc`, `eslint`, `check:contracts`; live in Chrome as BioData Admin: Combine of the genera Crinia and Uperoleia
    keeping Uperoleia (the second search offering only their sibling genera, keyboard pick, the confirmation, both species
    renamed with one synonym each, the combined genus current with A00218). The clash block was not exercised live (no two
    clashing species in the data). The browser's saved taxonomy was backed up before the test and restored after. Not run:
    the typography skills (0.6 item 8), other personas. Not committed.
