# Type hierarchy audit, 29 Sept 2026

Scope: every shared component and page pattern that sets text, checked against CONTRACTS.md 2.9 in its order:
(1) the design system, (2) patterns already on the web app, (3) `/emil-typography` and `/emil-design-foundations`.
Nothing was changed. This is the evidence and the decisions needed.

## How it was measured

- **Live:** 19 screens (15 product, 4 docs) in Chromium at 1600x1000, `getComputedStyle` on every visible text node.
  Personas: registered, BioData Admin and public on Home, admin on DLA, DSA, nominations and User Management,
  registered on the rest. Zero console errors.
- **Source:** every `text-*`, `font-*`, `tracking-*`, `uppercase`, `tabular-nums`, `text-balance` class in
  `components/**` and `app/pages/**`, with file and line.
- **Excluded from the count:** the dev-only feedback toolbar (system-ui) and the Leaflet map controls (Helvetica Neue).
  Neither is ours.
- Result: one family in product UI (Barlow), 59 distinct size, weight, line-height, tracking, case and colour
  combinations across the 15 product screens.

## What already holds (stay silent on these)

- One product family (Barlow); Geist stays in doc chrome. Weights actually used: 400, 500, 600.
- Changing numbers use tabular figures (percentages, counts, KPI values, estimates).
- Badges, tags and eyebrows are sentence case in the source and uppercased by CSS, with loosened tracking.
- Copy that can wrap carries `text-balance`.
- Antialiasing is set once at the root (`globals.css:534`).
- Body text on the page reads 14px/20px; the smallest product text is 12px, apart from the 10px items below.

## The role table (what is in force today, measured)

| Role | Size / weight / line height | Colour | Source |
|---|---|---|---|
| Hero and record title (H1) | 24 / 500 / 32 | white on gradient | `RecordHero`, Home banner |
| Top-bar and not-found title | 18 / 500 / 28 | primary | ~15 shells |
| List page title | 18 / 600 / 28 | primary | `SectionHeader.Heading` |
| Home section heading | 18 / 500 / 28 | primary | `home-dashboard.tsx` |
| Card heading | 14 / 500 or 14 / 600 | primary | see conflict 2 |
| Field label | 14 / 500 / 20 | secondary | `Label` |
| Hint | 14 / 400 / 20 (12 at size sm) | tertiary | `HintText` |
| Input text | 14 / 400 / 20 | primary | `Input` |
| Table header | 12 / 600 / 16 | quaternary (#8f8b87) | `Table.Head` |
| Table cell, identity column | 14 / 500 / 20 | primary | list pages |
| Table cell, other columns | 14 / 400 / 20 | tertiary or secondary | see conflict 9 |
| Badge | 12 / 600 / 12, uppercase, 0.3px | semantic | `Badge` |
| Count badge | 12 / 600, tabular | semantic | `CountBadge` |
| Tab label | 14 / 600, 20 or 21 line height | selected brand, inactive quaternary | `Tab` |
| Button (all five sizes) | 14 / 600 / 20 | by colour | `Button` |
| Eyebrow | 12 / 600 / 16, uppercase, 0.3px | quaternary, brand or white/70 | ~40 sites |
| Caption, meta | 12 / 400 / 16 | tertiary or quaternary | see conflict 13 |
| KPI value | 36 / 400, 36 / 500, 24 / 500, 24 / 400, 20 / 500, 18 / 500 | primary | see conflict 17 |
| Modal title | 16 / 600 | primary | `Modal` |
| Alert, toast title | 14 / 600 | secondary | `Alert`, `Toast` |
| Tooltip | 12 / 600 title, 12 / 500 body | white | `Tooltip` |

## Conflicts (numbered; sources are file:line from the source pass)

### A. Broken at the system level (design system disagrees with itself)

1. **`text-md` does not exist.** `--text-md` is not defined in the shipped stylesheet, so the class emits no CSS and
   the element inherits its parent: 14px with a 21px line height. 63 live uses (48 in `components/base`).
   Effects, all measured: Input `md` and `lg` render identically (14px); Button `lg` and `xl` render 14px, the same as
   `md`; `Tab` size `md` is 14/21 while size `sm` is 14/20; Checkbox, Radio and Toggle `md` labels are 14px while the
   Progress steps `md` title (already fixed to `text-base`) is 16px. The docs page lists `text-md` as a 16/24 token.
   Only `styles/theme.css` defines it, and that file is not imported by anything.
2. **Docs versus code.**
   - Text xs: docs 12/18, code 12/16. Text xl: docs 20/30, code 20/28.
   - Display sizes: docs fixed 24 to 72 with 32 to 90 line heights and negative tracking; code has fluid `clamp()`
     sizes and no line-height or tracking, so display type inherits the body's 1.5.
   - Weights: docs say Display is 600 and captions are Medium 500; code sets the hero H1 at 500 and captions
     at Regular 400.
3. **Contrast of `text-quaternary` (#8f8b87) is 3.4:1 on white and 3.2:1 on gray-50.** It is the colour of inactive
   tab labels (14px semibold), table headers (12px semibold), eyebrows and column-2 section labels (12px), footer
   links (12px regular), and the Progress steps' incomplete numbers. All are under the 4.5:1 floor for text at those
   sizes. Tertiary (#706b68, 5.3:1) and secondary (#585451, 7.5:1) pass.
4. **Italic is synthesized.** `app/layout.tsx` loads Barlow at weights 400, 500, 600 and 700 in normal style only,
   and there is no `font-synthesis: none`. Every scientific name (italic in ~10 places) is a browser-slanted fake.
   Barlow has real italics.
5. **Sub-12px text in product UI.** 10px in the rail's count badge (`primary-rail.tsx:47`), the org pill in the
   breadcrumb (`breadcrumb.tsx:61`, `project-detail-view.tsx:501`, `observation-detail/page.tsx:374`), the "Primary"
   chip (`registration-summary.tsx:92,175`) and the avatar count (`avatar-count.tsx:12`, also bold).

### B. Same role, different treatment (the 2.9 violation the designer named)

Numbering follows the source pass; the ones marked `measured` were also confirmed live.

2. **Card and section headings** (measured on Home, lists, records): one role at eight size and weight pairs.
   14/500 (about 15 sites: `data-overview.tsx:247`, `dsa-detail.tsx:90`, `about-content.tsx:178`) against 14/600
   (`dla-detail.tsx:359`, `accordion.tsx:106`, the form sub-headings); 16/500 (`DetailSection`,
   `registration-summary.tsx:257,271,325`) against 16/600 (`guest-home.tsx:147`, `side-panel.tsx:83`, `Modal`);
   18/500 (all six Home section headings) against 18/600 (`SectionHeader.Heading`, `TableCard.Header`);
   20/500 (`record-panel.tsx:36`, `record-detail.tsx:748`) against 20/600 (`about-content.tsx:664`). The same
   "Privacy and Restrictions" heading is 14px medium on one page and 16px medium on another. The docs say headings
   are Semibold. The Sept 28 ingestion fix already moved a heading from medium to semibold on that ground.
1. **Page title (H1)**: 24/500 on heroes (7 records, `measured`), 18/500 in shells and not-found pages, 18/600 in
   `SectionHeader`, `sm:text-3xl` on two project layouts only. Legacy `projects` and `projectsv2` use 28 and 30px.
3. **Modal versus alert versus toast title:** 16/600 primary against 14/600 secondary.
4. **Field label:** `Label` is 14/500 secondary; `dla-form` uses primary; read-only labels are 14/400 secondary or
   tertiary, 14/500 tertiary (`dsa-detail`, `dla-detail`), or 12/600 uppercase (MetaField).
5. **Read-only value weight:** regular in `RecordRow` and `DetailRow`, medium in `FieldRow`, `record-detail`,
   `um-detail`, and both in `registration-summary.tsx:239,247`.
6. **Label column width:** 176px (`sm:w-44`) in `RecordRow`, `FieldRow`, `record-detail`; 224px (`w-56`) in
   `DetailRow`; 180px in the legacy pages.
7. **MetaField exists as 12 hand-copied variants** with two gap values and two colour schemes.
8. **Eyebrow:** brand or quaternary or white/70 or tertiary; medium instead of semibold at `record-detail.tsx:316,327`;
   no tracking at three typeform steps; `tracking-widest` at three doc-chrome files; `SelectSection` headers are
   sentence-case xs semibold quaternary where every other small heading label is uppercase.
9. **Table cells** (measured, dominant layer 14/400 tertiary at 280 uses against 14/400 secondary at 119): one table
   mixes secondary and tertiary in plain columns. `dla-list.tsx:181` (secondary) beside `:187,194,202` (tertiary);
   `dsa-list.tsx:187,202` against `:191,220`; `um-lists.tsx:211,214` against `:217,225`; `species-results.tsx:421`
   against `:423-433`. Sub-lines: xs quaternary in DLA and nominations, xs tertiary in Projects, same-line sm in User
   Management.
11. **Count badges: six treatments.** `CountBadge` (20px, 12/600), the rail badge (16px, 10/600), `avatar-count`
    (10/700), the `TableCard.Header` badge (uppercase `Badge`), the tab badge (uppercase `Badge`), `dla-detail.tsx:78`
    (a copy in tertiary).
12. **Chips and badges:** `Badge` is uppercase tracked semibold; `BadgeGroup` and 5 local chips are sentence case
    medium. `BadgeWithDot` `lg` is 14px where `Badge` `lg` is 16px. Tag counts change size between `md` and `lg`.
13. **Caption and meta** (measured: 12/400 in 3 colours, 61 uses gray-500, 32 uses gray-600): tertiary, quaternary,
    secondary and italic variants for the same role.
15. **Input text:** regular in Input, InputNumber, InputDate, TextArea; medium in Select, ComboBox, MultiSelect,
    NativeSelect. NativeSelect drops to regular only inside an `InputGroup`. `components/custom/textarea` is 16px
    where `base/textarea` is 14px.
17. **KPI value** (measured 36/400, 36/500, 24/500, 18/500): six shapes across `MetricCard md`, `MetricCard sm`,
    `KpiStat`, the admin queue, `threat-summary-card`, `MetricTile`. KPI labels are uppercase quaternary, xs medium
    tertiary, dead `text-md`, or xs tertiary.
18. **Empty states:** title is 14/500, 18/600 or 18/500 (as an H1); body sometimes has `text-balance`, sometimes not.
21. **Nav and tree groups:** depth-0 is uppercase quaternary eyebrow, deeper rows 14/500 primary, tree rows 14/600
    tertiary.

### C. Smaller

- **Wordmark:** 17px semibold, negative tracking (`text-[17px]`, `app-header.tsx:61`, `biodata-home/page.tsx:518`,
  docs navigation) is off the scale; `auth-shell.tsx:22` sets the same wordmark at `text-display-sm` bold.
- **`text-display-xs` used on paragraphs** in onboarding (`setup-profile/page.tsx:126,190,288`) and one typeform H2.
- **Eyebrow tracking** is 0.025em (`tracking-wide`, 0.3px at 12px). Emil's floor for small uppercase is looser.
- **Straight apostrophes and quotes** throughout the copy. Emil: curly in prose, straight in code.
- **`text-pretty` versus `text-balance`:** `guest-home.tsx:86,116,149` uses pretty; the rest of the product balances.
  Emil's rule (balance headings, pretty for descriptions) fits the guest file, not the convention.
- **Not applicable here:** the 16px mobile input floor (the product is desktop only) and `font-synthesis` is covered
  by conflict 4.

## Decisions for the designer (with my recommendation)

| # | Decision | Recommendation | Blast radius | Status |
|---|---|---|---|---|
| D1 | Make `text-md` real (16/24) or retire it | Check the Input, Button and Tab frames in Figma first. If they draw 16px, define `--text-md`. If they draw 14px, replace every `text-md` with `text-sm`. Either way the line-height splits (20 vs 21) go away. | 63 sites; Input, Button lg/xl, Tab md, radio groups, Checkbox, Toggle | **Answered, not fixed - see below** |
| D2 | Heading weight | One rule from the docs: headings semibold, labels and nav medium. Then one size per role: hero 24, section 18, card 14. | ~35 sites move medium to semibold; hero H1 24/500 to 24/600 is the visible one | **Done** (29 Sept 2026) |
| D3 | Docs page | Rewrite the scale table to what ships (xs 12/16, xl 20/28, display tokens with line height and tracking, caption weight) after D1 | one page | Waits on D1 |
| D4 | Contrast of `text-quaternary` | Darken the token to reach 4.5:1 on white (about #767270) | every tab, table header, eyebrow, footer link, placeholder; Figma decides the value | **Deferred** - see below |
| D5 | Italic | Load Barlow italic and add `font-synthesis: none` | `app/layout.tsx`, `globals.css` | **Done** (29 Sept 2026) |
| D6 | 10px text | 12px minimum; or record the rail badge and org pill as exceptions | 5 sites | Open |
| D7 | Wordmark | Treat as a logo lockup exception, documented; do not add `text-[17px]` elsewhere | 2 to 3 sites | Open |
| D8 | KPI value | One shape: value 36/500 tabular, label eyebrow; sm variant 24/500 | 6 components | Open |
| D9 | Read-only label and value | One `RecordField` (label 14/400 secondary, value 14/500 primary, 176px label column) replacing the 12 MetaField copies and the DetailRow and RecordRow forks | ~20 files, page-shared | Open |
| D10 | Table cells | Identity column 14/500 primary; every other column 14/400 tertiary; sub-line 12/400 tertiary. Secondary is not used in tables. | 5 list files | Open |
| D11 | Count badge | `CountBadge` everywhere a number sits by a label; the rail badge stays an exception at 12px | 4 sites | Open |
| D12 | Curly quotes | Adopt in UI copy, with a check for straight apostrophes in JSX text | large copy sweep; recommend doing it as a rule for new copy only | Open |

### D1, answered: did `text-md` exist when the type scale was brought in?

Checked directly against git history rather than assumed. This repo's history begins at two initial-commit points
(`acfded8`, 24 Aug 2026, and `98ded9d`, 31 Aug 2026, "Build DEW design system site: primitives, components, live
config UI"). `app/globals.css` and its Display-size scale, `styles/theme.css` (the orphaned Untitled UI Tailwind
preset that is never imported), the typography docs page, and `components/base/input/input.tsx`'s own `text-md`
usage all first appear together in that one commit - there is no earlier commit where `app/globals.css` defined
`--text-md` and a later one where it was removed. **`text-md` never existed in the design system's own live token
layer at any point in this repo's history.** It exists only in `styles/theme.css`, which was never wired into
`app/layout.tsx` and has never rendered anything. The CLI-ingested component code (`input.tsx`, `button.tsx`, the
radio groups, ...) was written assuming that file's full Untitled UI preset would be live; it never was. So this
isn't a token that shipped and later drifted out of use - the type scale was authored without it from day one, and
every component that reaches for `text-md` has always silently rendered its inherited size (usually 14px).
This sharpens the D1 recommendation: there is no "how it used to render" to preserve. The Figma check is still the
right next step, but going in it's now clear that whatever `text-md` currently displays as (14px, inherited) was
never a deliberate design decision to protect - it's a gap that happened to render plausibly.

### D5, done: Barlow italic + `font-synthesis: none`

`app/layout.tsx`'s `Barlow` loader now requests `style: ["normal", "italic"]` (in addition to the existing 400,
500, 600, 700 weights), and `app/globals.css`'s `html` rule gained `font-synthesis: none` alongside the existing
antialiasing declarations. Verified live: a scientific name (`Lasiorhinus latifrons`, a species table cell) now
computes `font-style: italic` with `font-family: Barlow, "Barlow Fallback", ...` - a real loaded italic, not a
browser-faked slant, confirmed by `font-synthesis` also computing `none` on the same page. `tsc --noEmit` and
`npm run check:contracts` clean; zero console errors on a fresh page load.

### D2, done: heading weight

Applied the docs' own rule (headings semibold, labels and nav medium) to every medium-weight `<h1>`-`<h3>` found in
`app/pages/**` - about 45 individual sites, not just the ~35 first estimated, once every literal duplicate was
swept: the 9 hero/record H1s (`RecordHero`, the generated project page, guest Home, both "Hi, X" greetings, the
Adelaide Hills legacy page, project-detail options 2/3, `observation-detail`), the shared shell H1 pattern
(`{node.label}` and the section-label variant across all 9 shells: DSA, DLA, User Management, nominations, dataset
upload, dashboard, project-list, Explore, observation-detail) plus every "not found" state that reuses it, Home's 6
section headings, the two shared components whose fix cascades to every call site (`DetailSection`, `ContactCard`
in `project-detail-view.tsx`), and the remaining ~18 standalone card headings (`dsa-detail.tsx`, `data-overview.tsx`,
`threat-summary-card.tsx`, `flora-content.tsx`, `fauna-content.tsx`, `about-content.tsx`, `registration-summary.tsx`,
`option-2/page.tsx`, `record-panel.tsx`/`record-detail.tsx`, `artefact-table.tsx`'s own `!`-overridden card title).
**Explicitly excluded, on purpose:** KPI/stat *values* (`text-2xl font-medium tabular-nums` in `KpiStat`,
`text-xl font-medium ... tabular-nums` in `MetricCard sm`) - those are numbers, not headings, and are D8's own,
separate decision. The two already-flagged stale/superseded drafts (`app/pages/projects`, `app/pages/projectsv2`)
were left untouched, per this file's long-standing "confirmed stale, safe to leave as-is, not brought in line"
precedent. Verified `tsc --noEmit`, `eslint --max-warnings=0` on all 34 touched files, and `npm run check:contracts`
clean; a live Playwright pass confirmed every spot-checked heading (Home's "Hi, Olivia" and its 4 sections, the
Projects list heading, a generated project page's title, a DLA record's title, User Management's "Users") now
computes `font-weight: 600`, zero console errors.

### D4, deferred: is `text-quaternary` part of the design system?

Raised, not answered - the designer asked to note it and come back later rather than decide now. What's on record
for when it's picked back up: `--ui-text-quaternary` is a real, defined token in `app/globals.css` (part of the
`--ui-*` semantic layer this whole system is built on, same tier as `text-primary`/`secondary`/`tertiary`), used
deliberately and consistently for the lowest-emphasis text role - inactive tab labels, table headers, eyebrows,
placeholder-adjacent hint text, footer links. It resolves to gray-500 (`#8f8b87`), which computes to 3.4:1 contrast
on white - under the 4.5:1 floor this skill's own accessibility checklist and CONTRACTS' §1.9 "every state is real"
spirit call for at 12-14px. The question isn't whether the token is real (it is, and it's used correctly per its
own intended role), it's whether that specific colour value is still right now that its contrast has been measured.
No change made.

Recommended order once D1 and D4 are answered: D1 (unblocks D3), D4 (system level, small), D2 done, D10 next for
visible consistency, then D8, D9 and D11.

## Not covered

- Mobile widths; the product is designed for desktop.
- Dark surfaces other than the gradient card and the contained alerts.
- Explore option 1 (a teammate's page) and the Untitled UI docs pages beyond the typography and table pages.
- Hover, focus and disabled text states.
