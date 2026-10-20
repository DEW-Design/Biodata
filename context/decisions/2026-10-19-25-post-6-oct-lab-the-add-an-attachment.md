# 2026-10-19 - Post-6-oct lab: the Add an attachment form holds a list, with each attachment removable

- **Oct 19 2026: Post-6-oct lab: the Add an attachment form holds a list, with each attachment removable.** The designer, on a screenshot of the form
  (`2026-10-19-09-*`, `-10-*`) with one file chosen, its name cut beside a "Choose another file" button and a File / Link radio above: "needs to have an
  attachment subgrid - with the ability to remove attachments. This looks like an anti-pattern." This replaces the single-attachment part of the form.
  - **What was wrong:** the form held exactly one attachment, shown as a truncated name next to a button whose label ("Choose another file") meant
    "replace this one": nothing to see what was about to be added, nothing to remove, no way to add a second without a second trip through the form,
    and a radio to choose a file or a link that hid the other. The same field commonly holds a few files and a link.
  - **The form now (`add-artefact-modal.tsx`):** "Attach to" and "Field" as before; then **Attachments (n)** with two buttons, "Add files" (a picker that
    takes several at once, the same accepted types as the field menu) and "Add a link" (an inline form for an address and an optional title, with the
    same address check as the field's link composer, closing on Add link or Cancel). Each file or link becomes a **row of a table**: its icon and name,
    its type as the tab's badge, its size ("Not provided" for a link, as the tab shows an empty value), and a trash button that removes that row
    (`ButtonUtility`, labelled "Remove <name>", tooltip "Remove"). The table is the Artefacts and attachments tab's own (the `TableCard` and `Table`, the
    same icon, badge colour and type wording, `artefactTypeMeta`), at its smallest size, scrolling inside a box of 14rem so a long list does not push
    the buttons off. Until something is added there is a dashed line of text that says so and that rows can be removed before Add. The radio is gone.
  - **Saving:** nothing is saved until Add, which now reads "Add 3 attachments" for more than one. Links are written first, on the field's notes as they
    are now; the files are then attached through the store, which reads what is there, so neither drops the other (writing a link replaces the field's
    notes, which would have lost files attached a moment earlier). The toast says "3 attachments added" and where; the Artefacts and attachments tab
    opens, as before. Pressing Add with nothing in the list says "Add at least one file or link", after the first attempt only (4.1 item 4).
    A file of a type the field menu would refuse is left out with the same message, and the others are kept.
  - **Borrowed, not built (0.9):** the tab's table, the field menu's file types and link check, the Add menu's names for a record; no new component.
  - **Open:** (1) a file or link is not checked for being added twice; (2) the same file picked again is a second row; (3) the table has no sticky
    header (at most about five rows show at a time); (4) a file's real contents are not read (the product keeps metadata only); (5) dragging files onto the
    form is the next step of this pattern and was not added.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a live pass (choosing several
    files, a refused type, a link added and one refused, removing a row, the table in the 480px modal, Add with one and with many, the toast and the
    tab with every row on the field, no files lost when links and files are added together), because no browser tool was available. Typography QA
    (0.6 item 8) not run: the new text is the Attachments label (the form labels' weight and colour), the empty line, the hints and the button names.
    Not committed.
