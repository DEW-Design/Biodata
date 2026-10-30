# 2026-10-30 - Add Project option 2: the step is "Upload datasets", in the plural

- **Oct 30 2026: the Dataset step of Add Project option 2 is called "Upload datasets", and its group "Datasets".** The designer, with a screenshot of column 2 reading "DATASET / First dataset": "It's not just first dataset it's could be datasets. Upload datasets." A project can be made with more than one dataset, so a name that says "first" is wrong.
  - **What changed (the words only).**

    | Where | Was | Now |
    | --- | --- | --- |
    | Column 2, the step's group | Dataset | Datasets |
    | Column 2 and the page's title | First dataset | Upload datasets |
    | The page's line under the title | Add the first dataset for this project now, or skip this step and add one later. | Add datasets to this project now, or skip this step and add them later. |
    | The primary button with no file | Skip, add a dataset later | Skip, add datasets later |
    | The file row's help | ... add a dataset later from the project's Upload menu | ... add datasets later from the project's Upload menu |
    | The review's card | Dataset | Datasets |
    | The Layout tool's Option 2 | With a dataset step | With dataset upload |

    The comments, the `/pages` index line and the step list that still said "after the data owner" now say "after the geographic extent" (it moved there on the same day, `2026-10-30-07`). The section's id (`dataset`, in the address `?section=dataset`) is code and was not renamed.
  - **Checked.** `npx tsc --noEmit`, `npx eslint` on the folder and `npm run check:contracts` pass. Live (Playwright, zero console errors), as Registered User, BioData Admin and Privileged User: column 2 reads Datasets, then Upload datasets; the page opens as "Upload datasets"; the button reads "Skip, add datasets later" and "Continue" once a file is added; the review's card is "Datasets"; creating a project with a file and without one still lands as before.
  - **Open, for the designer (0.4). The words are plural, the behaviour is not yet.** The step takes one or more files, and the files added together become **one** dataset with one set of answers (licence, classification, First Nations, privacy), as the upload form does: a dataset is an upload of one or more files (the Ramble workbook, a file with several tabs). "Datasets" as several datasets would need a way to add another one, each with its own files and its own answers, and a card for each in the review. Is that what is wanted, or is one dataset of several files enough for now? If it is several, how does a person add the second: an "Add another dataset" under the first, or each file its own dataset?
