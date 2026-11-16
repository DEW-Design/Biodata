# Create a project flow: consistency against the design system

11 Nov 2026. A read-only audit: nothing in the product was changed.

**Scope.** Add Project (`/pages/project-registration`), all 11 sections, the species side panel, both map expands, the success screen, the signed-out state, and option 2's Datasets step (`/pages/project-registration/option-2`).

**How it was checked.** Every file the flow renders was read. The flow was walked live as a Registered User at 1440 x 1000 with the sample content on; each control's height, radius and type were measured in the browser. Zero console errors. Screenshots are in `create-project-consistency-2026-11-11/`.

**Not checked.** Every field's error state, keyboard, touch, narrow widths, and the version 1 wizard code still in the folder (this flow does not render it).

## Status, 11 Nov 2026 (after "let's fix all")

Fixed: 1, 2, 3, 4, 5, 6, 7, 13, 15, 16, 17, 18, 19, 22, and most of 11, 12, 20 and 21.

Reversed by the designer the same day (put back as they were): 9 and 14, and the location card, the location picker and the DLA Add a location popup in 11, 12 and 20. After screenshots are in `create-project-consistency-2026-11-11/after/`.

Left for a decision: 10 (should the dropzone become a component), 16 (one field height, from Figma), the card radius in 13 (8px against the contract's 12px, a product-wide change), the justification placeholder in 21 (no sourced example). Details: `context/decisions/2026-11-11-02-create-a-project-flow-brought-in-line-with.md`.

## Severity

| Level | Meaning | Count |
| --- | --- | --- |
| High | Breaks a contract clause, or the same action looks different inside this one flow. A stakeholder sees it. | 5 |
| Medium | Hand-built where a design system component or shared pattern exists. | 10 |
| Low | Code hygiene, or a gap in the design system itself. | 6 |

## High

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 1 | "All concepts / Selected concepts" are hand-built choice tiles from the retired wizard: a raw `<button>`, no 40px hit area, a hard-coded brand border, 12px radius. Every other either/or question in the flow is a radio group, and contract 4.1 item 7 prohibits bespoke tiles. | `species-restriction.tsx:95`, `typeform-card.tsx:142` | Replace with `RadioGroup` and two `RadioButton`s with hints, as "Restrictions on distribution" is. Then `ChoiceTile` has no caller in the product. | <img src="create-project-consistency-2026-11-11/01-choice-tiles.png" width="360"> |
| 15 | Five sections lay fields out in `FormRow` (label and help left, fields right). The five restriction sections (Embargo, Species, Cultural, Locations, All records) are a flat stack with labels above. Contract 4.1 item 3. | `form-sections.tsx:793` | Wrap each restriction kind's fields in `FormRow`s, so every section of the form reads the same. Needs your call on the row titles (new labels, 4.7 item 3). | <img src="create-project-consistency-2026-11-11/15a-row-layout-form-row.png" width="360"><br><img src="create-project-consistency-2026-11-11/15b-row-layout-flat.png" width="360"> |
| 14 | The same map picker opens larger two different ways in one flow: Geographic extent uses the shared "Expand map" dialog; Location restrictions uses a bespoke "Full screen" overlay built straight on react-aria's modal, with hard-coded `z-[9999]` and `z-[1001]` instead of `lib/layers.ts`. | `geo-extent-picker.tsx:134-195`, `location-restriction.tsx:78` | Pass `expand="modal"` from the location card (one line), then delete `MapFullscreenOverlay` once no caller uses it. | <img src="create-project-consistency-2026-11-11/14a-map-expand-dialog.png" width="360"><br><img src="create-project-consistency-2026-11-11/14b-map-full-screen-overlay.png" width="360"> |
| 11 | Remove has five treatments: a secondary icon at 36px (contact, location), a secondary icon at 40px (permit), a tertiary icon (concept, species; methodology only on hover), a tertiary button with a label ("Remove", drawn shape), and a link with a label ("Remove location"). | `form-sections.tsx:367, 530, 611`, `location-restriction.tsx:49, 66`, `concept-rows.tsx`, `species-restriction.tsx:182`, `geo-extent-picker.tsx:61` | Choose one treatment for removing a repeated item (recommended: the tertiary icon, small, always visible) and one for clearing a value (the labelled tertiary), and apply them. | <img src="create-project-consistency-2026-11-11/07a-icon-only-remove.png" width="360"><br><img src="create-project-consistency-2026-11-11/11c-remove-on-hover.png" width="360"><br><img src="create-project-consistency-2026-11-11/11d-remove-labelled.png" width="360"><br><img src="create-project-consistency-2026-11-11/11e-remove-location-link.png" width="360"> |
| 12 | Add has four treatments: a 20px link ("Add another contact / permit / location"), a secondary medium button ("Add location"), a secondary small button ("Add concept", "Restrict"), and a search select (methodology). | `form-sections.tsx:328, 533`, `location-restriction.tsx:84, 117`, `concept-rows.tsx`, `species-restriction.tsx:185` | Choose one treatment for adding a repeated item (recommended: the link, as contacts use) and keep the secondary button for opening a tool ("Add location"). The methodology picker stays: it is a search, not a button. | <img src="create-project-consistency-2026-11-11/12a-add-link.png" width="240"><br><img src="create-project-consistency-2026-11-11/12b-add-secondary-md.png" width="240"><br><img src="create-project-consistency-2026-11-11/12c-add-secondary-sm.png" width="240"> |

## Medium

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 2 | The species list is a hand-built `<ul>` of rows with a plain-text count, not the `Table` and `CountBadge` lists use everywhere else (contract 4.2). | `species-restriction.tsx:143-193` | Rebuild as the basic `Table` (species, family and group, status, action), with the count as a `CountBadge`. | <img src="create-project-consistency-2026-11-11/02-species-list.png" width="360"> |
| 3 | The review cards are hand-built summary rows with uppercase 12px labels and an `h3` restyled with `!` overrides. The file facts card in option 2 uses `RecordRow`, so the flow has two label and value treatments. | `review-section.tsx:17-38` | Build the review from `RecordRow` in a bordered card, the Edit action in the row. | <img src="create-project-consistency-2026-11-11/03-review-cards.png" width="360"> |
| 4 | The success screen is hand-built: 20px and 16px type where the rest of the flow is 14px, and a full-width button. | `success-screen.tsx` | Rebuild on the shared empty-state pattern (`FeaturedIcon`, heading, one line, action) at the flow's type sizes; the next steps as a plain list. | <img src="create-project-consistency-2026-11-11/04-success-screen.png" width="360"> |
| 6 | Help and error text drawn as raw paragraphs: the row error (`FormRow`), the "Maximum embargo period" note at 12px where every other hint is 14px, the embargo type descriptions as a raw list, and the Yes/No "Value" label as a raw span. | `form-row.tsx:16`, `step-3-privacy-restrictions.tsx:180, 204`, `concept-rows.tsx` | Use `HintText` (and `Label`) so every hint and error is one size, colour and position. | <img src="create-project-consistency-2026-11-11/06-hint-sizes.png" width="360"> |
| 7 | Icon-only buttons (Remove, Edit on the review) are `Button` with only an `aria-label`: no tooltip, so a sighted person gets an unnamed icon. The design system has `ButtonUtility` (icon and tooltip) for this. | at least 5 places in the flow, at least 14 across `app/pages` | Swap to `ButtonUtility` with the action as its tooltip. | <img src="create-project-consistency-2026-11-11/07a-icon-only-remove.png" width="360"> |
| 9 | Draw polygon and Draw circle show "pressed" by swapping from secondary to primary and renaming to "Drawing...", with no `aria-pressed`. | `geo-extent-picker.tsx:94-123` | Keep the label, mark the state with `aria-pressed` and one pressed treatment. The design system has no toggle button: a small gap to decide. | <img src="create-project-consistency-2026-11-11/09-draw-toggle-pressed.png" width="360"> |
| 13 | Cards differ: contact and location cards are 8px radius, 24px padding, a 14/500 title; concept cards are 8px, 16px padding, a 14/600 title; the upload queue and dropzone are 12px. Contract 2.13 says a card is 12px. | `bento-card.tsx`, `concept-rows.tsx`, `upload-dropzone.tsx` | One card for a repeated item: one radius, one padding, one title weight. | <img src="create-project-consistency-2026-11-11/13a-card-contact.png" width="300"><br><img src="create-project-consistency-2026-11-11/13b-card-concept.png" width="300"> |
| 17 | In the species side panel, Cancel and Save sit in the scrolling body under a divider. Every form page has a fixed footer. | `species-restriction.tsx:108` | Give `SidePanel` a footer slot (an opt-in prop) and put the actions there. | <img src="create-project-consistency-2026-11-11/17-panel-actions.png" width="360"> |
| 20 | Title Case beside sentence case: "Select type of Embargo", "Embargo End Date", "Draw on the Map", "Choose from a List", "Upload Shapefile", "Project Created!", "What can you do Next?", "Go to Project". | several | Sentence case throughout. | <img src="create-project-consistency-2026-11-11/20a-tabs-title-case.png" width="360"> |
| 21 | Placeholders: "Enter contact number" restates its label and "Enter a justification..." is not an example (contract 2.18); "John", "Doe" and `john.doe@sa.gov.au` are not the approved placeholder people (contract 0.3). | `form-sections.tsx:371-374`, `restriction-fields.tsx` | Replace with an example from the approved people (Olivia Wyatt, example.com); a justification example needs a source, so that one is a question for you. | <img src="create-project-consistency-2026-11-11/21-placeholders.png" width="360"> |

## Low

| # | What is wrong | Where | What needs to be fixed | Screenshot |
| --- | --- | --- | --- | --- |
| 5 | The signed-out state is a hand-built block, not the shared `RestrictedState`. | `registration-flow.tsx:63` | Use `RestrictedState` with the Log in and Sign up actions. | <img src="create-project-consistency-2026-11-11/05-signed-out-state.png" width="360"> |
| 10 | Option 2's dropzone and file queue are composed by hand, and the file icon is a hand-drawn tile; the shapefile upload in the same flow uses `InputFile`. The design system has no dropzone, so this is partly a gap. | `upload-dropzone.tsx` | Decide whether a dropzone becomes a design system component (a 1.4 override). Until then, use `FeaturedIcon` for the file tile. | <img src="create-project-consistency-2026-11-11/10-upload-dropzone-and-queue.png" width="360"> |
| 16 | Field heights differ inside the components: Input and Select 37px, MultiSelect 40px, the date field and the toolbar search 36px. In the Permits row a 37px field sits beside a 40px button. | the components themselves | A component-level decision (one field height), fixed once in `components/**`, not in this flow. | <img src="create-project-consistency-2026-11-11/16-field-heights-permits.png" width="360"> |
| 18 | Raw CSS variables in class names instead of the token utilities: `border-[var(--color-brand-500)]`, `border-[var(--ui-border-secondary)]`. | `typeform-card.tsx:150`, `review-section.tsx:36` | Use `border-brand` and `border-secondary`. Goes away with 1 and 3. | none (code only) |
| 19 | `max-w-[720px]` is repeated in four places outside `FormRow`, which already owns that width. | `form-sections.tsx:795`, `review-section.tsx`, `duplicate-project.tsx` | Goes away with 15; otherwise one shared constant. | none (code only) |
| 22 | The sidebar reads "10 of 10 sections complete" on the success screen while "Review and create" (item 11) is not ticked. | `registration-progress.tsx` | Count the review, or tick it once the project is created. | <img src="create-project-consistency-2026-11-11/04-success-screen.png" width="360"> |

## What is consistent

The header, rail, form header and footer, the section progress list, the discard modal, the alerts, and every plain field (Input, TextArea, Select, MultiSelect, RadioGroup, Checkbox, Accordion, the date field) are the real components.

## Suggested order

1. Items 1, 14, 18: small, contained, no decision needed.
2. Items 11 and 12: need your choice of the one Remove and the one Add treatment.
3. Item 15: needs row titles from you.
4. Items 2, 3, 4, 6, 7, 17: rebuilds on existing components.
5. Items 10 and 16: design system decisions, separate from this flow.
