# 2026-09-28 - consistency pass across the product, per direct request ("do a consistency check across the board and see if something's not making sense").

- **Sept 28 2026: consistency pass across the product, per direct request ("do a consistency check across the board and see if something's not making sense").**
  - **Scope:** out of scope and not audited, by instruction, because a teammate built them: Explore option 1 (`/pages/observations`) and the project page labelled "Option 2" (the `/pages/project-detail/option-3` route, with the `option-2` folder it imports).
  - **Method:** a read-only audit agent checked every other screen against CONTRACTS.md and the patterns logged here and confirmed 25 findings in the code. The clear-cut ones inside our screens were fixed; the rest need a decision.
  - **Fixed:**
    - **Home tasks told untrue stories (`home-dashboard.tsx`).**
      - The DLA task named a Coorong request of Olivia's that does not exist, with a status that is not a DLA status. It now names her real approved request, DLA-2026-00510 (Naracoorte Caves), links to it, and takes its label and colour from `agreementStatusMeta`.
      - The nomination task takes its label and colour from `nominationStatusMeta`.
      - "Continue" on the Flinders Ranges Reptile Atlas draft opened the Adelaide Hills page; it now opens the Flinders project page.
    - **Admin Home's review queues.**
      - DLA requests and nominations said "Coming soon" with made-up counts. They now count the records waiting for a decision (DLA: submitted, under review, on hold; nominations: submitted, under review) from the live stores and link to those lists, filtered, with `scope=all`.
      - The "DLA requests pending" note and the pending total follow the same counts.
      - User access requests stays a "Coming soon" gap, since there is no queue for it yet.
    - **DLA and DSA record pages.**
      - Back returns to the plain list instead of one filtered to the record's status (which also dropped the My/All scope).
      - Status banners wrap instead of truncating (a rejection reason was being cut off) and no longer override the contained padding.
      - Banner titles use the status name: "Rejected", not "Request Rejected" or "Agreement Rejected". "Licence Closed" in warning colour is now "Closed" in gray, matching its badge.
      - Actions and copy are in sentence case: Start review, Resume review, Put on hold, Renew licence, Approve request.
      - The not-found copy no longer says records vanish on reload (they persist now); it says the record may have been deleted or created in another browser.
    - **Status names in sentence case:** "Under review" and "On hold" in `agreementStatusMeta` and `nominationStatusMeta` (badges show uppercase, so this shows in banners, filters, toasts and exports), matching the projects' "Under review".
    - **CSV exports** write the status name, not the plural tab label ("Draft", not "Drafts").
    - **Data:**
      - The "John Doe" DLA requestor is now Phoenix Baker, who already represents the South Australian Museum in DSA data.
      - The invented "Baker Environmental Consulting" is now the South Australian Museum.
      - "SA Museum" is now "South Australian Museum", and "Natural Resources Kangaroo Island" is now "Natural Resources KI", as in the project data. Filters no longer list one body twice.
    - **Landing page:**
      - The hero search and every Explore link went to the Projects list and dropped what was typed. They now open Explore (`/pages/observations`), with the search term as `?q=`.
      - "Login" is now "Log in", as in the shared header.
    - **Dashes in the UI:**
      - New `hasEndDate` and `hasScientificName` helpers in `search-data.ts`.
      - Explore option 2's Events cards read "From <date>" instead of "<date> to —".
      - Observation cards and the summary card no longer show "-" as a species name.
      - The generated record page no longer treats "—" as a scientific name.
      - The summary card's "Started" is now "Start date".
    - **The project switcher** (Adelaide Hills page, `observation-detail`) listed three projects as inert grey text. It is built from the Projects list now, and every project opens its own page.
  - **Verified live at 1708x1024:**
    - Registered Home's task links; admin Home's "3 DLA requests pending" and its filtered links.
    - The DLA record's back link, banner title, "Start review" and not-found copy.
    - The landing page's "Log in", and a search for "emu" opening Explore with `q=emu`.
    - All four projects in the switcher.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` on touched files, `npm run check:contracts` and the Pages build pass. The contract check caught a new em dash in the helpers, fixed with an escape.
  - **Needs a decision (not changed):**
    1. The Adelaide Hills page and the "Option 2" layout show different facts for the same project (start date, Olivia's organisation).
    2. The Adelaide Hills records tree uses codes that belong to other projects, and its three kinds of record click open three different experiences.
    3. DLA has no ownership rule:
       - any registered user can see "All requests", including others' drafts;
       - they can edit or cancel someone else's request;
       - Export CSV exports everything.
       Nominations already limit this. This changes a persona's access, so it waits for a decision (CONTRACTS 0.4).
    4. The DLA form makes a registered individual type their own name and require an organisation. "My requests" matches on that typed name.
    5. The DLA Level 3 project list offers draft and under-review projects and misses the published ones that hold restricted records. Also, "Level 2" means standard in DLA but sensitive in Explore.
    6. Record page sections show "-" for empty fields. They come from `record-detail.tsx`, which Explore option 1 also uses.
    7. Dates appear in four formats. Kangaroo Island is "Completed" but its end date reads "Ongoing".
    8. Project status colour and component differ: Badge vs BadgeWithDot, and "Completed" is blue in one place and gray in another.
    9. Olivia Wyatt has four different organisations across screens.
    10. "John"/"Doe" field placeholders in Add Project; option 1 is not to be touched.
    11. One concept has three names: "Artefacts & Attachments", "Artefacts", "Attached Resources".
    12. Title case vs sentence case for field labels site-wide (many labels copy Figma's names).
    13. The landing page says both "1,500+ Active Projects" and "1,487 projects, 1,120 active" (Figma copy).
  - Not committed.