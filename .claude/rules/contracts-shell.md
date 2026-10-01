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

- **Exempt:** Add Project option 1 (a stakeholder option, one question per card), and editing in place on a
  detail page's own cards, which follows §4.7 instead.
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

**One search width (§4.2c).** The search box in a collection toolbar (the row of search, then Filter,
then any view or tree controls, above a list, table or tree) is the same everywhere.

- MUST render `<ToolbarSearch>` (`app/pages/_shared/toolbar-search.tsx`): 384px wide (`max-w-sm`), shrinking
  only on a narrow screen, small size, the `SearchMd` icon. Filter sits directly after it.
- MUST NOT let the toolbar search grow to fill the row (`flex-1`), or give it its own width.
- **Open, not decided:** Explore's results search (`/pages/observations`) was made full width on the
  designer's instruction before this rule existed, and project-detail option 2's records search is
  `max-w-md`. Neither has a Filter button beside it, so the check does not catch them; bringing them in
  line is for the designer to decide.
- **Origin:** the Survey records toolbar on project detail Option 3 grew its search to the full row while the
  Projects, DSA, DLA and User Management lists all used 384px.
- **Enforcement:** `AUTO §4.2c` (a file with a `ListFilterButton` whose search is a hand-rolled `Input` with a
  search icon fails), `REVIEW` for toolbars without a Filter button.

**One gap under the header (§4.2d).** Under a `SectionHeader`, the collection body (any notice, the toolbar,
the table) sits in one wrapper with `p-6`: the same 24px between the header's divider and the search on every
list, and 24px to the sides and bottom.

- MUST wrap the body that follows `</SectionHeader.Root>` in a `div` with `p-6` (`flex min-h-0 flex-1 flex-col
  gap-4 p-6`, as every list does).
- MUST NOT give that wrapper side and bottom padding only (`px-6 pb-6`) or none at all: the search then sits
  flush against the header's divider.
- **Origin:** the Notification Management list and the project's Datasets view both shipped with `px-6 pb-6`,
  the search box touching the divider, while every other list used `p-6`; the designer: "This error is recurring
  fix it and add to contracts" (1 Oct 2026).
- **Enforcement:** `AUTO §4.2d` (in a file with `<ToolbarSearch>`, no `div` between `</SectionHeader.Root>` and the
  first `<ToolbarSearch>` carries `p-6`, `pt-6` or `py-6`).

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

### §4.7 Roles belong to the data owner's contacts; show only what is approved

A project's data owner (shown as **Published by**) has one or more contacts, and every one of those
contacts carries its own **role** (role or type of work). The role is part of that contact.

1. The role MUST be shown with its contact (name, then "· role"), and edited with that contact.
2. MUST NOT show a separate "your role", "registered by", "Registered by (role)" or similar field or
   row, and MUST NOT add a "Project team" card, on project detail or in its edit flows. Project managers
   have their own card and their own roles.
3. MUST NOT add a field, row, card, section or label to a screen that the designer did not approve or
   the source does not define, even when it seems helpful. A new label is a question (§0.4), not a
   decision.

- **Origin:** a "Project team" card with a "Registered by (role)" row appeared on project detail
  Option 3 after the role had already been placed with the data owner's contact, a correction the
  designer had made more than once.
- **Open, not decided:** the Add Project registration still asks "Your role" in its Project team
  section; whether that question moves to the data owner's contact in registration is for the designer.
- **Enforcement:** `AUTO §4.7` (a "Registered by" label under `app/pages` fails), `REVIEW` for the rest.

### §4.8 Editing in place on a detail page

Where a detail page (a record, a project) is edited on its own cards rather than in a form, every edit
behaves the same way, on every card and every page.

1. **Entry:** a card's edit icon edits that card; a field's edit icon (on hover or focus) edits its card,
   scrolled to and focused on that field; "Edit record" (or the page's equivalent) edits every card. A new
   record opens the same way, every card in edit mode.
2. **One treatment:** a card in edit mode has the brand border and brand-50 halo and says "Editing". The field
   rows use the same label-left layout as when viewed.
3. **More than one card at a time:** while a card is in edit mode, the other cards stay at full strength and keep
   their edit icons; opening another adds it to the same edit. MUST NOT dim or lock the other cards.
4. **Actions in one place:** Cancel and Save changes (or "Add <type>" for a new record) sit in one sticky footer
   across the bottom of the page, reading "Editing <cards> · Unsaved changes", and cover every card in edit mode.
   MUST NOT put them inside a card or repeat them per card.
5. **Leaving:** Cancel or Exit with unsaved changes asks first. Save and Cancel return to the view the edit was
   started from (a side panel stays a side panel, a full view stays a full view).
6. **Visibility:** where a record's fields can be hidden, the right-hand column becomes the "Fields shown"
   checklist while a card is in edit mode, and for a new record.

- **Origin:** Project details kept Cancel and Save inside the card while record editing had them in a page
  footer; the designer caught the difference ("Consistency is the key"). Item 3 replaced "the other cards dim and
  hide their edit icons" on 29 Sept 2026, by designer decision, after locking the other cards got in the way.
- **Enforcement:** `REVIEW`.
