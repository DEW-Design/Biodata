# 2026-10-23 - Map visualise: the dataset is the title, the way back names the report, and the swap menus go

- **Oct 23 2026: Map visualise: the dataset is the title, the way back names the report, and the swap menus go.** The designer, with a screenshot of the card header: "so the click is for DS-2026-01003. This makes
  wayfinding so hard. Where did I come from? Why am I not seeing that front and centred? ... we're also looking at data for the above DS, so let's only bring this information forward. I think we might be complicating
  the whole experience." Through `/refine-prompt`; the package was proposed with a before and after and approved ("Yeah, let's clean up, thanks!"). It reverses `2026-10-23-15-*` ("File as title") and removes what
  `2026-10-23-10-*` (swap the project or the dataset), `-13-*` and `-14-*` (the popups and the Popup tool) and `-21-*` (the icon in the switcher) built.
  - **The problem (measured):** the dataset id, which is how the report names what it was run on ("Dataset: DS-2026-01003"), was 12px grey at the top right of the card; the file name was the title; the way back said
    "Back to report" with no report and no dataset (the header's trail does name the report, but away from the card).
  - **Built, in `dataset-error-map.tsx`:**
    - **The header:** a "Dataset" eyebrow (12/600, the card's own eyebrow layer) with "Hide list" at its right; **DS-2026-01003 as the title (16/600)**; under it the file and the project, both 14/500 in the
      primary text (the row-title layer; measured), the project with its Folder icon and its code as part of the name, "Flinders Ranges Reptile Atlas (BD-5137)", never cut (`FittedText` `tail`). The file is cut by
      its end, the project by words ("Flinders Ranges Reptile… (BD-5137)" at 280px). No new type layer: the header lost the 12px id and one 16px line and gained none.
    - **The way back names the report:** "Back to Data Validation Error Report" (the title from `REPORTS`, not typed again), to the report on this same dataset (`?dataset=DS-2026-01003`, the role kept): measured the
      href, and Enter on it from the keyboard lands on the report. It has the card's first row to itself, so nothing crowds it; "Hide list" was moved to the eyebrow line for that reason (beside the back link a
      long report name collided with it at 280px, caught in the live pass).
    - **Removed:** the file and project swap menus (`BreadcrumbSwitcher` in the card, `switches`, `goToDataset`, the lists of projects and datasets with errors), which also took away everything that existed only to
      serve their popups: the Popup tool on the Prototype tools bar (the comparison of how a popup stands out; with no popup on the card it has nothing to compare, 4.4), the dim layer and its selector, the
      `Emphasis` options and `EDGE_CLASS`, the header ref the popups anchored to. Measured: no switcher on the card, no Popup tool on the bar, no dim layer. To look at another dataset a person goes back to the
      report, whose Parameters is where a project and a dataset are chosen (4.6: a report does not ask for the same thing twice).
    - **Shared pieces trimmed to what is used:** `BreadcrumbSwitcher` lost the props only this card passed (`truncate`, `suffix`, `icon`, `anchorRef`, `crossOffset`, `popoverClassName`, `triggerClassName`) and its
      "View all" bar is required again, as the other eight callers pass it; what was done for every caller stays: the current record is the selected row (tint and a brand tick at the right, `2026-10-23-21-*`),
      choosing it closes the popup. `FittedText` keeps its `tail` (the card's project line uses it).
  - **Kept as it was:** the tabs (All errors, Outliers, Other errors: the category filter is still pending), Hide list and its behaviour (scroll position kept, the map refits; the folded card is now 146px tall, so the
    map's top padding is 192px, not 176), the code as part of the project name, the alpha edges.
  - **Checked (Playwright, a script outside the repo):** 1686, 340 and 280px; the title, eyebrow and both lines' computed type; the back link's text, href and keyboard use; fold, unfold, Space and Enter, scroll kept;
    the project page's and a DLA record's switchers still open with the current row selected and close on choosing it; zero console errors; `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts`
    clean. Typography QA (0.6 item 8): the new text is "Dataset" (the existing eyebrow layer), the id (the existing title layer) and the back link's own label; no layer added. **Not verified:** touch, a screen reader,
    the "No errors to map" card at 280px (it takes the same long back link, cut by characters there), and the other roles' Explore screens (not touched).
  - **Open:** (1) the category filter (the product's one Filter, scrolling tabs, or a tile grid) is still undecided; (2) whether the eyebrow should read "Dataset" (as proposed) or "Map visualise" (what the view is
    called; the header trail already says it); (3) the file line has no icon while the project line has one, as before. Not committed.
