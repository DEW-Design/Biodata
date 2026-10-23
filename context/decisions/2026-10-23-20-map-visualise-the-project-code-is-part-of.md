# 2026-10-23 - Map visualise: the project code is part of the project name

- **Oct 23 2026: Map visualise: the project code is part of the project name.** The designer, as page feedback on the card header's "BD-5137": "Why can't this be part of the project name itself?" Through `/refine-prompt`
  (the terms: Hierarchy, "the ranking of elements by importance"; Hit area, "the region that responds to a tap or click"). Assumed: "part of the name itself" is one label at one weight, `Name (CODE)`, not the code
  in a quieter tone inside the button.
  - **Why it was separate:** the project line was the Folder icon, the name in the switcher's button (14/500), then the code as a 12px grey span outside the button. So the code was a lower rung of the hierarchy than
    the name beside it, pointing at it did nothing, and the hover and open tint stopped at the name.
  - **Built:** the label is now "Flinders Ranges Reptile Atlas (BD-5137)", as the Data Validation Error Report writes a project and its code (`${projectTitle} (${projectCode})`, 0.9), at the line's own 14/500 primary
    (measured: both words and the code 14px/500 `rgb(46, 41, 37)` Barlow; a 12px layer is gone, 2.9). It is inside the switcher's button, so the tint (`rgb(248, 248, 247)` on hover, darker while open) and the click
    cover the code, and the popup rows are unchanged (name, then the code as their `addon`). No code is left outside the button.
  - **How it is cut:** the code is never cut. `FittedText` gained an optional `tail` (text that ends the string and is kept whole; the text is cut to what is left of the room after it), and `BreadcrumbSwitcher` an
    optional `suffix` that passes it. At 280px the name is cut by words and the code stays beside the ellipsis, "Flinders Ranges… (BD-5137)", the full "Flinders Ranges Reptile Atlas (BD-5137)" being the tooltip.
    A first version drew the code as a separate span after the label, which left it at the far right of the box, away from the cut name; putting it in the fitted string is what keeps it next to the text. The
    `"name"` strategy was not used: it treats the `-` of `BD-5137` as a separator and would cut inside the code. The file name, the row titles and every other caller are unchanged (the defaults are the old
    behaviour: no `tail`, no `suffix`; the other eight users of the switcher were not touched).
  - **Checked (Playwright, a script outside the repo):** at 440, 340 and 280px the drawn text, the full text, the tooltip and the box; hover, Enter to open, the dim while open, Escape to close; the file switcher and
    the row titles unchanged; zero console errors; `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean. **Not verified:** the plain form (one project with errors, so no switcher; it
    is the same `FittedText` with the same `tail`, and no current data reaches it), touch, a screen reader (the button's accessible name is still "Switch project", as before).
  - **Open:** (1) whether the code should stay quieter (the grey 12px it had) inside the button; it was folded into the name's own style because the feedback asked for it to be part of the name, and a tone
    difference inside one label would keep it feeling separate; (2) the same pairing in other places that show a project's name and its code apart. Not committed.
