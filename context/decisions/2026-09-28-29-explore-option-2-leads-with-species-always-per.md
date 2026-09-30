# 2026-09-28 - Explore option 2 leads with Species, always, per designer feedback off a screenshot ("why does adding an area default to showing Projects tab content? ... it must show species tab content first. Non-negotiable").

- **Sept 28 2026: Explore option 2 leads with Species, always, per designer feedback off a screenshot ("why does adding an area default to showing Projects tab content? ... it must show species tab content first. Non-negotiable").**
  - **Cause:** option 2 already defaulted to Species, but two paths overrode it.
    - Opening restored the tab from the saved search (`explore-search-store.ts`). Option 1 shares that search, and its default is Records > Projects, so option 2 opened on Projects after option 1, or after a reload.
    - Adding an area never touched the tab, so whatever tab was open stayed open.
  - **Fix (`observations-search.tsx`, option 2 only):**
    - Option 2 always opens on Species; it no longer takes the tab from the saved search.
    - Whenever an area is added (drawn, entered, a national park picked, a shapefile uploaded), it switches to Species. This is detected by a new area id appearing, adjusted during render, not in an effect.
    - Switching tabs by hand afterwards still works.
    - Option 1 is unchanged: it still restores its own tab.
  - **Verified live (Playwright, 1708x1024, BioData Admin):** the first area lands on Species; after switching to Projects a reload lands on Species; switching to Projects and adding a second area lands on Species; opening option 2 after option 1 lands on Species. Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.