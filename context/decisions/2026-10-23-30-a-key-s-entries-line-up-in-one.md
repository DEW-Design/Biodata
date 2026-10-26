# 2026-10-23 - A key's entries line up in one column, now contract 2.14

- **Oct 23 2026: A key's entries line up in one column, now contract 2.14.** The designer, with a screenshot of the map's key annotated in red ("Category", then on the second row "Metadata" under the title, an arrow to
  "Business rule"): "category needs tweaking ... align metadata to business rule. this should be a contract." Through `/refine-prompt`.
  - **The fault:** `MapLegend` drew the title and every entry as one wrapping row (the entries `display: contents`), so where the key wrapped, the second row restarted under the title. The key is shared: Explore's
    "Species group" key had the same layout.
  - **Changed (`map-legend.tsx`):** two columns, the title (a non-shrinking item, given the entries' 20px row height so its text sits on the first row's centre line) and the entries (a wrapping list beside it). Where the
    entries wrap, the next row starts under the first entry. Under 680px of map the key still stacks (the title above the entries in a grid of two columns), which has its entries in columns already. Unchanged: type,
    swatches, spacing, one line when everything fits, the 440px width cap.
  - **Measured (Playwright, a script outside the repo; BioData Super Admin):** at 1686px the key is 440px wide, two rows ("Business rule, Coordinate mismatch" and "Metadata"), the first entry's swatch at x 168.5 on both
    rows (it was under the title); the title's text centre 887 and the first row's 887; with a species outlier chosen the key is one row ("Coordinate mismatch, Typical cluster"); at a 700px window the entries are
    aligned in their columns (x 104.5 on both rows). Zero console errors; `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean. **Not verified:** Explore's "Species group" key wrapped (it needs
    search results on screen; the component is the same one), a restricted block's square swatch in the key.
  - **The contract (the designer's instruction, 0.1; adding a clause is 9.4's audited act):** **CONTRACTS.md 2.14, "A key's entries line up in one column"**: a key (a map legend, or any title followed by entries that can
    wrap) is two columns; where the entries wrap the next row starts under the first entry, never under the title or at the container's edge; MUST NOT put the title and the entries in one wrapping row; the title takes
    the entries' row height; where there is no room it stacks with the entries in a grid; applies to `MapLegend` and any such group to come, not to a row of chips or facts with no lead-in label; checked live by reading the
    first entry's left edge on every row. `REVIEW` (a first occurrence, 0.8; one `AUTO` check is due if it recurs, though a class check would be brittle since the markup is what makes the title its own column).
    Added to `contracts/rule-scopes.json` as `build` (it applies wherever `app/**` and `components/**` are read) and `npm run contracts:rules` run: `contracts-build.md` has the clause and `contracts-core.md` its index line.
  - **Sibling grep (0.6 item 5):** the other wrapping rows in the shared map, report and filter code (the report's facts line, the report tiles, the filter chips, the table toolbars) have no lead-in label, so
    2.14 does not apply to them; `MapLegend` is the only title-and-entries group.
  - **Open:** none beyond the unverified Explore key. Not committed.
