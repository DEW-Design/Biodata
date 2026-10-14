# 2026-10-08 - Newsletter option 6: the gradient hero runs full bleed

- **Oct 8 2026: Newsletter option 6: the gradient hero runs full bleed.** Follows `2026-10-08-02`. The designer: "Could the top be a full bleed card?"
  - **Changed (`layouts/layout-6.tsx`):** the gradient card no longer sits inset with its own margin and rounded corners. It runs to the three edges of the newsletter's paper; the paper's own rounded corners (and its overflow clip) round the top two. Its padding is 32px (it was 24px inside a 24px margin), the same as the body under it, so the left edge of the logo, the title, the figures and the sections below all line up at 32px. The body block moved from `px-6 pb-8` to `p-8` for the same reason.
  - **Unchanged:** the content, the colours (white text, notes at 80%), the `bg-brand-800` fallback under the gradient, the lockup in a white chip.
  - **Not done:** the other options keep their own inset treatment (option 1's band stays a card inside the paper). A full-bleed variant of option 1 was not asked for.
  - **Verified (Playwright):** 600px wide, the card 600px wide at x 341, no overflow at 390, zero console errors; `tsc`, `eslint`, `check:contracts`.
  - Not committed, not pushed.
