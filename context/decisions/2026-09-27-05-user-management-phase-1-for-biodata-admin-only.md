# 2026-09-27 - User Management, phase 1, for BioData Admin only (`/pages/user-management`), fitted from the Master Flows lo-fi

- **Sept 27 2026: User Management, phase 1, for BioData Admin only (`/pages/user-management`), fitted from the Master Flows lo-fi** (Figma `YMproGZfrFB5jUqPHPxMhk`, node `1558-10575`) into the shared shell. The wireframe fixed content and flow; its chrome was not copied (CONTRACTS 2.5). A 10-point plan was agreed with the designer before building, and anything outside it waits for approval.
  - **Designer decisions:**
    1. The wireframe's TPA API Admin / TPA API User are Privileged Admin / Privileged User. Logged for later, not modelled separately.
    2. The wireframe's permission set is taken as accurate: 10 categories × 4 permissions.
    3. Everything is display-only: nothing here changes what a persona can see (`config/role-access.config.ts` is untouched apart from the new gate).
    4. Made-up people and organisations in the South Australian realm are allowed. This is a named **override of CONTRACTS 0.3** for this feature only. The organisations are Eyre Peninsula Wildlife Survey, Fleurieu Coast Landcare, Flinders Ranges Ecology Group and Murray Mallee Field Naturalists, alongside DEW.
    5. Lifecycles: users go Invited, Active, Inactive, Archived. Roles and permissions go Scheduled, Active, Disabled, Archived; Scheduled becomes Active on its start date, applied when read.
    6. The wireframe's user "Role" text field is renamed **Position** (a job title), so "role" means one thing only: roles are assigned in the Roles section. This was my recommendation; the designer left the question blank.
    7. Audit log is out of scope. There is no View Logs.
    8. "User" is added to the header Add menu (`lib/create-menu.ts`, gated by `userManagement`).
    9. There is one Users area plus a User type filter, as in the wireframe.
    10. "Privileged admin manages an organisation, BioData Admin manages DEW." Only `biodata-admin` has access now (`userManagement: []`). **Next step, not built:** Privileged Admin managing their own organisation's users.
  - **Built:**
    - Column 2 switches between Users, Roles and Permissions (vertical `Tabs`, with counts) and has the Actions group (Export CSV).
    - Each area is a list following the collection contract: `SectionHeader` with `CountBadge`, search, `ListFilterButton`, sortable columns, a table that fits the viewport, numbered pagination and rows that link.
    - Each record has its own page with the gradient identity card and tabs:
      - A user's page shows their roles and the selected role's permissions.
      - A role's page shows its permissions and its users.
      - A permission's page shows the roles that have it.
    - Status actions each go through a confirm modal: Deactivate/Reactivate, Archive, Disable/Enable, Activate a scheduled item.
    - Three create routes:
      - Add user uses `FormPage` with sections in column 2 (details, organisation, roles). At least one role is required, and the permissions shown are the union of the chosen roles. A new user starts Invited.
      - Add role.
      - Add permissions: several at once under an existing or new category.
    - State is one zustand store persisted to localStorage (`biodata-user-management`). Detail routes list seed ids plus the next 50 for the static export.
    - Files: `app/pages/_shared/user-management/*`, `app/pages/user-management/**`.
  - **Persona fix:** the wireframe's DEW Data Admin was "Olivia", but the admin Home greets **Jane**. The admin is now Jane Harlow; Olivia Wyatt stays the registered individual.
  - **Not built, from the wireframe:** a user in more than one organisation ("+ Add Organisation/Institution"; one organisation per user for now).
  - **Phase 2, waiting for approval:** the "Manage" editors (edit a user's roles, a role's permissions, a permission's details, access dates).
  - **Fixed along the way: a regression from the zustand change on Sept 27.** A record created in the browser flashed "not found" for a frame on a direct load, because the store reads localStorage after the first render. `useHydrated` (`zustand-persist.ts`) plus `useDsasHydrated`/`useDlasHydrated`/`useUmHydrated` now make the DSA and DLA detail and edit routes and the three UM detail routes render nothing until the store has loaded. A record that really doesn't exist still shows not found.
  - **Seen, not changed (pre-existing):**
    - The header avatar reads "OW" for every signed-in persona, including Jane.
    - The custom date picker shows MM/DD in en-US browsers.
    - `text-md` in the shared tabs.
  - **Verified:**
    - `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. The real Pages build (`PAGES_BASE_PATH=/Biodata next build`) passes.
    - Live Playwright pass as admin: the list fits the viewport; filter and sort work; Deactivate/Reactivate persist across reload; the add user, role and permission flows all work.
    - Live pass as registered user: restricted message and no rail item.
    - The Add menu shows User, and the Home quick action link carries the role.
    - No flash on a direct load of a browser-only user or DSA.
    - Zero console errors throughout.
    - Playwright was installed for the session and removed; `package.json` differs from HEAD only by `zustand`.
  - Not committed.