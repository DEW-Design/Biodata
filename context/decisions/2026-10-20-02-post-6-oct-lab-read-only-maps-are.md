# 2026-10-20 - Post-6-oct lab: read-only maps are Mapbox GL

- **Oct 20 2026: Post-6-oct lab: read-only maps are Mapbox GL.** Designer: "Only in the /proto/post-6-oct page, can we replace leaflet map viewer
  with mapbox? I feel like it's better designed." Asked how to get the token Mapbox needs; the designer chose to paste a public one (not yet received
  when this was written, see Open).
  - **Scope:** every read-only map reached through `ExpandableMap` (a record's location, a project's extent, their expanded dialog), on
    `/proto/post-6-oct` only. Every other page, and the location picker (project registration, the DLA "Add a location" map, which draw), keep Leaflet.
  - **How it stays lab only (5.4, 1.6):** `app/pages/_shared/map-search/map-engine.tsx` is a context holding an optional render function, null by default.
    `ExpandableMap` asks it and draws Leaflet when it is null, so no screen changes unless a page provides one. `MapZoomButtons` now takes anything that can
    zoom (it only called `zoomIn` and `zoomOut`), so the Mapbox map reuses the same pill. The lab's `page.tsx` provides `app/proto/post-6-oct/mapbox-map.tsx`;
    nothing outside `app/proto` imports it. `mapbox-gl` 3.33.0 is added to `package.json` (the production build removes `app/proto`, so it is not bundled there).
  - **What the Mapbox map draws (same props as the Leaflet map):** the areas (circles and polygons, the one the list is pointed at heavier), the dashed
    reference outlines, a dot per marker as a real button (tab order, named by its label, Enter or Space, tooltip on hover), a restricted record's flat block
    (never a pin, a smallest size of 14px at state-wide zoom, a transparent button over it for the keyboard), the zoom pill, a metric scale bar, attribution,
    fit to the areas (a jump the first time, a flight after), "zoom to this area" and "centre this record" (pan only). Style `mapbox://styles/mapbox/light-v11`.
    Colours are the brand tokens, resolved from the CSS variables at run time (no hex in code).
  - **Not done:** drawing (`activeDrawTool`, `onBoundaryAdd`) and `onMapReady` (it hands out a Leaflet map): neither is used by the read-only maps.
  - **Needs a token:** `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` (git-ignored), and a dev server restart. Without it the map's box says so instead of showing nothing.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the five touched files and `npm run check:contracts` clean. Live (headless Chromium, Super Admin, zero
    console errors): the project page's Overview and Project records maps show the token message, so the engine is reached; the production Explore page still
    draws one Leaflet map and no Mapbox one. **Not verified:** the Mapbox map itself (no token yet), so none of its drawing, markers, fitting, zoom or
    scale has been seen on screen; the dialog's expanded map; other roles.
  - **Open:** (1) the token, to see and check the map; (2) which Mapbox style (this uses Light, the quietest; Streets and Outdoors are the others to compare);
    (3) whether the dev tools' bar should switch Leaflet and Mapbox for comparison; (4) `maxBounds` is kept from the Leaflet map and may need loosening once seen.
