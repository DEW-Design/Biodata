# 2026-10-19 - Post-6-oct lab: the project bar's plus gets Add an artefact and attachment, assigned to an event, occurrence or observation

- **Oct 19 2026: Post-6-oct lab: the project bar's plus gets Add an artefact and attachment, assigned to an event, occurrence or
  observation.** The designer, on the "+" menu (Upload a dataset, a divider, Add an event, Add an occurrence, Add an observation): "one
  more option to add an artefact and attachment ... current state, divider, add an artefact and attachment", then "could be linked back
  to an event, occurrence or observation, a way to assign it back".
  - **The menu:** a second divider and "Add an artefact and attachment" (the paperclip, the icon the Artefacts and attachments tab
    already has) after the three Add items. A signed out visitor gets the sign-up prompt ("Sign up to add artefacts and attachments",
    new copy in the pattern of the existing ones).
  - **Why a form:** in the product an artefact or attachment belongs to one field of one record, never to the project as a whole
    (`field-notes-store.ts`), and is added from that field's own menu; the Artefacts and attachments tab only lists them. From the bar
    there is no field to start from, so three options were put (a form; jump to the record tree; a project-level file outside the field
    model, which would be a new idea in the product) and the designer's answer, assigning it to an event, occurrence or observation,
    is the first: a form.
  - **The form (`add-artefact-modal.tsx`):** "Add an artefact and attachment", built from parts, no new component (`FormModal`,
    `Select.ComboBox`, `RadioGroup`, `Input`, `Button`; the pick-one-first modal is the same shape as `ChooseProjectModal`). It asks
    **Attach to** (any event, occurrence or observation of the project, searchable, each with its type and code), then **Field** (the
    fields of that record that take notes, in the order the record shows them, each with its section; off until a record is chosen and
    cleared when the record changes), then **A file or a link**. A file is chosen with the same picker, accepted types and file kinds as
    the field menu (`kindForFile`); a link is an address starting https:// and an optional title, the same check as the field's link
    composer. It saves exactly as the field menu does (`fieldNotesActions`), so the item is on that record's field and in the tab at once;
    a toast says where it went and the Artefacts and attachments tab opens. Nothing is saved until the required parts are filled; the
    hints appear only after Add is pressed (4.1 item 4), not while a person is still on the first answer.
  - **Product file, opt-in only (1.6):** `ActionsMenu` gains `trailing` (items after the record types, set apart by a divider), beside
    the `extra` and `kindLabels` added earlier today; every existing caller is as it was.
  - **Open:** (1) the field step is required because the data model says so; if the designer would rather attach to a record as a whole,
    that is a model change (a "whole record" key) and not made here; (2) a project that has no records yet has nothing to attach to, and
    the "Attach to" list is empty; whether the menu item should then say so, or add a record first, is not decided; (3) the form is lab
    only; whether the product page's Artefacts tab should get the same "Add" is for the designer.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the five touched files and `npm run check:contracts` clean. **Not verified:** a
    live browser pass (the menu with its second divider, the form's two dependent selects, a file and a link each saved and shown in the
    tab, the validation hints, the signed out prompt, the modal over the lab's panel), because no browser tool was available. Typography QA
    (0.6 item 8) not run: the modal and menu use the design system's own text treatments, and the new copy is the title, the one-line
    description, three labels and the hints. Sibling grep: `ActionsMenu` has other callers (the record panel, the empty state) that
    pass none of the new props. `shell.tsx` and `notifications-popover.tsx` are being edited in another session as well; this change was
    made against `shell.tsx` as it stood after that session's reformat. Not committed.
