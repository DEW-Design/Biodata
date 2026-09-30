# 2026-09-28 - contained alerts are laid out as a stacked card, per designer feedback off a screenshot of the nomination form's open-nomination note ("what's with the alert? Looks so disgusting").

- **Sept 28 2026: contained alerts are laid out as a stacked card, per designer feedback off a screenshot of the nomination form's open-nomination note ("what's with the alert? Looks so disgusting").**
  - **Cause:** a contained alert still used the full-width banner's inline layout. The title sat in one column and the description in a second, narrow one, so "Returned for more information" broke across two lines. The action floated at the far right, and the icon, title and action each sat at a different height.
  - **Fix in the component (`AlertFullWidth`, contained branch):**
    - Icon at the top left.
    - The title, with the description under it at full width (both `text-balance`).
    - Any actions as a row under the text, the same as the floating alert. The close icon stays top right.
    - The title's first line centres on the icon: the outline icon is a 20px box, and the default colour's larger 40px icon gets a 10px text offset.
    - The full-width banner layout is unchanged.
  - Every contained alert changes at once: the form's "Details missing", the nomination form notes, the Species panel's note, and the DLA, DSA, nomination and User Management status banners.
  - **Verified live:** screenshots of the open-nomination note, "Details missing", the DLA "Closed" banner with its Renew licence button, and the docs page's full-width banner. The icon and title centres match (339px, 339px). Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed; the designer will say when to commit.
  - **Designer decision (Sept 28 2026): the nominations, DSA and DLA lists do not share one column set.** Each list shows the columns its own record needs, and only My and All within a list must match each other (they now do on all three). Still open: whether "Shared via" (DSA) and "Access level" (DLA), which are filters with no column in those tables, should get columns.