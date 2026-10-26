# 2026-10-23 - Map visualise: text is cut by role, so the part that tells things apart stays

- **Oct 23 2026: Map visualise: text is cut by role, so the part that tells things apart stays.** The designer, with a screenshot of a truncation demo (file names cut in the middle so the extension and version stay,
  a title cut after a word, against a plain clip), whose text reads "A name truncated mid-character is worse than one cut at a word boundary. Titles, labels, and descriptions each need their own truncation
  logic": "truncation strategy -- can we please apply this principle as well."
  - **What failed (measured, the card made 280px wide, the Kangaroo Island dataset):** CSS cuts only at a character and only at the end. The file name became "kangaroo_island_bus...", losing the extension and the
    `_02` that tells it from `_01` and `_03` of the same project (datasets of one project differ at the end); the project name was cut at a space only by luck; and the row titles were cut mid-word
    ("207 km from its clus...", "511 km outside the proj...") so the number was there and the meaning was not. At 340px the file name was already cut.
  - **Built: `FittedText` (`app/pages/_shared/fitted-text.tsx`), two strategies by role:**
    - **words** (titles, labels, descriptions): cut after the last whole word that fits, then the ellipsis character. A first word wider than the room is left to the CSS ellipsis, which cuts it at a character.
    - **name** (file names): keep the end, the last segment and the extension, and cut the middle at a separator: `kangaroo_island_bushland…_02.xlsx` at 340px, `kangaroo…_02.xlsx` at 280px; where no separator
      fits, the head is cut at a character.
    The cut text is drawn over an invisible copy of the whole text, which is what asks for the room and what a screen reader reads, so the box is given the width the whole text would take, shrinks when the row
    cannot give it, and the accessible name is always the full text. While cut, the full text is the tooltip. The room is measured (the text's own font on a canvas, against the element's fractional width,
    again on resize and when the fonts load), not guessed, and it is untouched when everything fits.
  - **Where it is used:** the card header's file name (name), project name (words), in the plain and the switcher forms (`BreadcrumbSwitcher`'s `truncate` is now `boolean | "words" | "name"`; nothing that set it
    before did); and all three lines of a `ResultCard` row (words), so Explore's own list takes it too (flow-through, 1.3: Explore's row measured before and after, the same 14/500 over 12/400 greys).
  - **Measured after:** 440px, nothing is cut and nothing has a tooltip (same as before); 340px, the file name is "kangaroo_island…_02.xlsx" with its full name as the tooltip, the project name whole; 280px, the project
    name "Kangaroo Island Recovery…", the file "kangaroo…_02.xlsx", the titles "207 km from its…", "511 km outside the…", each with the full text as its tooltip; widening the card back restores every full text.
    Show more, the chunk headings, the tab scroll, the swap and the keyboard path were re-run and unchanged.
  - **Two faults found by measuring and fixed before this was called done:** the first version compared the text with `clientWidth`, which is a whole number, so a name 0.2px wider than its box was cut with room to
    spare (the project name and file name were cut at the normal 440px); it now compares fractional widths with half a pixel of tolerance, and a pixel of margin on a candidate cut. And the drawn text inherited a button's
    centred alignment, so a cut file name sat indented under the project; it is left-aligned.
  - **Not covered, and why:** the switcher popup's own rows (the design system `Select` item cuts its labels itself, 384px wide, and no file name reaches it at that width); the header's trail (the shared
    `AppHeader`); the record summary card, whose description wraps, not cuts; the tooltip is for a pointer, and touch has the summary card and the popup for the full text. Selecting or copying takes the whole text (the drawn
    cut copy is not selectable). Not documented on a patterns page: it is a rule of this panel and the shared row so far; say if it should be one.
  - **Open:** (1) whether the rest of the app's file names (the datasets list, the ingestion report) should take the `name` strategy: they were not touched; (2) `FittedText` is a shared piece under
    `app/pages/_shared`, not `components/`, so 1.4 (a new design-system component) was not triggered; say if it should be treated as one. Not committed.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the four files and `npm run check:contracts` clean; zero console errors; in a browser as BioData Admin at 1440 x 900 with the card narrowed to 440, 340 and 280px
    on the Kangaroo Island dataset. **Not verified:** touch, right-to-left text, a name with no separator and no extension (it falls to the character cut), and the Registered User (the same component). Typography QA (0.6
    item 8): no size, weight, colour or family was added; the ellipsis is the character, not three dots (2.3's typography and the emil check).
