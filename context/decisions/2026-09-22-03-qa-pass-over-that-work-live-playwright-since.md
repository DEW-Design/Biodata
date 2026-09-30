# 2026-09-22 - QA pass over that work (live Playwright, since a browser was available after all).

- **Sept 22 2026 QA pass over that work (live Playwright, since a browser was available after all).** Found and fixed:
  `Table.Head` only applied the header style (`text-xs`, semibold, `text-quaternary`) to its `label` prop, so header text
  passed as children (the Projects page, the Table docs page, `dashboard/option-2`) rendered as unstyled bold black -
  the style now sits on the wrapper so both work; the project tree now opens fully expanded like the design; two
  em-dashes removed from the project-detail page (the End Date null marker became "Ongoing"); `text-balance` on new
  copy. Checked clean: every class on project-detail, Projects and Explore resolves to a real CSS rule (the only
  strays are the known `text-md` in `Input` and two component-internal tokens), the filter popover and tooltips carry
  Barlow, no horizontal or page overflow at 1024/1280/1440/1920 in either view, all 5 Explore tabs at 44px header /
  72px rows with the numbered footer for both roles, zero console errors on every page touched.