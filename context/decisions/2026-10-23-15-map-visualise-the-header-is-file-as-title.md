# 2026-10-23 - Map visualise: the header is file as title, and the project line steps up

- **Oct 23 2026: Map visualise: the header is file as title, and the project line steps up.** The designer: "Card header = File as title. Let's ditch the other approaches. Can we make the project cluster more
  prominent?" Through `/refine-prompt` (the terms: Hierarchy, "the ranking of elements by importance"; Weight, "bold is for UI emphasis and hierarchy"; "project cluster" has no listed term and is read as
  the project line: its name, switcher caret and code). Assumed: "the other approaches" is the three other header options (`2026-10-23-07-*`); the Popup tool (`-14-*`) is a separate comparison that was not decided,
  so it stays.
  - **The choice, CONTRACTS 4.4:** the header is "the file is the title" (the other header options chosen against it: two names with the ids beside them, labelled rows, and one line project then file). The three
    options, the `HeaderStyle` type and the "Card header" tool on the Prototype tools bar are deleted from `dataset-error-map.tsx` (nothing outside this file carried them; checked: no reference left, the tool is
    not on the bar, the Popup tool is). `CardHeader` is now the one layout.
  - **The header:** "Map visualise" as the small heading (12/600 uppercase, quaternary) with the dataset's id at its right; the file as the title (16/600, with its switcher); under it the project.
  - **The project line, before and after:** it was the weakest text in the header, 14/400 in the supporting grey under a 16/600 title, so the file's parent read as a footnote. It is now the Folder icon
    (the icon the design system gives a project, as in the record tree and the rail's Projects, CONTRACTS 3.13 and 2.4), the project's name at 14/500 in the primary text (the row-title layer, measured
    `rgb(46, 41, 37)`), its switcher caret, and the code after it at 12/400 tertiary (the size the ids have everywhere else on the card). Title, then project, then ids, by size, weight and colour; all three layers
    already in use on the card (2.9). The icon says "this is the project" without a label, which is why it is there (2.12). The title is still the one focal point: 16/600 against 14/500.
  - **Unchanged and checked:** the header is the same height (the tabs start 140px down, 90px of header); the project switcher, its hover and open states and its popup under the header work (4 projects listed,
    the dim behind it); a narrow card (280px) cuts the name by words, "Flinders Ranges…", keeping the icon and the code, with the full name as the tooltip; zero console errors; `npx tsc --noEmit`,
    `npx eslint` and `npm run check:contracts` clean. **Not verified:** a project name long enough to push the code out at 280px (the name gives way, the code does not, by construction), and touch.
  - **Open:** (1) the Popup tool (stronger edge, dim, both) still needs a choice (recommendation: dim); (2) the icon's colour is quaternary, the grey the card's other icons use, and is not itself prominent: the name's
    weight and colour carry it; a filled chip behind the whole line would add more and was not done; (3) the file's own line has no icon, so the Folder is the only icon in the header: a file icon
    would match it and was not added (nothing asked, and the file is the title). Typography QA (0.6 item 8): no type layer added. Not committed.
