# 2026-10-14 - Newsletter option 8: option 7 polished, with patterns from Mobbin newsletters

- **Oct 14 2026: Newsletter option 8: option 7 polished, with patterns from Mobbin newsletters.** The designer: "Use option 7 as the base, and then let's make it look nicer. Look at patterns that exist on Mobbin and create a lovely looking newsletter." Option 7 is untouched; the result is `/nltemplate/option-8` ("Option 8: Polished", the switcher reads "of 8"; `layouts/layout-8.tsx`).
  - **Mobbin read (ideas only, 2.6):** Sketch's "Beyond the Canvas" issue email (a "view this email in your browser" line above the masthead, an issue chip, a closing "Liked this issue?" prompt, a footer saying who it is from), Substack and Ghost (a large title with the byline under it, "view in browser"), Flodesk (a tinted panel carrying the one invitation), Kit's templates (issue and date in the header), Webflow and Canny (a tag chip on each item, "Learn more" links), Resend (a footer block of links).
  - **What changed from option 7, nothing else:**
    1. A "View in browser" line above the masthead, linking to this page (the one web version that exists).
    2. The header says where the project is at a glance: a chip "We're here" and "Design", read from the tracker's own data, under a larger (30px) title; the white lockup stays.
    3. The tracker is the same step list at its medium size.
    4. The Transition callout is drawn: Mamtha and Prabhakar as two avatars and an arrow; Plan and Design as two chips (Plan ticked, Design filled). The Highlights are a ticked list.
    5. The two invitations are cards with an icon tile, not strips.
    6. The team is three avatars across, larger.
    7. A footer, which option 7 had not: the colour lockup, one line saying who it is from (the lockup's own words) and a link to the BioData homepage.
  - **Same as option 7:** the content word for word, the infographic (vision, problems, opportunity areas), the order, the two feedback callouts as the mock has them, the placeholder people.
  - **Not added, on purpose:** no photography or illustration (none exists to use and none is invented); no issue number or date (the lo-fi and the mock have none, and an invented one would be sourced as real); no social icons or unsubscribe line (no accounts or mailing system to point to; 0.3, 2.10). A footer address or "why you got this" line is the first thing a real send needs and is for the sender to supply.
  - **Built from the system:** Badge, Avatar, FeaturedIcon, Progress, the brand and warning tints, `next/link` for the two links so the base path is kept; no new component.
  - **Height at 600px:** 2,631px (option 7: 2,160px). The extra is the footer, the "view in browser" strip, the larger header and the drawn callouts; the infographic is unchanged at 1,218px.
  - **Verified (Playwright, port 3001):** 600px wide, no overflow at 390, zero console errors; `tsc`, `eslint`, `check:contracts`.
  - **Open:** (1) is 2,631px acceptable, or should the footer and the second invitation go? (2) The two invitations still say the same words (as the mock does): keep both? (3) A real send needs the sender's address and preferences line. Not committed, not pushed.
