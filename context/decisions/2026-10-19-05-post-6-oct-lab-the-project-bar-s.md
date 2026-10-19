# 2026-10-19 - Post-6-oct lab: the project bar's plus opens an Add menu, and the notice summary names what is inside

- **Oct 19 2026: Post-6-oct lab: the project bar's plus opens an Add menu, and the notice summary names what is inside.** The
  designer answered the open questions of `2026-10-19-04-*` and asked for a quality-of-life change.
  - **Answers to 04:** (1) old and sample uploads that are still failed or partly added keep their notices ("this is a mock page
    anyway"); (2) the summary row says what is inside, as recommended; (3) the list does not start open for a failure; (4) no Figma
    frame for the stack for now, "we can keep exploring in code".
  - **The notice summary** now reads "3 notices need attention: 1 failed, 2 partly added" (the counts of each, a kind left out when
    there are none of it), instead of the count alone (`project-notices.tsx`).
  - **The "+" in the project bar** (top right of the lab) opened Upload dataset only. It is now a menu: "Upload a dataset", a divider,
    then "Add an event", "Add an occurrence" and "Add an observation", each opening its types (events: Site, Visit and the sampling
    types; occurrences: Individual, Population; observations: Individual, Population, Non-biotic, Community), exactly what
    `childOptions(null, ...)` allows directly under a project. Picking a type opens the Project records tab and starts the same full
    screen new-record form the tab's own "Add record" does, under the project; when it is created the record is shown wide. A signed
    out visitor gets the sign-up prompt, for upload as before and "Sign up to add records" for the three adds (new copy, in the
    pattern of the existing prompts).
  - **Borrowed, not built (0.9):** the project's own `ActionsMenu` (`record-panel.tsx`), with three opt-in additions that leave every
    existing caller as it was (1.6): `extra` (items of the caller's, first, then a divider), `kindLabels` (the kind rows' wording) and
    `addHeading={null}` (no heading). `RecordsExplorer` gains the opt-in `addRequest` and `onAddRequestConsumed`: a request starts the
    add once per `id` (adjusting state while rendering, as the React Compiler lint rules require) and is cleared when the add ends,
    so it never starts again on a later visit to the tab. Product pages are unchanged.
  - **Open:** the add always goes in under the project itself (a Site, Visit, event, occurrence or observation at the top of the
    tree); choosing a parent first (a Visit for an observation) is not asked for here. A record added this way is not placed under
    the record currently selected in the tree.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the five touched files and `npm run check:contracts` clean. Sibling grep:
    `ActionsMenu` and `RecordsExplorer` have other callers (the record panel, the empty state, the product project page), none passes
    the new props. **Not verified:** a live browser pass of the menu, its submenus, starting an add from another tab and from the
    records tab itself, the signed out prompt, and the summary row's new text; no browser tool was available in this session.
    Typography QA (0.6 item 8) not run: the only new visible text is menu wording and the summary line, in the existing
    `Dropdown` and `NoticeRow` treatments. Not committed.
