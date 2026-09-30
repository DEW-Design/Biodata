# 2026-09-21 - `public-user` is the app-wide default persona (per direct instruction: "keep public-user selected

- **Sept 21 2026: `public-user` is the app-wide default persona (per direct instruction: "keep public-user selected
  across our webapp, this is the starting point").** `DEFAULT_USER_ROLE` in `lib/user-role.ts` changed from
  `registered-user` to `public-user`, so any page opened without `?userRole=` (or with an unrecognised value) renders
  the signed-out visitor's view, and every in-app link built with `useRoleHref` carries `public-user` forward. Every
  other persona is reached by an explicit `?userRole=` or the `RoleSwitcher` FAB. `/pages/biodata-home` keeps its
  explicit `?userRole=public-user` on its links so the URL always states the persona. Anything that used to rely on
  landing as `registered-user` by default (a bookmarked bare URL, a screenshot walk-through) now needs
  `?userRole=registered-user`.