# 2026-10-01 - Project explainer walkthrough parked and removed from the Projects list

- **Oct 1 2026: Project explainer walkthrough parked and removed from the Projects list.** The designer saw the
  walkthrough modal for "What is a project?" (step 3, "Visit") and said the walkthroughs "look so ugly" and were
  "super unhelpful": park it, remove it from the view, document it as pending.
  - **Changed.** `project-list-content.tsx` no longer opens the walkthrough on load and has no help button in the
    section header; the Projects list is back to header, toolbar, table. `walkthrough-modal.tsx` stays in the repo,
    dormant, with a header comment saying it is parked and used by no screen. `showsProjectsGuide` was renamed
    `showsProjectExplainer` in `config/role-access.config.ts` and marked parked. The walkthrough section is gone from
    `/patterns/banners`; `CONTRACTS.md` 3.10 and the nav and README wording say a longer explanation has no home yet.
  - **Kept.** `ExplainerCard` (Nominations still uses it) and the shared `_shared/record-icons.ts`.
  - **Pending, in the backlog of `.claude/rules/ref-shell.md`:** where a first-time "what is a project?" belongs at
    all (guides link, empty state, Add project flow, Home) and what a walkthrough should look like if one returns,
    with the full drafted copy kept there; the Nominations card takes about 140px and raises the same question;
    which treatment the underline tabs take for icons (A text only, B every tab, C selected only; lab
    `/proto/tab-icons`; recommended B, Explore's 400px card the open exception); which direction the Data Ingestion
    Report's filter takes (lab `/proto/filter-options`).
  - **Also found.** A hydration warning on `/patterns/banners` (the banner demo's trailing icon missing from the server
    HTML) came from a stale compiled module in the dev server, not from the code: a restart cleared it, and the
    five affected screens plus both Explore roles load with no console errors. Not a code change.
  - **Verified:** the parked screens (three roles on Projects, Nominations, the docs page) show no dialog, help button
    or card where removed, and load with zero console errors in a live browser. Not committed.
