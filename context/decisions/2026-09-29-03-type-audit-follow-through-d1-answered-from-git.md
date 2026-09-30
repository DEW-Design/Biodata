# 2026-09-29 - type audit follow-through - D1 answered from git history, D2 (heading weight) and D5 (Barlow italic) done, D4 (`text-quaternary` contrast) deferred at the designer's request.

- **Sept 29 2026: type audit follow-through - D1 answered from git history, D2 (heading weight) and D5 (Barlow italic) done, D4 (`text-quaternary` contrast) deferred at the designer's request.**
  - **D1, "did `text-md` exist when the type scale was brought in?" - no, never.** Checked directly against git
    history: this repo's history begins at two initial-commit points, and `app/globals.css` (with its Display-size
    scale), `styles/theme.css` (the orphaned, never-imported Untitled UI Tailwind preset that does define
    `--text-md`), the typography docs page and `input.tsx`'s own `text-md` usage all first appear together in the
    same commit - there is no earlier point where `app/globals.css` defined `--text-md` and a later one where it
    was removed. `text-md` has never been a real token in the design system's own live layer; it only exists in the
    dead `styles/theme.css` file. The ingested component code assumed that file's full preset would be live and it
    never was - this isn't drift, the type scale was authored without it from day one. Sharpens D1's own
    recommendation (still logged in `audit/type-audit-2026-09-29.md`, unresolved): whatever `text-md` renders as
    today (inherited, usually 14px) was never a deliberate value to protect.
  - **D2, heading weight - done.** Applied the docs' own rule (headings semibold, labels and nav stay medium) to
    every medium-weight `&lt;h1&gt;`-`&lt;h3&gt;` in `app/pages/**` - about 45 sites once every literal duplicate was found,
    not the ~35 first estimated: the 9 hero/record H1s, the shared shell H1 pattern across all 9 shells (DSA, DLA,
    User Management, nominations, dataset upload, dashboard, project-list, Explore, observation-detail) plus their
    "not found" states, Home's 6 section headings, `DetailSection`/`ContactCard` (shared components, fixed once),
    and ~18 standalone card headings (`dsa-detail`, `data-overview`, `threat-summary-card`, `flora-content`,
    `fauna-content`, `about-content`, `registration-summary`, `option-2/page.tsx`, `record-panel`/`record-detail`,
    `artefact-table`'s own `!`-overridden title). KPI/stat *values* (`KpiStat`, `MetricCard sm`) were deliberately
    left alone - a number is not a heading, that's D8's own decision. The two already-flagged stale drafts
    (`app/pages/projects`, `projectsv2`) were left as-is, per this file's standing "confirmed stale, not brought in
    line" precedent. Verified `tsc --noEmit`, `eslint --max-warnings=0` on all 34 touched files, and
    `npm run check:contracts` clean; a live Playwright pass confirmed every spot-checked heading (Home's greeting
    and its 4 sections, the Projects list, a generated project page, a DLA record, User Management) computes
    `font-weight: 600`, zero console errors.
  - **D5, Barlow italic + `font-synthesis: none` - done.** `app/layout.tsx`'s `Barlow` loader now requests
    `style: ["normal", "italic"]` alongside its existing weights; `app/globals.css`'s `html` rule gained
    `font-synthesis: none` beside the existing antialiasing declarations. Verified live: a scientific name
    (`Lasiorhinus latifrons`) now computes `font-style: italic` in the real Barlow family, with `font-synthesis:
    none` confirmed on the same page - a real loaded italic, not a browser-faked slant. `tsc`/`check:contracts`
    clean, zero console errors.
  - **D4, `text-quaternary` contrast - deferred, per direct instruction ("let's make a note and come back to this
    later").** On record for later: `--ui-text-quaternary` is a real, deliberately-used token (gray-500, `#8f8b87`)
    for the lowest-emphasis role (inactive tabs, table headers, eyebrows, footer links) - it's not a fabricated or
    misused class, but it measures 3.4:1 on white, under the 4.5:1 floor for text at 12-14px. The open question is
    whether that specific colour value still holds now that its contrast has been measured, not whether the token
    itself belongs in the system. No change made.
  - Full detail, the decision table and every remaining open item (D3, D6-D12) are in `audit/type-audit-2026-09-29.md`.
    Not committed.