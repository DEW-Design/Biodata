# 2026-10-14 - Newsletter infographic reviewed with the design foundations: one card, three bands, 35 percent shorter

- **Oct 14 2026: Newsletter infographic reviewed with the design foundations: one card, three bands, 35 percent shorter.** Follows `2026-10-14-01`. The designer: run `/emil-design-foundations`, and "thinking a nice elegant infographic. Don't increase the height too much." The infographic block of option 7 (`infographic.tsx`) was reworked; the content (`newsletter-data.ts`) is unchanged word for word.
  - **Height, measured at 600px wide:** the infographic went from 1,727px (vision 274, problems 597, opportunity areas 824) to 1,127px (240, 388, 497), 35% shorter; the whole newsletter from 2,669px to 2,069px. It did not grow anywhere.
  - **Findings and fixes:**

    | Before | After | Why |
    | --- | --- | --- |
    | Three boxes of equal weight, each with the same icon tile in its heading | One card of three bands: the vision is the only filled band (brand tint), the problems lead with their figures, the opportunity areas are quiet columns | One focal point; hierarchy is subtraction |
    | The opportunity cards sat in a grey panel (a box in a box, the inner corners not concentric) | Open columns on the card's white, hairlines between bands | Nested radii; restraint |
    | A 32px icon tile before each band heading | A 16px icon and a 12 / 600 capitals label per band, tracked | Uppercase labels with loosened tracking; the icon only names the band |
    | Five problems in a 2-column grid, a figure on some and not others, so titles did not line up | The three with a number in their sentence in a row of three, figure first; the two without, in a row beneath | The numbers read as a row; titles align |
    | Figures 24px with the words ("Over", "-year-old") the same size | Digits 24 / 600 tabular, their words 14 / 500 beside them | Tabular figures; contrast of size inside one figure |
    | Opportunity cards 2 across, 16px titles, 14px text | 3 across, 14 / 600 titles, 12px text in the tertiary colour (5.3:1) | The project list's description size; shorter |
  - **Type (measured):** tagline 24 / 600, figures 24 / 600 tabular in brand-700, figure words 14 / 500, problem and opportunity titles 14 / 600, body in the columns 12 / 400, band labels 12 / 600. All Barlow, all tokens; no new component. The 12px body is the smallest text in the block; a longer sentence runs to seven lines in a 150px column ("Fragmented data").
  - **Verified:** `tsc`, `eslint`, `check:contracts`; Playwright against this workspace's dev server (port 3001): 600px wide, no overflow at 390, zero console errors.
  - **Not done:** the infographic is still inside the newsletter (no export route yet), and the long sentences at 12px in three columns are the thing to look at first if it should be shorter still (it could go to a 2 x 3 grid of icon-left rows, a few pixels taller than now).
  - **Open:** (1) is the infographic exported as an image? (2) Is 12px for the column text acceptable at email size, or should the sentences be set at 14px in fewer columns (taller)? Not committed, not pushed.
