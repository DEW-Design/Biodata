# 2026-09-22 - BioData Admin IA cross-check.

- **Sept 22 2026: BioData Admin IA cross-check.** Source: the team's "BioData Admin" IA tree (a screenshot supplied by the
  user, plus a review-comment thread listing modules still to include). This is the real admin IA; today's admin experience
  is the registered-user tree plus the DSA work above, so most of it is unreconciled. **Nothing below is built except DSA,**
  logged so the next admin pass starts from the real tree, not from `registeredUserNav`.
  - **The admin tree, as given:** Header (Profile > Profile Settings, Logout) - Home (BioData Overview, BioData Dashboard) -
    Projects (Manage Level 1-4 Project Data; Create Project > Add Project Details, Privacy and Restrictions > Embargo /
    Sensitive Species and Location / Restrict Project Metadata / Request Other Restrictions; Download Project Templates;
    Create / Upload Dataset) - Observations (View Level 1-4 Observation Data; Nominate Sensitive Species) - Data Licencing
    Agreement (DLA) (Approve Reject DLA Requests; Withdraw DLA) - Template Finder (Browse and Download Standard Dataset
    Templates) - User Management (Add Privileged User / Admin; Add Biodata User / Admin; Manage Privileged User Roles; Manage
    Biodata User Roles; Manage Biodata User Permissions; Manage Privileged User Permissions) - Reports (All Users)
    (Application and System Reports; Audit Log Reports) - Ctrl Vocab (Create / Manage Ctrl Vocabs) - Footer (Terms and
    Conditions, Privacy Policy, Help and Documentation).
  - **Modules from the comment thread, not yet in the tree:** Voucher management, Notification management, Taxonomy
    management ("to include"), and DSA (added later; built above). Placement of the first three is undecided: whether each is
    its own top-level section or sits inside another one (Taxonomy and Ctrl Vocab are plausibly neighbours).
  - **Matches what is built:** the Header account menu and the Footer links; the Create Project steps, Download Project
    Templates and Create / Upload Dataset (already `projectActions`); Template Finder; Home's admin content already treats
    "DLA requests" and User Management as approval queues (`AdminHomeDashboardContent`), consistent with DLA staying an admin
    module.
  - **Differs from what is built:**
    - **Access tiers: the admin IA says Level 1-4, this file and the BDBSA research document two (Level 1 public, Level 2
      DLA-licensed).** Either Levels 3-4 are admin-only tiers we never captured or the IA is looser than the data model; needs
      a decision before "Manage Level 1-4 Project Data" or "View Level 1-4 Observation Data" gets a real screen.
    - **Observations vs Explore.** The admin IA has an Observations section with no map-search entry; every role's shell
      currently shows "Explore" (`/pages/observations`). Unclear whether admin's Observations *is* Explore, sits beside it, or
      Explore is not an admin module.
    - **Nominate Sensitive Species sits under Observations** for admin, but is its own top-level section in the registered-user
      tree and every shell's rail.
    - **Home labels.** Admin's Home is BioData Overview / BioData Dashboard; every shell hardcodes "My BioData" / "Flora and
      Fauna Dashboard" for every non-guest role, admin included (the admin *content* differs, the tab labels do not).
    - **Reports.** "Reports (All Users)" with Application and System Reports and Audit Log Reports, against registered-user's
      "Reports (Own Submissions)" with one item.
    - **DLA items.** Approve Reject DLA Requests / Withdraw DLA (admin) against Request New DLA / Manage DLA (registered).
      Restored in `biodataAdminNav` as unscoped items, since neither has a page.
  - **Missing from the codebase entirely:** User Management (6 items; only a disabled quick action exists), Ctrl Vocab, Audit
    Log Reports, and the three unplaced modules above. The Home dashboard's own copy calls the second one "Control Vocal";
    the IA says "Ctrl Vocab".
  - **Next step, not started:** replace `biodataAdminNav` with the real tree above (unscoped sections stay honest
    placeholders), then reconcile Home's tab labels and the Observations / Explore question. Blocked on the decisions listed.
  - **Restructure verification (list -> deep dive):** `tsc` and `eslint` clean; live Playwright pass over the list, all four
    buckets (including the empty Revoked one), row -> deep dive, Back to agreements, edit route, revoke from the deep dive
    (the record's bucket highlight moves, counts update), new -> Save draft -> the new draft's deep dive, and the not-found
    state; **all 5 personas x 4 routes** (list, deep dive, new, edit) each render rail + column 2 + main under a single
    header; the role survives every link. Fixed on the way: `useRoleHref` produced `?status=x?userRole=y` for paths that
    already had a query. Known limit: a restricted persona's column 2 holds only the section label and footer links, so it
    reads sparse; it's the cost of keeping three columns and can be revisited once there's something honest to put there.
