# 2026-10-23 - Map visualise: four ways to name the dataset, compared on the tools bar

- **Oct 23 2026: Map visualise: four ways to name the dataset, compared on the tools bar.** The designer, on a screenshot of the labelled Project and Dataset rows (`2026-10-23-06-*`): "Okay good progress, any
  better way to show this now?" A choice between ways of drawing the same two facts, so they are built side by side behind a "Card header" tool on the Prototype tools bar (CONTRACTS 3.8, 4.4: the others are deleted when
  one is chosen), as Upload result is on the project page. Every option is made of layers the card already has (16/600, 14/500, 14/400, the record summary's 12/600 uppercase eyebrow, 12/400 and the tertiary grey), with
  no ids on their own joined by a dot and no new type layer (2.9).
  - **The options (`CardHeader`, `dataset-error-map.tsx`):**
    - **Two names, ids in a column** (the default, my recommendation): "Map visualise" stays the title; under it the project's name (14/500, primary) over the file's name (14/400, tertiary), and the two ids right-aligned in a
      column so their edges line up. No labels: a name and a file with an extension need none (2.12). 94px of header.
    - **Labelled rows** (what the designer's screenshot shows): Project and Dataset, each name followed by its id. 96px.
    - **The file is the title:** the file's name as the card's title (16/600), "Map visualise" a small uppercase heading above it with the dataset id at the right, the project and its code under the title. 86px.
    - **One line, project then file:** a trail with a chevron icon between the names, the ids in their tooltips. 70px.
  - **What the measuring said:** the one-line trail truncates both names at the card's 440px on every dataset tried (it is the option with no room), and hides the ids; labelled rows truncate the longer file name
    (Kangaroo Island, kangaroo_island_bushland_assessment_02.xlsx); the two-names option and the file-as-title option truncated nothing on either dataset (Flinders, Kangaroo Island) at 440px. The trail is the one
    that is not worth keeping. The tabs start at 144, 146, 136 and 120px down the card respectively.
  - **Why the recommendation:** it is the only one with a hierarchy and no labels or caps: the project outranks the file by weight, as a list row's title outranks its support line, and the ids become a reference column
    instead of a string. The file-as-title option is the stronger statement that the card is about one file, at the cost of the small uppercase heading (the eyebrow the record pages use, which also reads as a stock
    header); it is the alternative to look at.
  - **Open:** which to keep (the other three, the tool and its state are then deleted; nothing outside this file carries them); and the older question of how loud the severity badges and the tabs are. Not committed.
  - **Verified, in a browser (Playwright, a script outside the repo):** the tool is on the bar on the dataset view and not elsewhere; each of the four options chosen from the bar on two datasets as BioData Admin
    at 1440 x 900: header height, tab position, which lines truncate and no horizontal overflow measured; the header of each looked at; zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and
    `npm run check:contracts` clean. **Not verified:** the options at 280px wide, for the Registered User (the same component, the role changes no text), and by keyboard on the tool's menu (the bar's own component).
    Typography QA (0.6 item 8): no layer was added; each text is one the card already uses, as measured in `2026-10-23-05-*`. Not committed.
