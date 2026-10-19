# 2026-10-19 - Post-6-oct lab: the project star is a filled favourite on press

- **Oct 19 2026: Post-6-oct lab: the project star is a filled favourite on press.** Page feedback from the designer on the star beside the
  project's name in the panel bar: "Onclick, that should be a fill. And that's favourite projects."
  - **What changed (`shell.tsx`):** pressed, the star is filled, with the fill set on the icon itself (`fill="currentColor"`, otherwise
    `none`) instead of a `fill-current` class that the icon's own `fill="none"` attribute could win against, and the pressed star takes the darker
    text colour. Its label, tooltip and accessible name now say "favourite projects" ("Add to favourite projects", "Remove from favourite
    projects"); a tooltip was added.
  - **What was not reproduced:** the class version looked correct in the code and the utility exists in the compiled CSS, so the reason it
    read as unfilled is not known; the explicit fill removes the dependence on it.
  - **Open:** favourites are kept for the session and shown nowhere else: no list of favourite projects, in the rail or on Home, reads them. Where
    they should appear is not decided and nothing was added.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `npm run check:contracts` clean. **Not verified:** the filled star in a
    browser, because none was available. Typography QA (0.6 item 8) not run: only a tooltip's text. Not committed.
