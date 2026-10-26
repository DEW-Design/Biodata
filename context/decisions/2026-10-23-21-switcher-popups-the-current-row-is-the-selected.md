# 2026-10-23 - Switcher popups: the current row is the selected row, and the icon is part of it

- **Oct 23 2026: Switcher popups: the current row is the selected row, and the icon is part of it.** The designer, with a screenshot of the project switcher open over the dimmed card: "the selection isn't clear
  when the popup dims the bg - what have I chosen? I can't tell. Also, why not have the icon as part of the selection too? so it looks more polished?" Through `/refine-prompt`. Assumed: "the selection" is the current
  project in the popup, and "the icon" is the project's folder, which stood outside the button in the header and was not in the popup rows at all.
  - **What was happening (measured):** the popup opens with nothing focused or hovered, and the current row was not the list's selected item (`selectionIndicator="none"`, no `selectedKey`): it was a plain row with a
    small grey tick in the icon slot at the left. The grey row in the screenshot was a hover (the pointer resting on the other project, tinted `rgb(248, 248, 247)`), so the row that looked chosen was not the
    chosen one and the chosen one had no tint and a tick the colour of every other icon.
  - **Built, in `BreadcrumbSwitcher` (`app/pages/_shared/breadcrumb-switcher.tsx`):**
    - The current record is the ComboBox's `selectedKey`, so the row is drawn as the design system draws a selected item everywhere: tinted, with a brand-coloured tick at the right (measured: tint
      `rgb(248, 248, 247)`, tick `rgb(24, 94, 116)` 10px from the right edge). The left spacer trick is gone.
    - A new optional `icon` prop: in front of the name **inside the button** (so the hover and open tint wrap it; the text stays on the card's left edge, 97px before and after) and in front of **every row** of the
      popup, so the current row is the same thing as the button. The project switcher on this card passes the folder (the project icon of the record tree and the rail); the dataset switcher, whose title has no icon,
      passes none and keeps the tint and the tick.
  - **Behaviour that follows from a real selection (checked):** the keyboard now starts on the current row, as a select does (opened by Enter, the active option is the current project; ArrowUp then Enter goes to the
    other one; before, ArrowDown from nothing went to the first); choosing the row that is already selected reports no change in react-aria, so it closes the popup itself (`onAction`); typing "adel" leaves one row and
    clearing the box brings both back; the search box stays empty on open; after choosing, the popup lists the new project as selected.
  - **Flow-through (1.3), the same fault in every popup of this component:** the other eight users of `BreadcrumbSwitcher` take the tint and the right-hand tick too, and no icon. Checked: the project page's
    crumb (4 projects, the current one selected, clicking it closes) and a DLA record's (9 rows, the same); zero console errors on every screen tried. Not opened: the other record pages' crumbs (the same
    component and props).
  - **Not fixed, and why:** hover, focus and selected share one tint in the design system's `SelectItem` (`bg-primary_hover`), so with the pointer on another row two rows are tinted and the tick is what tells them
    apart. A tint of its own for the selected row (a light brand tint) would make it plain at a glance, but it is a change to `SelectItem` for every select, combobox and menu, or a call-site restyle of a design
    system component (1.5, 1.9), so it is the designer's to authorise. Recommended.
  - **Checked:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; the trigger's icon inside its button (button left 91, icon 97, text edge 97). Typography QA (0.6 item 8): no
    text changed. **Not verified:** touch, a screen reader on the new selected state, the plain (no switcher) form of the project name, and the dim over the new row at the other Popup treatments.
  - **Open:** (1) the selected tint (above); (2) whether the file title and the dataset popup should take a file icon too, as the project does (not done: nothing asked, and the file is the title); (3) the
    other callers' popups now differ from the old left tick on purpose. Not committed.
