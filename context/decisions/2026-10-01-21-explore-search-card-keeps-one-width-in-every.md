# 2026-10-01 - Explore search card keeps one width in every state

- **Oct 1 2026: Explore search card keeps one width in every state.** The designer compared the floating search
  card before and after a search (two screenshots) and asked why its width changed: "I want no dance-y layouts."
  - **Cause.** The card's maximum width was 400px or the map key's measured width, whichever was larger, so the
    earlier request to "increase panel width to match labels width" made the card 400px with no results and about
    422px once results brought the key with them. A measurement of a different element, taken a moment after the
    results appeared, drove the card's width.
  - **Changed.** The card is 440px in every state (empty, one area, results, after New search, with or without a
    key), and only shrinks, down to 280px, when the map is too narrow for it and the summary card's column. The map
    key is capped at the same 440px and wraps inside it when it has more groups than fit, so the two still line up
    without either measuring the other. The `ResizeObserver` and the `--key-w` variable are gone
    (`observations-search.tsx`); `MapLegend` wraps (`map-legend.tsx`). The earlier "match the key's width" wish is
    met by a fixed width the key fits in (its widest current set is about 422px), not by measuring.
  - **Principle recorded** in the screen-building principles of `.claude/rules/ref-shell.md`: a container keeps its
    size across states; content can grow inside it, the container does not change width.
  - **Verified:** in a live browser the card is 440px wide and starts at the same x in the empty, results and after
    New search states, for Registered User and Public User at 1708, 1280 and 1024px, and the key is 440px where it
    wraps; zero console errors; `tsc`, `eslint` and `check:contracts` pass. Not committed.
  - **Open.** The card's height still follows its content (short when empty, tall with results), which is growth
    inside a fixed-width container, not a width change. If that also reads as a jump, a fixed or minimum height is
    the next option. The other Explore layout (`option-2`) was not measured.
