# 2026-10-09 - Add Project option 2 version 2 and a Version tool

- **Oct 9 2026: Add Project option 2 version 2 and a Version tool.** The designer's page feedback round on
  `/pages/project-registration/option-2` was built as version 2 of that option, at `/pages/project-registration/option-2/version-2`,
  with version 1 left as it was. The flow moved from `option-2/page.tsx` to `option-2/registration-flow.tsx` and takes a `version`;
  `sections.ts`, `form-sections.tsx`, `review-section.tsx` and `registration-progress.tsx` take it too and default to 1, so the
  project page's edit form, which reuses them, is unchanged.
  - **Version tool.** A new `VersionSwitcher` (`app/pages/_shared/version-switcher.tsx`) registers a "Version" tool on the Prototype
    tools bar, after Layout ("Version 2 of 2"), opening each version's route with the role kept. `tools.ts` orders it after "layout".
  - **Project name:** a hard limit of 60 characters (`PROJECT_NAME_MAX`), a live count in the hint, a shorter placeholder, and the
    description says it is a short title shown on cards, lists and search; a longer name goes in Full title. 60 was chosen to fit a
    project card, the breadcrumb and a table column.
  - **Project contacts:** the Primary contact and Project managers blocks became one list of cards (borrowed from `ManagerCard`): first
    and last name, email, phone, Role in project (`ROLE_OF_WORK_OPTIONS`), and two ticks, Primary contact (exactly one; ticking it moves
    it) and Project manager (any). An organisation needs at least one project manager, as version 1 did. "Your role" is gone from Method
    and details: the role belongs to each contact (CONTRACTS 4.7). On create the list is written out as `dataOwnerContacts` (primary first)
    and `projectManagers` (`toSavedForm`), so the project page reads it unchanged.
  - **Geographic extent:** the drawing map uses the shared `ExpandableMap` dialog (the project page's Expand), with the draw tools in its
    title bar, through an opt-in `expand="modal"` on `GeoExtentPicker`. Every other caller keeps its full screen view.
  - **Method and details:** focus areas moved in from Geographic extent; Survey type removed; the Unknown method removed
    (`COLLECTION_METHOD_OPTIONS_V2`); Methodology shows only for Systematic, as ticks over the designer's ten methodologies
    (`METHODOLOGY_OPTIONS_V2`), each ticked one opening its own optional note on variation, limitation or bias, and Others also asking
    its name. "Limitations and biases" left the optional details accordion. On create, the names become `methodDetails` and the notes
    `limitationsAndBiases`.
  - **Open:** whether the methodology list should live in the Survey method controlled vocabulary (BIODATA-102), which version 1 reads;
    whether Role in project is required for every contact (it is, here); whether contacts need an organisation field (version 1's
    managers had one); whether the map's Expand dialog should replace the full screen view in option 1 and version 1 as well; the
    character count sits right after the hint message, since `HintText` is an inline span.
  - Verified: `npx tsc --noEmit` (only the stale `.next/types` entry for the removed project-detail option 2), eslint on touched files,
    `npm run check:contracts` OK, and a Playwright pass at 1792x1080 as a Registered User over Project basics (80 typed, 60 kept), Data
    owner (Continue with nothing filled shows the alert and inline errors), Geographic extent (Expand opens the dialog with the draw
    tools), Method and details (Systematic shows the methodologies, ticking opens the note), and version 1, with no console errors. Not
    committed.
- **Oct 9 2026, continued: the designer's answers.** (1) The methodologies go in a controlled vocabulary: a new Reference vocabulary,
  **Survey methodology (BIODATA-117)**, category Survey methods, numbered, published 9 Oct 2026, with the ten entries; version 2 reads
  its active entries in order (`useMethodologyOptions`, `methodology-fields.tsx`) and keeps a chosen entry's name, as version 1 keeps the
  Survey method's. It is its own vocabulary rather than entries in Survey method (BIODATA-102) so that version 1's list is unchanged
  and field techniques and methodologies stay apart. `METHODOLOGY_OPTIONS_V2` is gone. The store moved to version 5: the seed reaches a
  browser that already had data, and a vocabulary created there that had already taken BIODATA-117 keeps everything but its ID, which
  moves to the next free one. (2) Role in project stays required for every contact. (3) Versions 1 and 2 both stay for now.
  - Still open: an organisation field per contact; the map's Expand dialog for option 1 and version 1; the count's position in the hint.
  - Verified: tsc (stale `.next/types` only), eslint, `npm run check:contracts` OK; Playwright: version 2 lists the ten entries from the
    vocabulary with Systematic, Others asks its name; version 1's dropdown still lists Survey method (Active search, no Ramble); the
    Controlled Vocabulary list shows Survey methodology for the BioData Super Admin; a version 4 store holding a local BIODATA-117 comes
    back as the seed at 117 and the local one at 118. The one console error in that run came from the hand-made test record missing
    `updatedAt`, not from the app. Not committed.
- **Oct 9 2026, continued: one Methodology question, methodologies added one at a time.** The designer sent the full
  methodology list (Incidental observations; Systematic with twenty methodologies; Not recorded) and asked to merge Method of
  data collection and Methodology into one, a Systematic project adding each methodology one at a time with its variations,
  limitations and biases, like the trap effort editor.
  - **Vocabulary.** Survey methodology (BIODATA-117) now holds the twenty, in the designer's order, spelling tidied ("MacroInvet"
    to "Macro Invertebrate", "treees", "Herbivore Impact Assessment Method (SAAL)", "veg" to "vegetation"). IDs are never reused:
    the first ten keep theirs ("Others" became "Other", still 10) and the new ones are 11 to 20, so ID and Order differ. The
    store moved to version 6: a saved BIODATA-117 named "Survey methodology" is replaced by the seed. The top level (Incidental
    observations, Systematic, Not recorded) stays in the form (`COLLECTION_METHOD_OPTIONS_V2`), because the form branches on it.
  - **Form.** Version 2's Method and details has one required "Methodology" row: the three choices as radios (Unknown and Other
    gone, Not recorded added as `not-recorded`), and for Systematic a "Methodologies used" list with "Add methodology", the trap
    effort editor's menu, now shared as `app/pages/_shared/add-menu.tsx` (opt-in `popoverClassName`; the menu scrolls past 320px).
    Each added methodology is its name over an optional note, with a remove icon on hover or focus; it leaves the menu once
    added, except Other, which can be added more than once and asks its name. `MethodologyChoice` gained `rid` and `other`;
    `methodologyOther` is gone. Review shows one Methodology row ("Systematic: Ramble, Pitfall grid") and the notes.
  - **Knock-on.** "Not recorded" is labelled on the project page, its audit diff and the project report through
    `COLLECTION_METHOD_LABELS`; the project page's edit form keeps it as a choice when a project holds it. Version 1 unchanged.
  - **Open:** whether each methodology's note is required (it is optional, as before); whether the menu should be a searchable
    list once the vocabulary grows (the "long lists are searchable" rule) instead of the trap effort menu; the three earlier open
    items (organisation per contact, Expand dialog for option 1 and version 1, the count's position).
  - Verified: tsc (stale `.next/types` only), eslint, `npm run check:contracts` OK; Playwright as a Registered User: Continue with
    nothing chosen names the field; Incidental asks nothing more; Systematic lists twenty in the menu, an added one leaves it,
    Other asks its name and blocks Continue until named, remove works; version 1 still has Unknown and Survey type; a version 5
    store holding an old BIODATA-117 comes back at version 6 with twenty entries; no console errors. Not re-run in a browser: the
    trap effort editor after the menu moved (type-checked only) and the Review row. Not committed.
- **Oct 9 2026, continued: a searchable picker, nested under Systematic; the method choices reverted.** The designer: the
  methodology list grows, so find a better picker than a menu; the list sat under the last choice, away from Systematic
  (proximity broken); and "Not recorded" was a change nobody asked for, so revert it.
  - **Reverted.** Version 2's choices are Incidental observations, Systematic and Other again, with their original descriptions
    (`COLLECTION_METHOD_OPTIONS_V2` filters out Unknown, as before). `not-recorded`, `COLLECTION_METHOD_LABELS` and their
    knock-ons on the project page, its edit form, the audit diff and the report are gone; those files are back as committed. The
    trap effort editor is back as committed and `_shared/add-menu.tsx` is deleted, since nothing needs it now.
  - **Picker.** "Search and add a methodology" is the searchable single select (`MultiSelect selectionMode="single"`, as the
    Observers field), listing what is not added yet (Other always, so it can be added more than once). Each pick appends a
    methodology and clears the field. No match says "No methodology found. Pick Other and name it."
  - **Grouping.** The methodologies and the picker render inside the radio group straight after Systematic, indented 24px so
    they start on Systematic's label (measured: both at x 658), and Other follows them. The "Methodologies used" heading is gone.
  - **Contract.** The designer asked for a clause on not changing what was not asked; drafted for review, not yet written to
    `CONTRACTS.md`.
  - **Open:** the shared `MultiSelect` keeps the last search text when it reopens (searched "bc", picked BCM, reopened: the box
    still says "bc"), which is a component fix for every caller (1.9), not made here, for the designer to approve; whether the
    vocabulary's tidied spellings should go back to the designer's exact wording; the earlier open items.
  - Verified: tsc (stale `.next/types` only), eslint, `npm run check:contracts` OK; Playwright as a Registered User: choices are
    Incidental observations, Systematic, Other; "bird" finds the two bird surveys; mouse and keyboard picks append and close; no
    match shows the empty state; no console errors. Not committed.
