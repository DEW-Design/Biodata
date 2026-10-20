# 2026-10-19 - Post-6-oct lab: five versions of option 2's top right, switchable

- **Oct 19 2026: Post-6-oct lab: five versions of option 2's top right, switchable.** The designer, after the Mobbin findings in `2026-10-19-28-*` (the cluster
  has four controls of four shapes; the avatar is alone, search is an icon or a field of its own, one filled control, one divider): "If there's a nicer way to do
  this, show me some options." Lab only (CONTRACTS 5.4). Built so they can be compared on screen, not described.
  - **How it is shown:** a **Top right** tool on the Prototype tools bar (kept in the address as `?cluster=`), drawn only in option 2 and option 2, alt, since
    option 1 has no such cluster (3.8). Nothing was deleted: the designer chooses, and the others are retired then (4.4). The default is `icons`, the
    recommendation; `current` is the first build, kept for comparison.
  - **`icons`:** `[+ Add ⌄] | (search) (bell) (avatar)`. Add stays the one filled control with its label and chevron; after one divider (Aboard) Search is a round
    icon button, with the bell and the avatar the same size; the avatar has no name or chevron, as in Zoho, Aboard, ElevenLabs and Vercel, the name being in its menu.
    The avatar is only in the alt (the account is at the top left in option 2).
  - **`centre`:** Search as a field in the middle of the row (Jira's, Salesforce's), up to 24rem wide on the row's own centre line (a three-column grid, so it does not
    move with the length of the trail), the right end `[+ Add ⌄] | (bell) (avatar)`.
  - **`capsule`:** `[+ Add ⌄] ( search | bell | avatar )`: the three in one bordered round box with a hairline between them (Meetup's grouping), 28px buttons in
    a 2px frame. Its radius and its buttons' are all round, so the corners are concentric (2.13).
  - **`last`:** `(search) (bell) (avatar) | [+ Add ⌄]`: the icons first and Add at the far right (OpenAI, Charma, ElevenLabs end a bar on the primary action).
  - **`current`:** `[+ Add ⌄] | [Search pill] (bell) | OW Olivia Wyatt ⌄`, as `2026-10-19-26-*`.
  - **Built with:** the existing parts: `AddMenu`, `SearchPill` (a `fill` width), a new local `SearchIconButton` (the same round button as the bell), `NotificationsBell`
    (its existing `compact` size), `AccountMenu` (an `avatar` variant), `BarDivider`, `Capsule` and `CapsuleDivider` (local, a bordered round box and a hairline),
    and `TopBar` (a `centre` slot). Nothing in `components/**` was changed and no design system component was restyled.
  - **Open (for the designer):** (1) which one; (2) the project's 24px buttons in the panel's bar stay a smaller size on purpose and are the same in every version;
    (3) with an icon for Search the word "Search" is only its tooltip and label, so the field's invitation is lost; `centre` keeps it; (4) the capsule's 28px buttons
    are smaller than the other versions' 32px, which is the price of the frame; (5) `last` puts the primary where the eye ends the row, but breaks the order the designer asked
    for first (Add, divider, Search, notifications).
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean; all five addresses serve (200). **Not verified:** how any of
    them looks (spacing and alignment, the centred field's position against a long project trail, the capsule's frame and dividers, the avatar button's open ring,
    the menus opening leftwards on screen), because no browser tool was available. Typography QA (0.6 item 8) not run: no text added (Search's label is the one
    that was there). Not committed.
