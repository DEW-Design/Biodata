# 2026-10-23 - Map visualise: swap the project or the dataset from the card

- **Oct 23 2026: Map visualise: swap the project or the dataset from the card.** The designer, with a screenshot of the card's header: "can I also swap projects / datasets to see any other errors as well?"
  - **Before:** the card named one project and one file as plain text; to see another dataset's errors a person went back to the report, chose it in the Parameters popover and pressed Map visualise again.
  - **Built:** the project's name and the file's name are each the button of the shared record switcher (`BreadcrumbSwitcher`, the searchable popup the project, report, DLA, DSA, nomination and user pages use for
    their crumbs), with its up-down caret saying so. The project's list is the projects that have a dataset with errors (A to Z, with the code after each); the dataset's is this project's datasets with errors,
    newest first (the file, with its id after it), as the report's own selects list them. The current one is ticked, search matches the name or the id. Choosing a project opens its newest dataset with errors.
    A switcher exists only where there is somewhere else to go (more than one project with errors, more than one dataset with errors in this project): a one-option switcher is dishonest, so otherwise the name stays plain text.
    It works in all four of the card header options on the tools bar.
  - **How it behaves (wayfinding):** the dataset is the address (`?dataset=`), so a swap changes the URL and with it the header trail's report crumb, the card's "Back to report", a reload and a copied link, all of which
    follow the new dataset (checked). The swap replaces the history entry instead of adding one, so the browser's Back still goes to the report this was opened from, not through each dataset looked at (checked: history
    length unchanged, Back lands on the report). A new dataset is a new list: the tab goes back to All errors (checked: Outliers before, All errors after), nothing is chosen, the list is at its first rows and its top,
    and the map is not remounted, so it flies to the new fit instead of going blank. Focus returns to the switcher that was used (checked), Escape closes without changing anything (checked).
  - **The shared component, extended additively (1.6, 1.3):** `BreadcrumbSwitcher` gained three optional props that no caller sets: `viewAllLabel` and `onViewAll` are optional together (the footer bar is drawn only
    with both; a dataset has no table of its own to view all of), `triggerClassName` (merged into the button's classes, so the name is 14/500 primary rather than a crumb's grey) and `truncate` (the label gives way with an
    ellipsis, the caret never does), and the caret icon is `shrink-0` (it was never meant to shrink). Every existing caller passes both footer props and neither new one: re-checked the report page's crumb (the "View all
    reports" bar and its 24 reports) and the project page's (the bar and its 4 projects, the trigger 69 x 20px).
  - **Checked (Playwright, a script outside the repo), BioData Admin at 1440 x 900:** Flinders has three datasets with errors (DS-2026-01003, 01011, 01054) and there are four projects with errors (Adelaide Hills, Coorong,
    Flinders Ranges, Kangaroo Island); choosing DS-2026-01011 gave `?dataset=DS-2026-01011` and its own counts (19 and 6); choosing Adelaide Hills opened its newest, DS-2026-01017; with the keyboard (Enter on the
    button, typing "Kang", Arrow Down, Enter) it went to DS-2026-01001; the Registered User has both switchers; all four header options lay out on the dataset with the longer file name, with no sideways overflow;
    zero console errors; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean.
  - **Not done, and open:** a dataset with no errors (the "No errors to map" card) has no switcher, since the card is its empty state: a way from there to a dataset that has errors would be the same switcher on
    that card; only datasets with errors can be swapped to, because the others have nothing to map (the report's selects do the same); the switcher's accessible name is "Switch project" or "Switch dataset", not the
    visible name (the shared component's existing choice). The navigation pattern page's demo was not changed (it needs no new prop). Not verified: a touch device and 280px wide. Typography QA (0.6 item 8): no text layer
    added (the names keep their 14/500 and 14/400, the caret is an icon). Not committed.
