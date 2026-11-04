# 2026-11-02 - Site scores lab: total row on the attribute tables

- **Nov 2 2026: Site scores lab: total row on the attribute tables.** The designer, with a screenshot of the vegetation condition breakdown:
  "make the table show the total in the bottom with a highlighted row."
  - **Built:** `LinesTable` (`app/proto/site-scores/breakdowns.tsx`) takes a `total` and draws it as its last row, so the vegetation condition and
    conservation significance tables both have it: "Vegetation condition score, 25.01" and "Conservation significance score, 1.00". The figure
    lines up with the rows' scores, because the row keeps the space of their hover pencil. The row is the result, so it opens no field; the rows
    above still open theirs.
  - **Label:** the score's own name, not "Total". The rows do not add up to the score (8.0 + 1.5 + 14.0 + 9.0 + 3.0 is 36.5, the score is 25.01):
    the score comes from the sums under the table, so a row called Total would say something false.
  - **Type and colour:** `font-medium text-primary tabular-nums`, as the Landscape context editor's calculated score
    (`landscape-editor.tsx`), on `bg-brand-primary` (brand-50). The app has no total row to borrow, so the fill is a first use in a table.
  - **Found:** `bg-brand-primary_alt` has no utility in `app/globals.css`, so the "highlighted" rows in `app/pages/projects/page.tsx` draw no fill. Not
    changed here.
  - **Open, for the designer:** (1) 25.01 now shows four times in view: the site's scores at the top, the section's Score row, this row and the last
    sum (4.3). Removing the section's Score row is the smallest cut; (2) a section with no attributes provided has no table, so no total row, and its
    Score row is then what shows the score.
  - Verified: tsc and eslint clean on the touched file, `check:contracts` OK. Live in Chrome at 1512 x 787, the default Public user view: the fill
    resolves to rgb(237, 247, 249), the label and figure are Barlow 14px, weight 500, the figures tabular and at one right edge in both tables, no
    sideways overflow, zero console errors after a reload. A click on the total row opens nothing and a click on Weeds opens the edit view focused on
    Weed 1. Keyboard not tested on the row. The popover and modal options were not opened. `/emil-typography` and `/emil-design-foundations` applied
    to the row. Not committed.
- **Nov 2 2026 (continued): "Total" in the label; the Score rows and the notes removed.** The designer's page feedback on `/proto/site-scores`.
  - The rows now read "Total vegetation condition score" and "Total conservation significance score". The designer named them, so this replaces the
    earlier reason for avoiding "Total". Sentence case, as "Total biodiversity score" at the top of the same page.
  - The section's Score row is gone from both sections on the inline option (`ScoreView`). The popover and modal options keep it, because their "How
    it's worked out" link sits in that row. A section with no attributes provided has no table, and its last sum still gives the score, so open item
    (2) above closes.
  - The notes under the two breakdowns are gone: "Tree attributes are not scored..." and "Every site scores at least 1...". They went from the popover
    and modal too, since the breakdown is shared. The note under the site's scores at the top was not named and stays.
  - **Open, for the designer:** (1) the same feedback item selected the "Location method: show notes" button with the tree note. It is a field's notes
    control in Location information, nothing to do with the note, so it was left alone until the designer confirms; (2) with the tree note gone, nothing
    on the view says why a treeless site's sum has "x 1.29" in it.
  - Verified: tsc and eslint clean, `check:contracts` OK. Live in Chrome: no Score row in either section, both labels read as above, neither note is on
    the page, zero console errors. Popover and modal options not opened. Not committed.
