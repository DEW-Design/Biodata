# 2026-10-02 - Project page rows: dividers no longer curl at their ends

- **Oct 2 2026: Project page rows: dividers no longer curl at their ends.** Annotated screenshot of the Project details card (BioData Super Admin): "something weird happening to the stroke. has a weird corner radius? please fix. no corner radius here".
  - **Cause:** each label/value row in the project page's cards (`Rows`, `project-tab.tsx`) draws its divider as the row's own bottom border. When the person can edit, the row also got `rounded-md` (for its hover highlight), and a bottom border on a rounded box bends up at both ends, so every divider curled at its right (and left) end. Only roles that can edit saw it.
  - **Fix:** the edit-mode row no longer has a corner radius; its hover highlight is a square band, in line with the straight dividers and the card's edge.
  - **Swept (6 item 5):** a live check of every element with a bottom-only border and a corner radius, on the project page (every tab, as BioData Super Admin and a registered user), DLA, DSA, nominations, User Management and Reports: the only hit is the records tree's L-shaped connector, which is meant to be curved. No other divider curls.
  - **Verified:** `tsc`, `eslint`, `check:contracts`; zero page errors; the Project details card re-measured and the dividers are straight rules from edge to edge.
  - **Open:** none. Not committed, not pushed.
