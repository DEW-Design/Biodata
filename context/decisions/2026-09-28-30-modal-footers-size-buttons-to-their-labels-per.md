# 2026-09-28 - modal footers size buttons to their labels, per designer feedback off a screenshot of the nomination Accept confirmation ("unacceptable to have squished primary button and such a big secondary button").

- **Sept 28 2026: modal footers size buttons to their labels, per designer feedback off a screenshot of the nomination Accept confirmation ("unacceptable to have squished primary button and such a big secondary button").**
  - **Cause:** the shared modals (`components/application/modals/modal.tsx`: `ConfirmationModal`, `DestructiveModal`, `FormModal`) laid their two footer buttons out as a two-column grid, inside a 320px (`max-w-xs`) modal for the first two. Each button got exactly half the row, so "Accept nomination" was squeezed while "Cancel" took the same width at the large size.
  - **Fix in the component (CONTRACTS 1.9):**
    - The footer is now natural-width buttons, right-aligned, primary last, at `md` size, and stacked full width on a phone (`flex-col-reverse`, so the primary is on top).
    - The confirmation and destructive modals widen to `max-w-md` (448px).
    - The three modal titles used the dead `text-md` class, so they rendered at an inherited size; they now use `text-base`.
    - Every consumer changes at once: the Accept, Reject and Return modals, the DLA approve and reject modals, deletes and cancels, and the User Management confirms.
  - **Sibling sweep:** two app modals hand-built the same squeezing footer.
    - The sign-up invite (`guest-action-gate.tsx`) now uses the same footer and width, and its title and description are `text-base` and `text-balance`.
    - DLA's Add location (`add-location-modal.tsx`) uses the same footer. Its "Add Location" button, and the two buttons that open it (`dla-form.tsx`, `dla-detail.tsx`), now read "Add location", and its title "Add a location".
  - **Verified live:**
    - Accept nomination at 1708 wide: dialog 448px, Cancel 74x40, Accept nomination 149x40, right-aligned.
    - The guest sign-up invite matches.
    - At 420 wide the buttons stack at full width.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` on touched files and `npm run check:contracts` are clean.
  - Not committed.