# 2026-10-01 - Underline tabs carry icons

- **Oct 1 2026: Underline tabs carry icons.** The designer sent the project page's tab row (Project, Survey records,
  Species, Artefacts and attachments) and asked for those to have icons too, `<Icon> <Nav Item>`. That settles the open
  question from the tab-icons lab (`/proto/tab-icons`: A text, B every tab, C selected only): B, an icon on every tab.
  - **Applied** (icons from the lab's set, the ones the app already uses for each concept): the project page and its
    option 2 (nine tabs), the DLA, DSA and nomination record pages, the user and role record pages, the Flora and
    Fauna dashboard (species group icons, `Folder` for Projects), Reports (All, Favourites, and one per category; the
    Favourites star removed in the previous task is back, now with the rest) and the records report (Events,
    Occurrences, Observations, with the records tree's icons).
  - **Contract.** New CONTRACTS.md 3.13 with the icon table, and `AUTO §3.13`: an underline `TabList` under `app/pages`
    with no `icon` fails, except `observations-search.tsx` and `project-details-view.tsx`.
  - **Exempt, open:** Explore's results tabs (the 440px card needs about 780px with icons and would scroll further), a
    record's dynamic section tabs (titles come from the data), and Home's task status filters (filters, not sections).
    Listed in the `ref-shell.md` backlog.
  - **Decided by me, to confirm:** applying it to every underline tab list rather than only the project page, because
    one treatment across tabs was the earlier instruction ("applied all across") and a mix would be the same
    inconsistency the Favourites tab had. Species uses `Feather` on both the project page and option 2, as in the lab.
  - **Verified:** in a live browser every listed tab list shows an icon on each tab (project page, option 2, DLA, DSA,
    nominations, user and role records, Flora and Fauna, Reports, records report) with no console errors; the project
    page row looked at in a screenshot. `tsc`, `eslint` on the touched files and `check:contracts` pass. Option 2's nine
    tabs need about 1,200px and scroll sideways within their row below that (it already did). Not committed.
