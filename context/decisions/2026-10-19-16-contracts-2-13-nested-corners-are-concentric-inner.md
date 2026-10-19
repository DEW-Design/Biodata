# 2026-10-19 - Contracts: 2.13 nested corners are concentric, inner radius equals outer radius minus padding

- **Oct 19 2026: Contracts: 2.13 nested corners are concentric, inner radius equals outer radius minus padding.** The designer, on a screenshot
  of three nested rounded boxes in the post-6-oct lab (the panel, the white sheet inside it, the restrictions card inside the sheet): "inner
  radius = outer radius - padding. Please burn this into context, contracts."
  - **The clause (`CONTRACTS.md` 2.13, next free number in the Style series; scope `build`, so it loads whenever an `app/**` or `components/**`
    file is read):** where a rounded element sits inside another rounded element and their corners meet, inner radius = outer radius - the gap
    between the two edges at that corner (the outer's padding plus its border width), never below 0. Where the gap is the outer radius or more,
    the inner corners are square; a same-sized or "about right" radius is not allowed. The numbers are chosen so the result lands on the radius
    scale (examples from the scale in `globals.css`), or derived with `calc` off the outer's token. A design system component keeps its radius, so
    the outer element is changed to fit it, never the component. It applies at every level and only where corners meet. It is checked in the live
    pass by measuring `borderRadius` and the gap for every nested pair on the screen, with `/emil-surfaces` for the open cases. `REVIEW`; no `AUTO`
    check yet (0.8: first occurrence), and it could only be measured on a rendered page, not found from class names.
  - **Where it lives (5.5):** the clause in `CONTRACTS.md`; its scope in `contracts/rule-scopes.json`; `npm run contracts:rules` rewrote
    `.claude/rules/contracts-build.md` (the clause) and `contracts-core.md` (its line in the always-loaded index). `npm run check:contracts` passes.
    Added to the designer's memory as `feedback-nested-radius-inner-equals-outer-minus-padding.md`, so a session started elsewhere has it too.
    `CONTEXT.md` is an index only and was not changed.
  - **Existing screens that break it, found and not changed:** in the post-6-oct lab the panel is `rounded-2xl` (16px) with the page 24px inside it
    (`main` `px-6 pb-6`, plus the 1px border), the production sheet inside is `rounded-xl` (12px), its sections are `p-6`, and the cards in them are
    `rounded-xl` (12px). Both gaps (25px) are more than the radius they sit in, so by 2.13 the sheet and then the cards would be square at those
    corners, or the gaps would have to shrink. Those cards and the sheet are `project-tab.tsx`, shared with the production project page, where their
    container is not rounded and nothing is violated, so the fix is in the lab's frame or by the designer's choice, not a change to the shared
    components. A wider sweep of every nested rounded box in the app has not been done.
  - **Open (for the designer, 0.4):** how to bring the lab's panel, sheet and cards into line. Options: (a) strict, the sheet and the cards go square
    inside the panel; (b) shrink the gaps so the radii step down on the scale (the panel keeps 16px, the page sits about 4px inside it, the sheet
    is then 12px, and the sections lose their padding at the corners); (c) take the sheet out of the rounded panel, so there is no nesting.
    Also whether to sweep the rest of the app for the same pattern.
  - **Verified:** `npm run contracts:rules` and `npm run check:contracts` pass; the clause is in both generated files. Nothing else was run: no
    screen was changed, so there is no tsc, eslint or browser pass for this entry. Not committed.
