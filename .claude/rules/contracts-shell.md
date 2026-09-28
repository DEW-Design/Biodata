---
paths:
  - "app/pages/**"
  - "lib/create-menu.ts"
  - "lib/registered-user-nav.ts"
  - "config/role-access.config.ts"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: shell

The persona shell and page patterns: header, rail, columns, forms, lists, record pages, floating panels. Full text and numbering: CONTRACTS.md.

### §2.8 Floating panels never overlap

Two floating elements on the same surface (map controls, a summary card, a map key, a search card,
the map's scale bar and attribution) MUST NOT cover each other, at any window size.

- MUST lay out floating panels that share a surface in one layout (a flex column or row), not
  position each one on its own with offsets that only work at one size.
- A panel that can grow (a card with a photo, a results list) MUST be height-bounded by that layout
  and scroll inside itself; its primary action stays reachable.
- Where there is not room for panels side by side, they stack; they never overlap.
- **Exception:** the floating dev tools (§3.8) are draggable and are not product layout.
- **Origin:** Explore option 2's record summary card grew down over the "Species group" map key.
- **Enforcement:** `REVIEW` (a live pass measuring panel boxes at several window sizes, §0.6 item 4).

### §3.1 One header

Every real `/pages/**` screen renders `<AppHeader />` and nothing else at the top. It MUST NOT be
hand-rolled, copied, or wrapped to change what it shows.

- **Enforcement:** `AUTO §3.1`.

### §3.2 One rail, one icon map, one footer block

Column 1 is `<PrimaryRail />`, icons come from `nav-icons.ts`, column 2 ends with `<SidebarFooterLinks />`.

- **Enforcement:** `AUTO §3.2`, `AUTO §3.3`, `AUTO §3.5`.

### §3.3 Account controls live in the header

`ProfileMenu` and `GuestAuthActions` are used only by `AppHeader`. MUST NOT be copied.

- **Enforcement:** `AUTO §3.4`.

### §3.4 Persona consistency

A persona sees the same header and rail on every screen. Role-specific behaviour (org pill, the Add menu,
account control, Home's task badge, which sections the rail lists) is decided inside the shared component
from the role and `config/role-access.config.ts`, never at a call site. `public-user` is the only
deliberate exception, and only in account controls and gated actions.

### §3.5 The Add menu

The header has one "Add" button (Jira-style). What it offers comes from `lib/create-menu.ts`, filtered by
the role-access matrix. MUST NOT add a separate creation button to a header.

### §3.6 Position

The header is a top-level sibling before the rail + sidebar + main row, full width, never inside `main`.

### §3.7 Three columns

Primary rail, contextual sidebar, main - under the full-width header - on every screen and every persona.
A role that cannot use a section still gets all three, with the restriction stated in main. Column 2
always exists and always says something about where you are.

- Exempt by name: `app/pages/biodata-home` (marketing), `app/pages/auth/**` (auth flow) and `app/pages/page.tsx`
  (the `/pages` screen index, a directory of screens rather than one).

### §3.10 Column 2 is navigation and actions only

The contextual sidebar (column 2) holds where you are and what you can do from here: a section label, a
list or tree or scope switch that moves you around, the Actions group (export, report), and the footer
links. It MUST NOT hold information: no explanatory copy, no steps or explainers, no alerts, task cards
or accordions. Information sits in main, above the content it explains.

- **Exception:** the public-user (signed-out visitor) column 2, which explains what BioData SA is and
  points to guides (`GuestAboutAside`). No other persona and no other screen.
- **Origin:** the nominations list put a "How a nomination is reviewed" steps explainer in column 2.
- **Enforcement:** `AUTO §3.10` (an `<aside>` in `app/pages` containing a heading, Progress steps, alert,
  accordion or task card, except the public-user file). It catches structural information only; prose in
  a plain paragraph is `REVIEW`.

### §4.1 The form pattern

Every create or edit form (Add Project option 2, DSA, DLA, and any new one) MUST render `<FormPage>`
(`app/pages/_shared/form-page.tsx`) with fields laid out in `<FormRow>`. Documented at `/patterns/forms`.

1. **Header:** an optional eyebrow, the title (with a status badge for an existing record), a one-line
   subtitle, and one **close button (X)** at the top right (`CloseButton`, labelled "Close form"): the way out
   of the form. The header describes the step; it MUST NOT hold any other action.
2. **Sections live in column 2.** A form with more than about two or three field groups is split into
   sections, and the sections are listed in the contextual sidebar as a `FormSectionList` (rendered into the
   shell through `FormSidebar`), which is the real **vertical Progress steps** component
   (`Progress.IconsWithText`, `orientation="vertical"`): a progress bar, the sections grouped by step, and a
   state per section (current, complete, needs attention, not started). Any section can be opened at any time. Sections MUST
   NOT be tabs, a horizontal stepper, or a forward-only wizard. Related fields share a screen.
3. **Rows:** label and help on the left, fields on the right (`FormRow`). Required fields are marked `*`.
4. **Mandatory details block progress.** Continue does not move on, and jumping forward through column 2
   is refused, while the current section has mandatory fields missing. Going back is always free. When it
   refuses, the form shows a **"Details missing" error alert** above the fields (`FormPage` `problems`,
   an `AlertFullWidth` with `wrap`) that names exactly what is missing, and switches on the inline error
   on each empty field. Nothing turns red or alerts while a person is still on their first answer; it only
   happens after they try to move on, and **only for the section they tried to leave**. A section they have
   not reached is never validated, marked, or counted ahead of them (it stays "not started"), and
   arriving at it never shows it in red. The one exception is Submit, which checks the whole form. Column 2 marks the sections that still need attention, with a
   count. The alert and the inline errors are the only feedback; MUST NOT add a second message for the
   same fact.
5. **Footer:** every action, where the task ends. **Back a step** (secondary, left arrow icon) on the left,
   hidden on the first section. On the right, **Save draft** (secondary), then the primary action:
   **Continue** (right arrow icon) to move on, or the final action (**Submit**, **Create project**, **Save
   changes**) on the last section. Save draft is omitted when a draft makes no sense (editing a live record).
   Toasts are lifted clear of this footer everywhere (`TOAST_OFFSET`), so they never cover its buttons.
6. **Leaving:** the close button asks before discarding unsaved changes (`ConfirmationModal`), and says
   what will be lost.
7. **Controls:** real DEW components only (`Input`, `TextArea`, `Select`, `MultiSelect`, `RadioGroup`,
   `Checkbox`, `Accordion`). No bespoke choice tiles.
8. **Draft:** a draft needs only what identifies the record; submit validates the rest.

- **Exempt:** Add Project option 1 (a stakeholder option, one question per card).
- **Enforcement:** `AUTO §4.1` (a file that uses `FormRow` must import `FormPage`), `AUTO §4.1b` (a `FormPage` screen must not use tabs).

### §4.2 Lists and tables

Every collection screen is Section header, then search, then table: `SectionHeader` (title, a real
`CountBadge`, subheading, primary action), a real `Input` search, `TableCard.Root` around `Table` with
`TableCard.PaginationNumbered`. Applies at every scale, including a small table inside a detail tab. A
list is a table page whose rows are links (`href`), and the deep dive is its own route
(`/pages/<name>/<id>`); create and edit are routes too. Never a hand-rolled header or a bare unpaginated
table.

**The table fits the viewport.** A collection screen never scrolls as a page because of its table. The
section header, banner and search keep their height, the table takes the rest, the rows scroll inside it
under a sticky header, and the numbered pagination stays pinned at the bottom.

- MUST give the table `Table bodyScrollable` and `Table.Header sticky`, put it in a `TableCard.Root` that is
  `flex min-h-48 flex-1 flex-col`, and give every ancestor up to the shell's `main` `flex min-h-0 flex-1 flex-col`
  (the section header and search are `shrink-0`). The `min-h-48` floor lets a very short window scroll the
  content area instead of collapsing the table to nothing.
- MUST NOT let a collection table grow to its full height and push the page into scrolling.
- **Exception (embedded table):** a small table inside a detail tab (a record's systems, a measurements
  table). The page is the scroll container there and the rows are few, so it keeps its natural height.
- **Exception:** doc pages and `/proto` labs.
- **Origin:** the Explore results page grew taller than the window and carried the toolbar and pagination
  off screen with it; the Projects, DSA and DLA lists did the same once they held more than a few rows.
- **Enforcement:** `AUTO §4.2b` (a screen using `TableCard.Root` without `bodyScrollable` fails, except the
  embedded tables listed in the script), `REVIEW` for the layout chain.

### §4.3 Cognitive load

More than five or six field groups needs tiering. A conditional field is conditional in the UI. One focal
point per view. Never restate a fact in two treatments on one screen. When load and one extra click are in
tension, take the click.

### §4.6 Record pages follow the project page

Every record page (a project, a DLA, a DSA, a nomination, a user, role or permission, and any new
record) is laid out like the project page (`/pages/project-detail`):

1. A Back link on its own above the card (`RecordBackLink`).
2. The gradient identity card (`RecordHero`): eyebrow, title, a row of label/value facts, and the
   record's actions at its top right (`RecordActionBar onDark`): one button for the next step, every
   other action in the "..." menu, destructive ones below a divider.
3. Optionally, one notice saying where the record stands and who acts next.
4. Underline `Tabs`, each panel a bordered card of label/value rows (`RecordRow`).

- MUST NOT put a record's actions in a bar above the card, or stack its content without tabs.
- **Origin:** the nomination record page shipped with its actions above the card and no tabs, after
  the designer had already asked for every record page to follow the project page.
- **Enforcement:** `REVIEW`.
