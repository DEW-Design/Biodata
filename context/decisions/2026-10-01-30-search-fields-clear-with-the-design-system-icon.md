# 2026-10-01 - Search fields clear with the design system icon, not the browser's

- **Oct 1 2026: Search fields clear with the design system icon, not the browser's.** Designer screenshot of the filter
  menu's Project submenu with "Ade" typed: the blue x at the right of the search box was not ours ("how dare you use an
  emoji for X and get away with it"). It was the browser's own clear mark for an `<input type="search">` (a glyph drawn by
  the OS), which the new search box in the submenu showed because it is a raw react-aria `SearchField` and not the design
  system `Input`, and which `MultiSelect`'s search box would have shown the same way.
  - **Changed.** `app/globals.css` hides the browser's clear mark and decoration on every `input[type="search"]`. The
    submenu's search box (`filter-menu.tsx`) and `MultiSelect`'s (`components/base/select/multi-select.tsx`) now carry
    their own clear button with the design system's `XClose` (size 4, stroke 2.25, quaternary foreground, the same as the
    `Input`'s clear), shown only while there is text (`group-data-empty/search:hidden` on the field). The design system
    `Input` already had its own clear button and is unchanged.
  - **Sibling grep.** The only `type="search"` inputs are the two react-aria `SearchField`s above (plus the `Input` family
    that renders its own button), so no other field showed the native mark.
  - **Verified:** live on the filter menu: the native mark is gone, `XClose` shows only after typing, clicking it empties
    the box and leaves the menu open, no console errors; `tsc`, `eslint` on the touched files and `check:contracts` pass.
    **Not verified:** `MultiSelect`'s search box was changed the same way but not opened in a browser (I could not get a
    harness to open one on the docs page); it needs a look. Not committed.
  - **Open.** Nothing in the checks stops a raw glyph or a browser control standing in for an icon (section 2.4); first
    occurrence, so no `AUTO` check yet (section 0.8).
