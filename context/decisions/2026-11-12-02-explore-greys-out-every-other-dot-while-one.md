# 2026-11-12 - Explore greys out every other dot while one species is highlighted

- **Nov 12 2026: Explore greys out every other dot while one species is highlighted.** The designer, with a screen recording of Explore: "selection of a species highlights that (works well), but should grey out all other dots."

  **What changed.**
  - `SAMap` (`app/pages/_shared/map-search/sa-map.tsx`) has an opt-in prop, `dimUnhighlighted` (default false, so every other caller is unchanged, 1.6). While a marker is highlighted, every other marker, round dots and restricted-location blocks alike, is drawn in `--color-gray-300` instead of its species-group colour. The highlighted dot keeps its colour, its larger size and its dark ring. With nothing highlighted, or a highlight that matches no drawn marker, nothing is greyed.
  - Explore (`observations-search.tsx`) turns it on. Hover and selection both count, as the highlight already did (`hoveredMarkerId ?? selectedMarkerId`).

  **Verified.** `tsc`, `eslint` on both files and `check:contracts` clean. Live, Registered User, keyword "a" (13 round dots plus restricted blocks): at rest the dots carry their group colours; hovering Western Grey Kangaroo, Short-beaked Echidna or Emu leaves one dot coloured at 20px and 12 grey at 12px; hovering off restores every colour; zero console errors. A restricted species (Malleefowl) greys all 13 round dots, as its own marker is a block.

  **Not checked.** Touch, a selected (pressed) record, the BioData Admin view, a wide window with hundreds of dots.

  **Open.** Map visualise (`dataset-error-map.tsx`) shares the map and highlights a marker the same way, but is left as it was: say if it should grey the others too (one more line). The dimmed grey (`--color-gray-300`) is lighter than the restricted block's own colour (`--color-utility-neutral-500`, the legend's "Restricted (block)"), so the two are told apart by shade only, and a restricted block that is not highlighted loses its distinct colour while another species is. Not committed.
