# 2026-10-01 - Collection tables keep their column widths in every state

- **Oct 1 2026: Collection tables keep their column widths in every state.** The designer sent two screenshots of the
  nominations list (All, then My): the Species, Protection, Nominated by and Status columns sat in different places
  ("another case of dancing layouts ... reflects poorly on the quality of product").
  - **Cause.** The tables used the browser's automatic column layout, which sizes each column to its widest cell in
    the rows showing. "All" held a row whose "Nominated by" had a second line (Maya Dewitt, South Australian Museum)
    and a status "Returned for more information"; "My" did not, so every column moved. Every list had the same flaw
    (filter, search, sort, page, scope switch), and it was the second width-jump of the day (the Explore search card,
    decision 2026-10-01-21).
  - **Changed.** `Table` (application) gets an opt-in `layout="fixed"` (additive, default unchanged). Every collection
    table is fixed, with a width on every column and a `min-w-*` on the table: Nominations, Projects, DLA (both
    tables), DSA (both), User Management (users, roles, permissions), Template finder, the `/pages` index, the project
    page (Survey records, Species, Artefacts) and its option 2 artefact table, the Reports list, and every report
    (`report-table.tsx`; the column widths in the report files are now `w-[Npx]`, not `min-w-[Npx]`). Percentages for the
    lists that fill the screen, pixels for the wide reports. A report's `TextCell` now truncates with the full text as
    the tooltip (a long project description had made its column 2,371px wide).
  - **Found on the way.** A fixed table needs a width on every column: a column left without one does not share what is
    left, Chrome leaves that space empty. So `layout="fixed"` is documented that way on the Table doc page.
  - **Contract.** New CONTRACTS.md 4.2f "Stable tables" and `AUTO §4.2f` (a `Table` with `bodyScrollable` and no
    `layout="fixed"` under `app/pages`), so this cannot come back list by list (section 0.8: it was a repeated
    fix in spirit, the second width jump of the day).
  - **Verified:** in a live browser every table's columns add up exactly to the table width and no cell's content spills
    into the next (measured at 1708px; the project page also at 1280px, where the table scrolls sideways), and on
    Nominations the column positions are identical across All, My and back. `tsc`, `eslint` on the touched files and
    `check:contracts` pass. `npm run build` was not run. The Users, DSA and DLA lists were measured (and the roles,
    DLA and nominations lists looked at in a screenshot), not all looked at one by one. Not committed.
  - **Open.** Explore's results table (columns chosen by the person, in a 440px card) and the lab-only
    `ingestion-report.tsx` are exempt in the check and listed in the backlog of `ref-shell.md`. A window under about
    1,100 to 1,240px now scrolls a list sideways where the automatic layout used to squeeze it; if that is unwanted on a
    laptop, the list needs fewer or narrower columns rather than the automatic layout back. Report columns cut with an
    ellipsis were previously stretched to fit: a few may need a wider width.
  - **Follow-up, same day: the other "My X / All X" bits.** The designer asked to check every All and My pair, not
    only the nominations columns. Measured, for every role, All against My on Nominations, DLA, DSA and Projects (and
    the Home tabs): the heading, subheading, primary button, search, Filter, table card and pagination sit at identical
    positions and widths in both (only the table's own height and the "All projects" / "My projects" heading text
    differ, which is content). Column 2's two tabs keep their position, size and colours when clicked. So after the
    column fix, the only remaining jump is one a headless browser cannot show: a scrollbar. Playwright hides them, and
    on Windows or a Mac with a mouse a classic scrollbar takes about 15px from the content the moment a list (All:
    scrolls) or a tab (My BioData: scrolls; Flora and Fauna Dashboard: does not) overflows. So a scrolling table reserves
    its scrollbar (`[scrollbar-gutter:stable]` in `Table`, when `bodyScrollable`) and every page-scrolling `<main>`
    does (Home, Projects, project page and its option 2, project details, observation detail, Explore's second layout),
    at no cost where scrollbars overlay. CONTRACTS.md 4.2f now says so and `AUTO §4.2f` fails a scrolling `<main>`
    without the gutter. **Not verified:** I could not see a classic scrollbar in the headless browser (it reports 0px
    even with its hide flag removed), so this part is by construction, not by measurement; it needs a look in a
    browser with "Always show scroll bars" on.
