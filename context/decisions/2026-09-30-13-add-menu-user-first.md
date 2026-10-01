# 2026-09-30 - Add menu: User first

- **Sept 30 2026: "User" moved to the top of the header's Add menu, per the designer ("Move user all the way up").** The menu order is the order of `createMenuItems` in `lib/create-menu.ts`, so the `user` entry now comes first, ahead of Project. Nothing else about the menu changed.
  - **Who sees it:** only BioData Admin has a User item (`userManagement`), so the change shows for that role alone. Registered User and Privileged User still see Project, Dataset, Data licence request (DLA) and Sensitive species nomination, opening on Project; BioData Admin sees User, Project, Dataset, DLA, Sensitive species nomination and Data sharing agreement (DSA).
  - **Verified:** `tsc`, `eslint --max-warnings=0` on the file and `npm run check:contracts` pass. Live at 1708x934, zero console errors: the admin's menu reads User first and focuses it on open; picking it opens `/pages/user-management/users/new` with the role kept; the registered-user and privileged-user menus are unchanged. The guest's Add button (which opens the sign-up invite instead of a menu) was not re-tested; it does not read this list.
  - Not committed.
