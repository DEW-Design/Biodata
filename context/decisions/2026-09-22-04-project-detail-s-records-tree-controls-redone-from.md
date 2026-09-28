# 2026-09-22 - project-detail's records-tree controls redone from Mobbin filter patterns

- **Sept 22 2026: project-detail's records-tree controls redone from Mobbin filter patterns** (Delphi, Devin, Plain,
  Copilot Money: active filters as removable chips + a Clear link; Dropbox: a type checklist with Select all;
  VS Code explorer via Shopify: tree-wide actions in the section header's "..." menu). "Records" header row carries a
  `Dropdown` "..." menu (Expand all / Collapse all) instead of two unlabelled double-chevron icons; search sits beside an
  icon-only `Button` filter that tints (`bg-brand-50`) while a filter is on, its popover is the record-type `Checkbox`
  list with Select all / Clear, and the real `Tag` component shows each active type as a removable chip beneath.
  Built on `/pages/project-detail`, not `/proto/public-user` (that lab only varies the left column and has no records
  tree). Checked live: menu, filter, chip remove, Clear and Select all all drive the tree, portaled menu and popover carry
  Barlow, no dead classes in the sidebar, zero console errors.