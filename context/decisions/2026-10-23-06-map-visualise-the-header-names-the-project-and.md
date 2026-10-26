# 2026-10-23 - Map visualise: the header names the project and dataset

- **Oct 23 2026: Map visualise: the header names the project and dataset.** The designer, on the card's line under its title: "DS-2026-01003 · BD-5137 - looks very AI-generated, can we please fix this. This
  information needs to be presented better."
  - **What was wrong (`dataset-error-map.tsx`):** two ids with a middle dot between them, no labels and no names. A person could not tell which was the dataset and which the project, or what either was; a
    dot-joined string of codes is also the line a generator writes when it has no real presentation for the fact. It is the subject of the whole card (the dataset the errors are in), and it was the quietest line on it.
  - **The fix:** two labelled rows, the record summary's own pattern in this file (a `dl`, label in tertiary, value in primary, 14/400, no new layer, 2.9):
    - **Project** : the project's name, then its code (Flinders Ranges Reptile Atlas, BD-5137).
    - **Dataset** : the file's name, then the dataset id (flinders_bushland_assessment_01.xlsx, DS-2026-01003).
    The name gives way (it truncates, with the full text as its tooltip) and the code never does, as `ResultCard`'s badge does. The "name then code" order is how the report's own project select labels a project
    ("Title (CODE)"). Nothing else in the header moved; the tabs now start 146px down the card at every width (was 122px).
  - **Not done:** the project name is not a link (nothing was asked and a link is a new behaviour, 2.10); the ingested date, which the report's card shows, is not repeated.
  - **Verified, in a browser (Playwright, a script outside the repo):** the card as BioData Admin and Registered User at 1440 x 900, at 1024 x 700 on another dataset (DS-2026-01001, Kangaroo Island Recovery
    Monitoring: the longer file name truncates and its id stays) and at 600 x 800 (the card at 568px wide); every value Barlow 14/400, names `rgb(46, 41, 37)`, codes and labels `rgb(112, 107, 104)`; zero console
    errors; `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** the narrowest card (280px, where the name will be a few letters) and a dataset whose project name is
    longer than a line. Typography QA (0.6 item 8): the two layers used (14/400 in primary and tertiary) are the ones the record summary beside it uses; the skills were run on this card earlier today
    (`2026-10-23-05-*`) and nothing new was introduced. Not committed.
