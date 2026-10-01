# 2026-10-01 - Explore Map settings button removed

- **Oct 1 2026: Explore Map settings button removed.** Designer page feedback on the results header of Explore's search
  card (`/pages/observations`): the gear "Map settings" button, "remove coz it's redundant".
  - **Changed.** The button and its popover are gone (`observations-search.tsx`). The popover held one setting, a
    "Result dots" switch, so the result dots are now always on the map (and the map key with them); the state, the
    switch and the imports (`Dialog`, `DialogTrigger`, `Popover`, `Toggle`, `Settings01`) are removed. The results
    header is the summary line and the export control.
  - **Decided by me, to confirm:** removing the only display setting means a person can no longer hide the dots to see
    the map or areas underneath. If that is wanted, it belongs on the map (beside the zoom buttons), not in the card.
  - **Verified:** in a live browser, results state, Registered and Public User at 1708, 1280 and 1024px: no "Map
    settings" button, the export control is still there, the card is still 440px, no console errors; `tsc`, `eslint`,
    `check:contracts` pass. Not committed.
