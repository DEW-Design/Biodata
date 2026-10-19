# 2026-10-19 - Merge mohan-wips 5d303ad: Add Project option 1, Pre-fill sample content, empty project records

- **Oct 19 2026: Merge mohan-wips 5d303ad: Add Project option 1, Pre-fill sample content, empty project records.** The designer asked
  for the Prototype tools fab updates on `origin/mohan-wips` to be brought in, and then, because the Pre-fill sample content switch
  only appears on a form that uses it (Add Project), for the Add Project side too. `origin/mohan-wips` (one commit, 5d303ad,
  "Add Project form is option 1, sample content tool, empty project records", 19 Oct) was merged into
  `saimaniganahalli1/layout-info-banner-review` under CONTRACTS 5.6: the incoming branch was read, not changed, and nothing of ours
  was replaced. The merge-base was 1e34739, so the merge brought in only that commit.
  - **What came in:** the Prototype tools "Pre-fill sample content" switch (`app/_prototype-tools/sample-content.ts`, the
    `ToggleButton` chip in `status-bar.tsx`, `kind` and the bar order in `tools.ts`); Add Project becomes option 1 (the form pattern,
    sections in column 2) and the one-question-per-card form becomes option 2, with `option-2/version-2` removed; the
    role-in-project vocabulary (Project Manager is a role, not a tick); `project-registration/sample-content.ts`; a new project
    opens on an empty project (`ListEmptyState` children, `ActionsMenu` trigger and heading, `records-explorer`); the forms pattern
    page, the screen index, and CONTRACTS 4.1 and its generated rule file `contracts-shell.md` (naming Add Project, and Add Project
    option 2 as the exempt one).
  - **Conflicts:** only the generated `context/decisions/INDEX.md`, rebuilt from the files (`npm run context:index`), not merged by
    hand. `CONTRACTS.md` merged without conflict; every `###` clause heading is identical before and after (nothing added, removed or
    renumbered), and `npm run contracts:rules` produced no change beyond the merged `contracts-shell.md`.
  - **Renumbered (5.6 item 4):** both branches had used `2026-10-16-01` and `2026-10-16-02`. Ours keep their numbers; the incoming
    files were renamed, content unchanged: `2026-10-16-01-add-project-form-becomes-option-1-version-1.md` to
    `2026-10-16-07-add-project-form-becomes-option-1-version-1.md`, and `2026-10-16-02-a-new-project-opens-on-an-empty-project.md`
    to `2026-10-16-08-a-new-project-opens-on-an-empty-project.md`. No file referenced the old names.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on every added or changed `.ts` and `.tsx` file in the merge, and
    `npm run check:contracts` (which failed on the two numbering clashes above before the renames, and passes after). The three
    changed pages (Add Project option 1, option 2 and a project page) return 200 from the dev server.
  - **Not verified:** a live browser pass of the switch and of the empty project records. No browser tool could reach the local
    dev server in this session. Sibling grep for `option-2/version-2` and `project-registration/option-2`: every remaining
    reference is a file import that still resolves.
  - **Open:** the route that was "Add Project, option 2 version 2" is gone, so any bookmark or stakeholder link to
    `/pages/project-registration/option-2/version-2` now 404s, and the same URLs show the other form than before (`/pages/project-registration`
    is now the form pattern, `/option-2` the one-question-per-card form). Not pushed.
