# 2026-10-23 - Map visualise: category tabs from the report, severity at the right edge, an even header

- **Oct 23 2026: Map visualise: category tabs from the report, severity at the right edge, an even header.** The designer, with a screenshot of the card: "Let's polish the spacing at the top info. Also, let's move all
  severities to the far right. Currently looks like empty real-estate. Also, can you also look into the filter tabs? They're incorrect / the categories come from the previous screen - category [of failure/error]."
  Through `/refine-prompt` (Gap, Negative space, Badge; Tabs, "best for filtering the same content by time or category"; Single source of truth). Supersedes the tab set of `2026-10-23-18-*` (All errors, Outliers,
  Other errors), which was a hand-made split of the report's own Category.
  - **The tabs are the report's categories, read from the rows:** All errors 98, then **Business rule 54, Coordinate mismatch 29, Metadata 15** (`ERROR_CATEGORIES`, the report's order and its Category filter's
    values; the labels as the report's column writes them; 54 + 29 + 15 = 98). The counts come from each error's `category`, so the split exists in one place. Icons are the ones the report's counts used before they
    moved into its card (AlertCircle, MarkerPin01, Tag01; one icon per concept, 2.4), All errors keeps AlertTriangle. In All errors a heading starts each category ("Business rule 54", then the next); a category tab
    shows only its rows, the map follows it, the key lists what is on the map. Checked: each tab's rows, headings, key ("Other error" for Business rule and Metadata, the two outlier kinds for Coordinate mismatch),
    "Show 25 more" or none, ArrowRight cycling through all four. The dots keep their colours (outliers red or orange, the rest grey).
  - **Severity at the right edge:** `ResultCard` gained an opt-in `badgeAlign="end"` (1.6; the default, beside the title, is unchanged, so Explore's rows are as they were). Measured: every badge's right edge is
    12px from its row's right edge, High and Medium alike, in a column down the list.
  - **The header's vertical gaps, on one scale (measured before, then after, px):** card edge to way back 17 (16 and the border), unchanged; way back to the eyebrow row 10, now 12; title to file 2, now 6, so the
    one focal point stands apart from its two facts; file to project 2, unchanged (a pair); project to divider 12, now 16, as at the top. The `-my-1` that cancelled the toggle's height is gone.
  - **Known cost, not fixed: the four tabs do not fit.** The strip is 438px wide and the four tabs need about 618 (icons, counts). It scrolls under the existing fade: All errors, Business rule and most of Coordinate
    mismatch show, **Metadata does not until the strip is scrolled** (the same "how do I know there is more?" the designer raised about the first version). It cannot be fixed inside the underline tabs and 3.13
    (dropping the icons fails `AUTO §3.13`; "All" for "All errors" saves 37px, not 180). Two routes, each a designer decision: (1) the same four as wrapped `button-brand` tabs (two rows of two, all visible), a
    change of tab style on this card; (2) the product's one Filter (4.2d) with a Category attribute, as the report has it, which is where "the categories come from the previous screen" leads. Recommended: (1) if tabs
    are wanted, (2) otherwise.
  - **Also changed, to look at:** the All list is now in the report's category order (Business rule, Coordinate mismatch, Metadata), so the coordinate mismatches, the records the map is about, are no longer at the
    top; they were first when the tabs were Outliers and Other errors. Putting Coordinate mismatch first is one line (a sort); not done, since "come from the previous screen" was taken as its order.
  - **Checked:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; zero console errors; BioData Super Admin at 1686px. Typography QA (0.6 item 8): the tab labels are the Tab's
    own text, the headings the card's existing eyebrow layer; no layer added. **Not verified:** the narrow card (280px) with the new tabs, other roles, a dataset with no errors in one category (the tab shows 0 and the
    list says "No metadata errors in this dataset.", read from the code, not seen). Not committed.
