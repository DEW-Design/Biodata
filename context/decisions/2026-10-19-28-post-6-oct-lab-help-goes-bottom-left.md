# 2026-10-19 - Post-6-oct lab: Help goes bottom left in option 2 alt, and Mobbin on the top right cluster

- **Oct 19 2026: Post-6-oct lab: Help goes bottom left in option 2 alt, and Mobbin on the top right cluster.** The designer, on a screenshot of option 2,
  alt: "sorry ? to bottom left" (correcting `2026-10-19-27-*`, which put it at the bottom right), and "can you look at best patterns here? /mobbin? I think the
  top right bit feels a bit unresolved."
  - **Done:** Help is at the bottom left of the rail in the alt (`RailFoot`, `justify-start` when the logo is not there). Options 1 and 2 keep the logo at the
    left of the foot and Help at its right.
  - **What reads as unresolved in the screenshot:** the right end of the top row has four controls of four different shapes and weights: a 36px primary
    rectangle (Add), a 224px grey filled pill (Search, in Flinders Violet 100, with its text at 40%), a bare round bell, and an avatar with a name and a chevron. Under it,
    in the panel's bar, a second cluster of 24px white circles (the project's buttons) at the same right edge, a third size. There is one filled control, the
    right one, but nothing else in the row agrees with anything else in height, fill or width.
  - **Mobbin (2.6; web, 20 screens in two searches):** Jira, Zoho CRM, Aboard, Meetup, ElevenLabs, Vercel, Dropbox Dash, Salesforce, Charma, OpenAI Platform.
    (1) **The avatar is alone**, a circle (Zoho, Aboard, ElevenLabs, Vercel, Dash), sometimes with a small chevron (Meetup); the name is in its menu, never beside it.
    An inline name appears only in a sidebar's account switcher, at the top left. (2) **Search is either a wide field of its own** (Jira: centred, a "Create"
    button right after it; Salesforce: centred; Zoho: a field at the right with the create icon after it) **or an icon in the cluster** (Aboard, ElevenLabs's "Ask"), not a
    mid-width pill between two buttons. (3) **One filled control at most**, and the rest in one style: Aboard, Zoho and Meetup draw every icon as the same size
    and weight, in a row, with the avatar the same height. (4) **A divider groups, once:** Aboard has one, between the create icon and the utilities. (5) **The primary
    sits at an end of the cluster:** after the search (Jira), or last (Charma, OpenAI, ElevenLabs), with the avatar at the far right where there is one.
  - **Recommendation put to the designer (not built):** make the cluster one row of one size: `[+ Add ⌄] | (search icon) (bell) (avatar)`, the avatar alone, the search an
    icon button that opens the Search page as the pill does. Alternative: the search a centred field in the middle of the row (Jira's pattern), the cluster
    `[+ Add ⌄] | (bell) (avatar)`. Either takes the cluster from about 570px to about 215px and leaves one filled control. The project's 24px buttons in the bar below
    stay a different, smaller size on purpose (they belong to the page), which is noted and not changed.
  - **Open:** which of the two, whether the 24px project buttons should become 32px to match, and whether the labelled Add should keep its "Add" text (Jira,
    Charma and ElevenLabs label it; Aboard and Zoho use a plus alone).
  - **Verified:** `npx tsc --noEmit` and `npx eslint` on `shell.tsx` clean for the Help change. Nothing was built for the cluster. **Not verified:** Help at the
    bottom left in a browser (no browser tool was available). Typography QA (0.6 item 8) not run: no text added. Not committed.
