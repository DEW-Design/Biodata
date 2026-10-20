# 2026-10-20 - Post-6-oct lab: the map takes the design system's colours

- **Oct 20 2026: Post-6-oct lab: the map takes the design system's colours.** The designer, on a screenshot of the lab's project map: "maps looks black and white, anyway to use dew branding to make it
  look nicer and more cohesive with the ui?" (after "I need to get this map closer to the brand colours, and nicer. Let's keep exploring this.")
  - **What was wrong (`mapbox-map.tsx`):** the map uses Mapbox's stock `light-v11` style, and every colour in it is a grey (`hsl(220, 5% or less, ...)`, read from the style's JSON: 50 layers), so the map
    read as a screenshot dropped into a branded page. The only brand colour on it was the project's area.
  - **The fix (new `map-palette.ts`, one call in `mapbox-map.tsx`):** on `style.load`, before the first frame, the style's own layers are repainted with design system tokens, resolved through the map's existing
    `cssColor` probe so no hex is written (CONTRACTS 2.1): land `gray-50`, built-up land and buildings `gray-100`, water and rivers `brand-200`, green space (parks, woods, grass, scrub, agriculture, national
    parks) `accent-200`, glacier `brand-50`, boundaries and rail in warm greys, roads left white; place names from `gray-800` (largest) to `gray-600`, suburb and road names `gray-700`, water labels `brand-600`,
    green-space labels `accent-900`. A layer not named keeps Mapbox's paint. The scale bar (Mapbox's own control, near-black frame and a system font) takes a `gray-500` frame, `gray-700` text and Barlow;
    `!` is needed on the colours because `mapbox-gl.css` is not in a cascade layer and beats any utility. The areas, outlines, blocks and dots (the product's own marks, brand teal) are unchanged.
  - **Chosen from three tries, looked at in the lab at the project's Overview and zoomed into Adelaide:** (A) land `gray-100`, green `accent-100`: warm but still near grey, the green all but invisible; (B, kept) land
    `gray-50`, green `accent-200`: brighter, the green and water read as colour; (C) land `gray-50`, green `accent-100`: cleaner but still close to the original. The areas' wash (brand-600 at 15%) is about
    `#D6E1E3`, so water is a step darker (`brand-200`) to keep a coast from reading as part of an area.
  - **Measured:** the contrast of each label colour on its fill by the WCAG formula: place names 7 to 10:1 on the land (5.6:1 over a project's wash), the softest labels (small places, points of interest) 4.95:1 on
    the land and 3.9:1 over the wash, water labels 4.95:1, green-space labels 5.8:1; Mapbox's own greys were 2 to 3.9:1. The first palette had green-space labels at 3.8:1 and points of interest at 3.2:1 and was
    darkened. Computed styles of the scale bar in the browser: frame `rgb(143, 139, 135)`, text `rgb(88, 84, 81)`, Barlow, no top border kept.
  - **Open:** (1) green space (sage) and water (teal-blue) are both teal-leaning, told apart by lightness and shape, not strongly by hue: the design system has no green, and bringing in one is a designer decision
    (CONTRACTS 2.1); (2) at state-wide zoom the green is faint by Mapbox's own rule (`landuse` opacity 0.2 below zoom 8); (3) the same recolour done as a Studio style (the designer's, `smaniganahalli1/cmvfv5ec...`)
    would put the colours in the style instead of in code, but no browser tool or Mapbox tooling token reached the session, so it was not touched; this palette is the spec for it; (4) the Leaflet maps on the
    production pages are unchanged (the lab's engine slot is another session's, `map-engine.tsx`); (5) a Prototype tools "Map style" switch against the stock look was not built: the stock look is the one
    on the designer's screenshot, and a switch is one more option to retire (CONTRACTS 4.4); say so if wanted. Not committed.
  - **Verified, in a browser (Playwright with the cached Chromium, a script outside the repo):** the map in the project's Overview (the Adelaide Hills project) at its fit and zoomed in, and in context on the page; zero
    console errors in each run; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean. **Not verified:** the map for the Registered User and the Signed out visitor (the engine is
    the same, the palette does not depend on the role); a map with restricted blocks and dots over the new colours (not on this project's Overview); the Expand view (the button was pressed in the script and
    the page did not open a dialog that was seen, so the expanded map was not looked at); `/emil-typography` and `/emil-design-foundations` (no text added: only colours and the scale bar's font). Not committed.
