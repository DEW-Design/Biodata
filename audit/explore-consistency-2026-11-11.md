# Explore screens: consistency against the design system

11 Nov 2026. A read-only audit: nothing in the product was changed.

**Scope.** Explore (`/pages/observations`): the search card, the five ways of adding an area, the results (Species and Projects), the record summary card, the signed-out view; and the Observation page listed with it (`/pages/observation-detail`).

**How it was checked.** The files Explore renders were read, and it was walked live as a Registered User at 1440 x 1000 (a park chosen as the area, each add-area form opened, a species and a project picked), with every control measured in the browser. Zero console errors. Screenshots are in `explore-consistency-2026-11-11/`.

**What was left alone on purpose.** Explore's card was designed by the designer on 23 Oct 2026 and its own treatments are decisions, not drift: the result rows (`/patterns/map-list-card`), the uppercase group heading with "Export data" in the same type, the facts as label-left, value-right rows, the tabs without icons (contract 3.13's exemption), the draw bar on the map. None of those is listed.

**Not checked.** Map visualise (it needs a dataset run to open), drawing a real circle or polygon, keyboard, touch, narrow widths, the BioData Admin view.

## Status, 11 Nov 2026 (after "let's sort this out")

Fixed: 1 (the count is Species plus Projects, the designer's choice), 3, 4, 6, 7, 8, 10, 11. After screenshots are in `explore-consistency-2026-11-11/after/`.

Withdrawn: 5. Measured, the chip's remove button is already read with the chip's name ("Remove this tag BELAIR NATIONAL PARK"); the audit read the label alone.

Then decided and done the same day: 2 (the Observation page is removed: "meaningless, remove") and 9 (the heading's count is the tabs' pill). Details: `context/decisions/2026-11-11-03-explore-consistency-audit-and-its-fixes-the-results.md`.

## Severity

| Level | Meaning | Count |
| --- | --- | --- |
| High | A number or a screen that is wrong, or a second design for a job the product already has one for. | 2 |
| Medium | A different treatment from the rest of the product, visible to a person. | 4 |
| Low | Hand-built where a component exists, or code hygiene. | 5 |

## High

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 1 | **The "Search results" number does not match the card.** It reads 26 (55 in the designer's screenshot) over tabs that say Species 6 and Projects 1. It adds up projects, events, occurrences, observations and artefacts: the five kinds the card listed until 23 Oct 2026, when the tabs were cut to Species and Projects. Species, the first tab, is not in the sum at all. | `observations-search.tsx:656` (`totalCount`), shown at `:1211` | Two honest options. (a) Count what the card lists: Species plus Projects (7 here, 17 in the screenshot). (b) Drop the number: each tab already carries its own count, and a sum of species and projects adds two unlike things. Recommended: (b). | <img src="explore-consistency-2026-11-11/01-count-mismatch.png" width="360"> |
| 2 | **The Observation page is a second record-page design.** It has a column 2 with a records tree, no identity card, Title Case accordion headings ("Observation Details", "Temporal Details", "Location Information") with plus icons, and a 30px title. Every other record page follows the project page (contract 4.6), and "Show in project" on Explore opens the project's own record page, not this one. Nothing in the product links to it; the `/pages` index calls it the original observation screen. | `app/pages/observation-detail/page.tsx` (997 lines) | A decision first: retire it (the project record page does the job), or bring it in line with contract 4.6. Recommended: retire. | <img src="explore-consistency-2026-11-11/observation-detail.png" width="360"> |

## Medium

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 3 | **Dates on the summary card are raw.** A species shows "2026-08-12" and a project "2025-11-02", where the rest of the product writes "12 Aug 2026". | `record-peek-card.tsx` (`describe`: `r.date`, `e.startDate`) | Format them with the product's own short date (`formatShortDate`). | <img src="explore-consistency-2026-11-11/02-peek-card-date.png" width="260"> <img src="explore-consistency-2026-11-11/02b-peek-card-project.png" width="260"> |
| 4 | **Two field heights in one row.** In "Upload a shapefile" the file field is 40px beside a 36px Radius field. The card's other forms are all 36px (the small size). Today's field-height fix made this more visible (it was 37 beside 36). | `observations-search.tsx` (the shapefile form's `InputFile`) | Give the file field the small size, as the Parks and Radius fields have. | <img src="explore-consistency-2026-11-11/03-shapefile-heights.png" width="360"> |
| 5 | **An area chip's remove button has no name of its own.** A screen reader hears "Remove this tag" for every chip, not which area goes. | `area-layers.tsx` (the design system `Tag`'s default label) | Name it from the chip ("Remove Belair National Park"), in the `Tag` component so every tag gets it. | <img src="explore-consistency-2026-11-11/01-count-mismatch.png" width="360"> |
| 6 | **Cancel has two treatments.** In the coordinates and shapefile forms it is a bare text link with no icon (32px); on the draw bar it is the quiet button with an X (36px). | `observations-search.tsx:1094` and `:133` | One Cancel: the quiet button with the X, as the draw bar has. | <img src="explore-consistency-2026-11-11/coords-panel.png" width="300"> <img src="explore-consistency-2026-11-11/draw-mode.png" width="300"> |

## Low

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 7 | The summary card's close button is hand-built, where the design system has `CloseButton`. | `summary-card-parts.tsx:14` | Use `CloseButton`, keeping the solid chip over a photo as a class on it. | <img src="explore-consistency-2026-11-11/02-peek-card-date.png" width="260"> |
| 8 | The map's zoom buttons are raw `<button>`s, not a design system button. | `map-zoom-buttons.tsx:18` | Use `ButtonUtility` inside the same joined box. | <img src="explore-consistency-2026-11-11/results.png" width="360"> |
| 9 | The heading's count is a bare number and the tabs' counts are ringed pills: two count treatments a few pixels apart. Goes away if finding 1 takes option (b). | `observations-search.tsx:1211` | See finding 1. | <img src="explore-consistency-2026-11-11/01-count-mismatch.png" width="360"> |
| 10 | Stacking values are typed by hand (`z-[1000]`, `z-[1001]`, `z-[9999]`) instead of coming from `lib/layers.ts`, which names only the modal and scrollbar layers. | `observations-search.tsx:1173`, `dataset-error-map.tsx:376`, `sa-map.tsx:169`, `expandable-map.tsx:60, 81` | Add the map layers to `lib/layers.ts` and use them. | none (code only) |
| 11 | The PDF export is set in Arial with hex colours typed in, not the product's type and tokens. | `export-utils.ts:67-72` | Use Barlow and the token values in the print template. | none (code only) |

## What is consistent

The header, the page banner, the tabs, the area chips, the buttons, and every field (Input, MultiSelect, InputNumber, InputFile) are the real components. The card keeps its width (440px) and its 12px radius in every state, and the summary card its 320px.

## Suggested order

1. Finding 1: needs your choice of (a) or (b).
2. Findings 3, 4, 5, 6: small, contained, no decision needed.
3. Finding 2: a decision (retire or align).
4. Findings 7, 8, 10, 11: tidy-ups.
