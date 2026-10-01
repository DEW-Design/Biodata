# Cognitive load audit: project details

Date: 30 Sept 2026. Screen: the project page template (`/pages/project-list/<id>/project-details`, also `/pages/project-detail`). Nothing was changed to produce this report.

## Scope and method

- **Screen and tabs:** Project, Survey records (with the record panel), Species, Artefacts and attachments.
- **Users:** BioData Admin, Registered User, Public User.
- **Projects:** Adelaide Hills (the rich one) and Coorong (the sparse one, built from Explore's data).
- **Measured** with headless Chromium at 1708x1024 (the size of the designer's feedback), 16 tab views. The raw numbers are in `.context/audit-data.json` (not committed). "Above the fold" means visible in the first 1024px.
- **Judged** against the principles already in `.claude/rules/ref-shell.md` and CONTRACTS 4.3: tier, don't dump; one focal point; never restate a fact in two treatments; anything findable within 3 clicks; when load and one extra click are in tension, take the click.
- **Task walkthroughs** were counted from the build, not timed with people.
- **Baseline:** the page as built today, before the three shell changes the designer approved on 30 Sept (column 2 hidden, breadcrumb project switcher, legal links as rail icons) and before the pill baseline fix. Re-run after them.

**Limits.** This is a heuristic audit plus counts. It is not evidence of how people behave. The control counts include every link, button and tab, so read them as relative, not absolute. The "coloured accents above the fold" measure failed (it read zero) and is not reported. The red "Not ingested" chip in the designer's screenshot is a prototype setting (part of the UX prototype, per the designer), so it is out of scope and is not counted as product load.

## Verdict

The page is well structured (one hero, four tabs where the older layout had nine, a jump list for the long tab) and it adapts sensibly by user type. Its load comes from **too many ways to move around, the same facts shown more than once, and a Project tab that lays the whole registration out in one long scroll.** Sparse projects add a further load: one amber "Details needed" card per missing group.

## What was measured

| View | Controls above fold | Screens of scroll | Bordered cards | Headings | Type styles (size/weight/colour) | "Not provided" |
| --- | --- | --- | --- | --- | --- | --- |
| Admin, Adelaide Hills, Project | 77 | 3.5 | 10 | 12 | 24 | 1 |
| Admin, Adelaide Hills, Survey records | 115 | 1.4 | 4 | 1 | 25 | 0 |
| Admin, Adelaide Hills, Species | 69 | 1.1 | 7 | 0 | 16 | 0 |
| Admin, Adelaide Hills, Artefacts | 72 | 0.9 | 0 | 0 | 15 | 0 |
| Registered, Adelaide Hills, Project | 75 | 3.5 | 10 | 12 | 24 | 1 |
| Registered, Adelaide Hills, Survey records | 122 | 1.2 | 3 | 1 | 25 | 0 |
| Public, Adelaide Hills, Project | 64 | 3.3 | 10 | 12 | 24 | 1 |
| Public, Adelaide Hills, Survey records | 76 | 1.2 | 3 | 1 | 25 | 0 |
| Registered, Coorong, Project | 74 | 2.1 | 6 | 10 | 20 | 7 |
| Registered, Coorong, Survey records | 66 | 1.2 | 1 | 1 | 16 | 0 |

- **Content starts at y=358** on every tab. The hero and the tab row take 35% of the first screen before any tab content.
- **Keyboard:** 22 to 23 tab stops (18 for a public user) before the first tab panel control. Rail 9, header 4, column 2 4, then the page's own top controls.
- **Facts repeated on the Project tab** (Adelaide Hills): the project name appears 2 times in main and again in the breadcrumb; status 2; "Published by" value 3. Tab counts and the "Survey at a glance" tiles show the same figures (for example artefacts: 7 and 7).
- **Record panel:** 4 sections, all collapsed by default (0 expanded).
- **Main-area text styles on the Project tab:** 10 size/weight pairs (10/600, 12/400, 12/500, 12/600, 14/400, 14/500, 14/600, 18/500, 18/600, 24/500).

## Findings, ranked

### High

1. **Five navigation systems at once, and 22 tab stops before content.** Rail (9 to 12 icons), column 2 (scope switch and actions), the tab row, the "On this page" list (about 14 entries at three levels) and the breadcrumb. Column 2's Actions (Export CSV, Create report) are the list's actions, so on a project they read as project-scoped or list-scoped, which is ambiguous.
   - **Lever:** the approved changes remove column 2 and its toggle and add a breadcrumb switcher (a 2-click project change instead of 3 to 4). Then re-measure. Also decide the scope of Export CSV and Create report when they move into the hero menu.
2. **Facts are restated in more than one treatment (CONTRACTS 4.3).** Status (hero pill and a "Status" row), project name (breadcrumb, hero title, Short title and Full title rows), "Published by" (3 times on the Project tab: the hero and the Published by card among them), counts (tab badges and the glance tiles), coordinates (see 7).
   - **Lever:** pick one home per fact. The edit affordances live on the rows, so the choice is which read-only copy to drop (the hero summary is the strongest candidate to keep).
3. **The hero is close to right; one fix and one addition.** One primary action (Upload dataset), a ⋮ menu and five facts. The status pill sits off the text baseline (already a known fix). The "Not ingested" chip in the screenshot is a prototype setting and is left out of this finding.
   - **Lever:** fix the baseline. Export CSV and Create report join the ⋮ menu (approved by the designer), so the menu grows to hold them; destructive items go below a divider. Keep Upload dataset as the one primary action.
4. **The Project tab is the whole registration in one scroll.** 3.5 screens, 12 headings, 10 bordered cards. The "On this page" list is what makes it navigable, which is a sign of length. Rarely-touched groups (permits, identifiers, restrictions, geographic extent detail) sit at the same weight as the identity facts (tier, don't dump).
   - **Lever:** keep Overview open; collapse or summarise the rest by default (accordion or a "Data and restrictions" summary row), or split by parallel concern. Trim "On this page" to the top-level groups, revealing sub-items only for the current group.
5. **Sparse projects get an amber "Details needed" card per missing group.** Coorong: 7 "Not provided" values and several amber cards, each as attention-grabbing as a real fault. Where nothing is wrong except nothing was entered yet, that is noise, and it will also be true of any real project registered with few fields.
   - **Lever:** one summary line ("4 sections need details", with a link to the first), quiet empty cards, and omit empty rows in view mode the way the record panel already does.

### Medium

6. **"Survey at a glance" duplicates the tab counts.** Four tiles say what the tab badges already say, then say "Pick a count to open those records", which the tabs do. It also pushes the actual overview below the first screen.
   - **Lever:** drop one of the two, or make the tiles the only place for counts and remove the badges.
7. **Geographic extent shows the same coordinates three times, with placeholder dashes.** A map, a 5-row coordinate table (Entered Value column holds "-" for Zone, Easting and Northing) and three "Centre" rows. CONTRACTS 2.3 says an empty value is omitted or "Not provided", never a stray dash.
   - **Lever:** map plus one compact coordinate line; the full table on request.
8. **Survey records stacks four things before the first record.** The flagged-concepts banner (admin), the toolbar (Tree/Table, search, Filter), the tree (each row carries a name, a type, a code and often a flag count) and the record panel, whose 4 sections open collapsed. Seeing one value is three clicks: tab, record, section.
   - **Lever:** open the panel's first section by default, or show a summary of the record. Consider dropping the code from rows where the type already identifies them.
9. **Species leads with five group tiles, mostly zeros.** Coorong reads 0 mammal, 3 bird, 0, 0, 0, then a search, a Filter, a Cards/Table toggle and the cards.
   - **Lever:** show only groups that have members, or fold the tiles into the filter.
10. **A tab that leads to nothing.** "Artefacts and attachments 0" is a full tab for an empty list on non-Adelaide projects.
    - **Lever:** keep the tab (findability) but give the empty state its one next step (attach a file), or hide the badge when it is zero.

### Low

11. **Type check (2.9, `REVIEW`).** 18px appears at both 500 and 600 in the Project tab. Check whether they play the same role (they should share one weight). 10px/600 is presumably the chip text; confirm it comes from the component.
12. **Edit pencils are hidden until hover or focus** (7 in the first screen). This lowers visual load but costs discoverability for people who do not hover. Fine for now; revisit in user testing.
13. **The page does not change much by user type.** A public user sees about 15% fewer controls (64 vs 75), because edit affordances are gone. That is right and worth keeping.

## Task walkthroughs (clicks as built)

| Task (user type) | Clicks | Note |
| --- | --- | --- |
| Read the project's status (any) | 0 | Shown twice (finding 2) |
| Find who runs it and their contacts (any) | 1 | "On this page", then a scroll of about 1.5 screens |
| Find what is restricted (any) | 1 | "On this page" jumps down 3 screens |
| See the species recorded (any) | 1 | Species tab |
| Read one record's values (any) | 3 | Survey records, the record, then a section |
| Upload a dataset (registered, admin) | 1 | Hero button |
| Switch to another project (any) | 3 to 4 | Back to projects, find it, open it; 2 with the approved breadcrumb switcher |
| Review flagged concepts (admin) | 2 | Survey records, then Review; the banner shows only on that tab |
| Export the project's data (any) | 1 | But the scope is unclear (finding 1) |

## What already works (keep)

- One gradient hero as the page's identity and focal point (§4.6).
- **Four tabs**, where the older Option 2 layout had nine.
- A jump list on the one long tab.
- Edit affordances that disappear for a public user without re-laying the page out.
- Honest empty states ("Not provided", the restricted badge and its generalisation note).

## Suggested order

1. Build the approved changes (column 2 off, breadcrumb switcher, legal icons, pill baseline), then re-run this audit.
2. Hero (finding 3), then de-duplication (2, 6, 7).
3. Tiering the Project tab (4), then the sparse-project summary (5).
4. Survey records and Species defaults (8, 9, 10).

Suggested targets to re-check after: tab stops before content at or below 14; no fact repeated more than once outside its edit row; one primary action in the hero; Project tab at or below 2.5 screens for a rich project.

## Could become automatic checks

- A fact shown twice on one screen (string match on the hero facts against the tab content).
- More than one filled primary action in a record hero.
- Tab stops before content above a threshold.

Each would go in `scripts/check-contracts.mjs` (CONTRACTS 0.8, 9.4), which is a governance change and needs the designer's say-so.

## Open questions for the designer

1. Tab counts or the "Survey at a glance" tiles: which to keep (finding 6)? Recommendation: keep the tab counts, drop the tiles.
2. Answered: the "Not ingested" chip is a prototype setting, out of scope.
3. Answered: Export CSV and Create report go in the ⋮ menu (assumed to act on this project).
4. Do you want the measurement script saved in the project so the audit can be re-run after the changes and compared?
