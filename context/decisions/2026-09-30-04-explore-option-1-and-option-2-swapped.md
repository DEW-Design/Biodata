# 2026-09-30 - Explore option 1 and option 2 swapped

- **Sept 30 2026: Explore option 1 and option 2 swapped, by direct request from the designer ("it's only a swap").**
  - **Now:** Option 1 is the floating card over the map (search areas as layers, results in the same card, no Search step), at the plain route `/pages/observations`. Option 2 is the original flow (search on the map, press Search, land on a results page), at `/pages/observations/option-2`.
  - **Changed:**
    - `app/pages/observations/page.tsx` renders `layout="float"` with the switcher on `option-1`; `option-2/page.tsx` renders `layout="classic"` with the switcher on `option-2`.
    - `layout-switcher.tsx`: the labels, descriptions and hrefs of the two options swapped.
    - `observations-search.tsx`: the reset that leaves a keyword search (`router.replace`) now returns to the route of the layout being shown, so each layout stays on its own route. The `ExploreLayout` comment names the new mapping. The layout values `classic` and `float` are named for what they do, so they were not renamed.
    - `app/pages/page.tsx`: the two `/pages` index lines swapped.
  - **Knock-on:** every link to `/pages/observations` (the rail's Explore, the header search's `?q=`, the landing page) now opens the floating card, since the plain route is Option 1. The floating layout already handles a `?q=` keyword.
  - **Verified:** `tsc --noEmit`, `eslint --max-warnings=0` on every touched file and `npm run check:contracts` clean; both routes return 200 for registered-user and public-user.
  - **Not done:** a live browser pass (no Playwright-compatible browser could be launched in this environment, see 2026-09-30-03). The keyword reset and the switcher hand-off between the two routes have not been clicked through.
  - **Still open:** none from this swap. The project details consistency request is a separate decision, not yet built.
  - Not committed.
