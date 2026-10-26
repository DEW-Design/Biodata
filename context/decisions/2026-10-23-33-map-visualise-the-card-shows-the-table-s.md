# 2026-10-23 - Map visualise: the card shows the table's own data, and the species leads

- **Oct 23 2026: Map visualise: the card shows the table's own data, and the species leads.** The designer, with a screenshot of the list: "we cannot fabricate the data that goes on here. It has to be derived from the
  table. We're looking at errors on a species level on the previous screen (data validation error report), so species should show up here - no? Current state feels unintuitive." (0.3: no invention; 0.9: borrow from the
  screen it was opened from.) Supersedes the row design of `2026-10-23-05-*` and `-11-*` ("a row says only what differs from the one beside it").
  - **What was on the card that is not in the table (read from the code and the table's columns):** the report's table has Record ID, Project, Species (scientific, then common), Category, Rule, Field, Severity and
    Description. The list's row title was a computed phrase, "388 km from its cluster" or "382 km outside the project extent" (`outlierText`, from `row.outlier.distanceKm`, not a column), and for an out-of-extent record
    the 382 appears nowhere in the table (its description reads "Coordinates fall outside the geographic extent registered for the project"); the summary had a "Distance" row of the same computed phrase; the map's
    marker tooltips carried it too. And the species, the report's own subject, was left off every row when a dataset had only one (`speciesVary`: "stated once"), which is what the sample has: all 98 errors of
    DS-2026-01003 are on one species, so no row said what the report is about.
  - **Changed (`dataset-error-map.tsx`):**
    - **A row is a row of the table, in its words:** the species as Explore's species rows have it (the common name as the title, the scientific name under it in italic: `ResultCard` `title`, `subtitle`,
      `subtitleItalic`), then the field that failed and the record's id (`Cover abundance · REC0003`), with the severity at the right. The category is the heading, the colour of the dot. Always, not only where species
      vary (`speciesVary` is gone).
    - **Nothing computed is shown as text:** `outlierText` is deleted; the summary's Distance row is gone (the summary is the table's Species, Category, Description, Record, Rule, Field and Severity); a map
      marker's tooltip is `record - common name - field`. For a species outlier the distance is still in the table's own description ("Location is 388 km from the typical cluster of other ... records"), which the
      summary shows.
  - **Checked against the report's table (Playwright, a script outside the repo; BioData Super Admin):** 12 rows of the card's list were matched by record id against the report's first page of rows: species (common
    and scientific), field and severity, 0 differences; no row has any "km" text; the summary of an out-of-extent record shows the table's description and four facts (Record, Rule, Field, Severity). A row is now 76px
    tall (60 before: three lines, not two), so about one row fewer shows. Zero console errors; `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean.
  - **Still derived, not in the table, and kept (proposed for the designer):** where a dot is (the point of the occurrence the record takes its place from); the "Typical cluster" mark and its key entry (the centre of
    the species' other records in the dataset) when a species outlier is chosen; the dashed outline of the project's extent. They are what a map is for and come from the report's own rows and the project, but they are
    not table columns. Say if any should go.
  - **Known:** with one species in the sample, the species reads the same on every row, as it does down the report's own Species column; the sample's species is a plant (Grass Tree) in a reptile atlas project, which
    is the sample data, not the card. Real datasets vary and the list will then say which species each error is on.
  - **Not verified:** a dataset with several species, other roles, the card at 280px with the longer rows. Not committed.
  - **Open:** whether the summary's heading should lead with the problem (the description) rather than the species; whether to drop the map-only derived marks; the rule codes.
