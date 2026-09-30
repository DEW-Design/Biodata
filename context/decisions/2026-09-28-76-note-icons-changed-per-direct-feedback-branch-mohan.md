# 2026-09-28 - Note icons changed, per direct feedback (branch `mohan-wips`)

- **Sept 28 2026: note icons changed, per direct feedback (branch `mohan-wips`).**
  - A field's note menu opens from a small add button (`Plus`, labelled "Add a note to <field>"), shown on hover or focus. It was a horizontal "...".
  - Each note card's Edit / Remove menu uses a vertical menu icon (`DotsVertical`), shown only while the card is hovered or focused, or while its menu is open.
  - Resolve stays a visible text button on the questionable card.
  - Verified headlessly: the card menu's opacity is 0 when idle and 1 on hover; add, edit, remove and resolve flows unchanged; zero console errors. `tsc`, `eslint` and `check:contracts` are clean. Not committed.
