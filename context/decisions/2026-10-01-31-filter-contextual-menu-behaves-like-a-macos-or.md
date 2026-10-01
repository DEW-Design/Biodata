# 2026-10-01 - Filter contextual menu behaves like a macOS or iOS menu

- **Oct 1 2026: Filter contextual menu behaves like a macOS or iOS menu.** The designer sent the filter menu (option A of
  `/proto/filter-options`) beside a macOS menu with a Services submenu: "see how iOS does it, it feels like a contextual
  menu, our implementation, not so much." What the reference does and ours did not (an interaction reading, taken from the
  behaviour only, not its colours, type or density, section 2.6):
  - the submenu sat 12px away and a different height from the row that opened it, so it read as a second popover;
  - the row that opened it lost its highlight as soon as the pointer moved into the submenu;
  - empty checkboxes on every value, where the reference shows a tick only on what is on;
  - one unbroken list, where the reference separates related items with a line.
  - **Changed (component, `components/base/dropdown/dropdown.tsx`, additive):** a row whose submenu is open stays highlighted
    (`isOpen`, for every `Dropdown.Item`); a new `Dropdown.SubmenuPopover` (offset -2, crossOffset -5, placement "end top")
    tucks the submenu against its parent and lines its first row up with the row that opened it. `Dropdown.Popover`
    is unchanged. Documented on `/components/dropdown`. The only submenus in the app are this lab's.
  - **Changed (lab, `filter-menu.tsx`):** values show a tick on what is on (the item's default `checkmark`, space kept for it so
    the labels line up) instead of an empty checkbox or radio; the attributes are grouped with a line between the
    groups (the statuses of the upload, the template, the project, who and when); the Project and Ingested by submenu
    (with its search) lines its search box up with the row.
  - **Not changed, on purpose:** the menu's row height, type weight and widths are the design system's (section 2.9, 2.6);
    the reference's are tighter and lighter. If the designer wants the menu denser or lighter, that is a Dropdown
    decision for every menu, not a lab tweak.
  - **Verified:** live: the submenu starts 2px inside the parent's right edge, its first row lines up with the parent row
    (311 against 316, the popover's own padding), the parent row is highlighted while the submenu is open, the groups
    are separated, the Project submenu keeps its search, arrow and Enter ticking and stays open; no console errors;
    `tsc`, `eslint` on the touched files and `check:contracts` pass. Looked at in screenshots; not compared at 1280px.
    Not committed.
  - **Follow-up, same day (designer, annotated screenshot: "what's with the empty space? Looks really odd").** The tick the
    previous change added reserved a column on the left of every label, so a submenu with nothing ticked had an empty
    gutter before its labels. `Dropdown.Item` gets `selectionIndicator="checkmark-end"` (additive; the default `checkmark`
    is unchanged and still reserves its column): the tick is drawn after the label, only on what is on, and nothing is
    reserved. The filter menu's submenus (values, the Project search list, the date presets) use it. Verified live on
    Project status with Completed ticked: the four labels start at the same x (1040), the tick is at the right of the
    ticked row, the parent row shows its count (1), no console errors; `tsc`, `eslint` and `check:contracts` pass.
