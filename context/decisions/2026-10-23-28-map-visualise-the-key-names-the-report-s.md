# 2026-10-23 - Map visualise: the key names the report's categories, and a dot's colour is its category

- **Oct 23 2026: Map visualise: the key names the report's categories, and a dot's colour is its category.** The designer: "the labels mean nothing - it's so weird. We know why it's a mismatch, but they're not
  intuitive at all. The labels are made up and not scalable", then, with a screenshot of the map's key ("Errors: Away from its cluster, Outside the project extent, Other error"): "this is what I mean." Assumed:
  "the labels" are the key's (the answer to the question asked in the previous turn, which offered the category names, the row titles and the severity words); the categories themselves are the report's, as the designer said
  at 2:21 PM ("the categories come from the previous screen").
  - **What was wrong with the key (measured and read):** three entries written for this card, not the report's words: two kinds of coordinate problem ("away from its cluster", "outside the project extent": jargon, and
    a person has to know what a cluster or an extent is) and "Other error", a catch-all that says nothing. Hard-coded to those three buckets, so it did not grow with the report's categories (the tabs and headings
    already used Business rule, Coordinate mismatch and Metadata), and the key disagreed with them.
  - **Built:** the key is titled **Category** (the report's attribute name) and lists the report's categories that are on the map, in the report's order: Business rule, Coordinate mismatch, Metadata. The dots on the
    map, the dots in the list rows and the key all take one colour per category from one place, `CATEGORY_COLOR`, a `Record<ErrorCategory, string>`: a category added to the type does not compile until it has a
    colour, and the key, the dots and the rows follow without another edit. Measured in the live page: the key's three swatches, the list dots and the map's marker fills agree (blue x54, pink x29, green x15 on the map),
    and in a category tab the key shows only that category. "Typical cluster" and "Restricted (block)" still join the key where a chosen record or a restricted record needs them.
  - **The colours (23 Oct 2026), chosen with the `dataviz` skill's validator, in the report's category order:** Business rule blue (`utility-blue-500`), Coordinate mismatch pink (`utility-pink-500`), Metadata green
    (`utility-green-500`). All checks pass: lightness band, chroma floor, colour-vision separation worst 10.9 (target 8 or more), normal-vision 29.2 (floor 15); green is under 3:1 against the surface, a warning the
    key's visible labels relieve. **Not red, orange or amber:** those are the severity badges' colours (High, Medium), and a dot beside a HIGH badge must not read as severity. Sets with red or purple next to blue also
    passed or failed on the validator, and blue next to purple failed (13.7), so they were not used.
  - **Gives up, on purpose:** the map no longer shows by colour whether a coordinate mismatch is far from its species' cluster or outside the project's extent (red and orange before). That is still in the row
    ("388 km from its cluster", "382 km outside the project extent") and the record summary's Distance; the map says which category, the list says how.
  - **Known, not fixed:** (1) blue, purple-adjacent and green are also Explore's species colours (Bird, Plant, Amphibian), so a colour means a category here and a species group there, under different key titles, on
    two screens; the design system has no further hues that pass next to these without red, orange or amber. (2) "Typical cluster" is the card's own word again (a reference mark for a species outlier). (3) The category
    names, the rules' labels and the severity words are still the prototype's sample data (the previous turn proposed a short plain label per rule from the rule catalogue; not started: it needs the catalogue's
    wording).
  - **Checked:** `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean; zero console errors; BioData Super Admin at 1686px, All errors and two category tabs, and with a species outlier chosen (the cluster
    entry joins the key). Typography QA (0.6 item 8): the key's text is `MapLegend`'s own. **Not verified:** a restricted record's block in the key with the new colours, other roles, a printed or forced-colours view
    (a dot is colour with a label beside it, not colour alone).
  - **Open:** whether "the labels" meant only the key; the rules' own plain labels; whether Explore's species colours and these should be told apart. Not committed.
