# 2026-10-20 - Stress test top level is called Project

- **Oct 20 2026: Stress test top level is called Project.** Designer, from a screenshot of the tree's top node reading "Adelaide Hills Bushland Survey": "Let's call this top-level 'Project'". That name was a hardcoded stand-in; an upload carries no project name, only a Survey Number (the Project's id), so it implied a project the file never named.
  - **Changed** in `/proto/data-model-stress-test`: `PROJECT_LABEL` is "Project" (Structure tree, the exported JSON's `label`). The Project summary card showed the same word twice (badge and title), so its title is now "Survey <number>" when the upload has a Survey Number and is absent when it has none (§2.12). Header comments updated.
  - **Verified (ran).** `tsc` clean; live on the sample workbook: top row reads "Project", the card shows the badge and nested counts, the JSON starts `"kind": "Project", "label": "Project"`, no "Adelaide Hills" anywhere on the page, no console errors.
  - **Not changed.** `/proto/project-detail` still uses the real project name in its own sample content; this lab no longer borrows it. Not committed.
