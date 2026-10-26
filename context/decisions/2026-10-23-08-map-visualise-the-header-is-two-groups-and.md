# 2026-10-23 - Map visualise: the header is two groups, and each id sits with its name

- **Oct 23 2026: Map visualise: the header is two groups, and each id sits with its name.** The designer, with a screenshot of the default header ("Two names, ids in a column"): "Can we look at layout
  hierarchy?" Run through `/refine-prompt` (the terms: Hierarchy, "the ranking of elements by importance. Without it, everything competes and nothing wins"; Negative space, "defines shape, creates breathing room,
  and guides the eye"; Gap). Assumed: the header block in the screenshot, not the whole card.
  - **Measured before (`dataset-error-map.tsx`, 1440 x 900, card-relative):** back link 17 to 37; title 45 to 69, so 8px under the back link; the first subject line at 77, so 8px under the title; the two subject
    lines 2px apart. The gaps were 8, 8 and 2, so the way back was as close to the title as the subject was, and the four lines read as one flat stack. The ids were right-aligned at the card's edge, 120px and 67px from
    the end of their own names across empty space, so each belonged to neither line.
  - **Changed:** the frame: the way back, then 12px, then the title with what it is about (4px under the title, 2px between the subject lines): gaps of 12, 4 and 2 (was 8, 8, 2) in the first, second and fourth options,
    and 12, 4 and 2 in the file-as-title option. The default option's ids now follow their names on the same baseline, 8px after (measured: 8 and 8, from 120 and 67), in the 12px supporting size (12/400 tertiary,
    a layer the rows already use), the names at 14/500 and 14/400 as before; the option is renamed "Two names, ids beside them". The other options keep their own arrangement and take the new gaps. The default's
    header is the same height (the tabs still start 144px down); file-as-title is 4px taller (140, was 136).
  - **Not changed, proposed:** where the way back lives. The header spends 131px of the card's roughly 700 before the tabs, and the "Back to report" row is 36 of them (its 20px and the gap under it). Putting it in
    the title's row (a back arrow beside "Map visualise", or the link at the right of that row) would save about 28px and make the title the first thing read, at the cost of the labelled link Explore's own record view
    uses ("Back to results", `link-gray` with the arrow). That is a structural change to a pattern Explore shares, so it is the designer's. The one-line option (the trail) remains the one that truncates both names
    at 440px; not deleted, as it was not asked (CONTRACTS 0.4).
  - **Verified, in a browser (Playwright, a script outside the repo):** the gaps measured for each of the four options chosen from the tools bar (above) on the Flinders dataset as BioData Admin at 1440 x 900; the
    default's header looked at; zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** the other dataset's longer file name beside its 12px id (the name
    gives way, the id does not; checked before the change, not after), and 280px wide. Typography QA (0.6 item 8): no layer was added (12/400 tertiary, 14/500, 14/400 are the card's own); the skills were run on this
    card in `2026-10-23-05-*`. Not committed.
