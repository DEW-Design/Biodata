# 2026-10-19 - Post-6-oct lab: the bell's unread badge is production's count badge

- **Oct 19 2026: Post-6-oct lab: the bell's unread badge is production's count badge.** The designer, on a screenshot of the lab's rail (the account row with the bell, then Workspace, Work and Admin):
  "inconsistent with production. Please look into this, and fix it correctly." The screenshot has no mark on it, so what was inconsistent was read from it, not told; the reading is below.
  - **What was inconsistent (`NotificationsBell`, `notifications-popover.tsx`):** the unread mark on the bell was an 8px dot with `ring-2 ring-bg-primary`. `ring-bg-primary` is not defined anywhere in
    `app/globals.css` (there is no `--color-bg-primary` and no `@utility ring-bg-primary`; the ring utilities are `ring-primary`, `ring-brand` and so on), so the ring took Tailwind's default, the
    element's own text colour: measured in the browser, `box-shadow: rgb(112, 107, 104) 0 0 0 2px`, the bell's grey. The dot read as a red blob with a dark outline. Production's mark for the same
    job (a count on an icon: Home's task count in `PrimaryRail`, `primary-rail.tsx`) is a 16px error-red circle with 10px semibold white figures and no ring (measured: 16 by 16, 10px, 600,
    `rgb(217, 45, 32)`, `box-shadow: none`).
  - **The fix:** the bell carries production's badge, its classes copied from `primary-rail.tsx` (CONTRACTS 0.9, 2.9 item 2: the sibling that plays the same role, copied exactly):
    `absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white`, holding the unread count. The bell now says how
    many, as production's Home does, where the dot only said some. Over 9 it reads "9+" (production's has no cap; the badge is 16px, and it was not built to hold two figures). Re-measured after the
    change: 16 by 16, 10px, 600, the same red, no shadow, 4px outside the button at the top and right as in production; the badge clears the bell's glyph, and the collapsed column's bell, the one other
    place it is drawn, looks the same. The button's accessible name already carried the count ("Notifications, 6 unread") and is unchanged.
  - **Not changed, same class, production files (asked first, CONTRACTS 0.4):** `ring-bg-primary` is also in `app/pages/project-detail/project-tab.tsx` (the species photo stack, line 398) and in the
    design system's `avatar-online-indicator.tsx` and `avatar-company-icon.tsx`, so the avatar's status dot and company icon have the same dark ring in production. The fix there is a token
    decision (a ring colour that is the surface's, for example a `ring-bg-primary` utility defined in `globals.css`, which would correct all four at once), so it is the designer's to choose. If it
    is chosen, `ring-bg-primary` belongs on the known-dead list of `AUTO §2.1a` the same day (0.8).
  - **Other differences from production seen in the same screenshot, left as they are because the designer chose them (nothing was changed for these):** the account row shows a 24px avatar and the
    name where production's header shows a 40px avatar and a chevron only (the name and the bell at its right, 19 Oct 2026, `-30-` to `-32-`); the DLA and DSA names are written without their acronyms
    (12 Oct 2026); the rail groups the sections under Workspace, Work and Admin where production's rail lists them in one column in the nav tree's order (13 Oct 2026, the step 1 lock). If the
    inconsistency meant one of these and not the badge, say which and it is the next change.
  - **Verified, in a browser this time (Playwright with the cached Chromium, a script kept outside the repo):** the lab as the Super Admin and as the Registered User served, zero console errors; the
    screenshot of the rail was reproduced and the ring measured; production's rail badge was screenshotted and measured beside it; the lab's badge was re-measured and looked at, expanded and
    collapsed. `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** the "9+" form (the lab's inboxes hold 5 and 6, so it was not on screen; it is a
    string in a 16px circle, measured by eye only in the code), a two-figure count in production's own badge (not changed), and the keyboard path (no behaviour changed). Typography QA (0.6 item 8):
    no new type layer; the 10px semibold is production's own, copied from `primary-rail.tsx`, and `/emil-typography` and `/emil-design-foundations` were not run. Not committed.
