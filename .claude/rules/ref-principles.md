---
paths:
  - "app/pages/**"
  - "app/proto/**"
  - "app/_prototype-tools/**"
  - "components/**"
  - "app/*docs*/**"
---

<!-- Hand-maintained: edit in place, current practice only. Written 23 Oct 2026. DRAFT: the principles are read out of the decision log (552 entries) and the designer's own words, and the wording is the agent's;
     each is for the designer to confirm or correct. The same text, with the quotes and the clauses, is at /principles (app/(docs)/principles/page.tsx). -->

# Reference: design principles, and exploring design-first

CONTRACTS.md says what is binding. This says why, and where an exploration starts. A contract is a rule that a failure produced; a principle is the thing the rules keep protecting. When a clause does not
cover a case, a principle decides it, and when two principles pull apart the designer decides (§0.4). The quotes and the clauses behind each are at `/principles`; the craft that follows from them is at
`/principles/craft`.

## The nine principles

1. **Say less.** Nothing on screen without a purpose: a mark (an icon, a border, a badge, a column, a sentence) stays if it tells a person something they need. Never restate a fact in two treatments.
   *Ask:* what would be lost if this were removed? (§2.12, §4.3)
2. **One thing first.** One focal point per view, one primary action, a type ladder where each level is one step from the next. Hierarchy is made by subtraction: make the important thing prominent by making
   the rest recede, not by making everything louder. *Ask:* where does the eye go first, and is that the right place? (§2.9, §4.3)
3. **One system.** The same job has the same pattern everywhere. Find the closest page that does the job and reuse it; extend a component once, for everyone; a control keeps its treatment across states.
   *Ask:* which existing screen does this, and what differs from it, and why? (§0.9, §1.1, §1.6, §1.9)
4. **Tell the truth.** Real components, real content, real data. A view shows its source's fields as the source writes them, never an invented label, a made-up value or a lookalike component. Where the truth is
   missing, say so ("Not provided", a `?`). *Ask:* where does each word and number on this screen come from? (§0.3, §1.2, §2.15)
5. **Make it obvious.** A person knows where they are, what this is, what they can do and how to get back, without being told. Controls look like controls, state is visible, labels are the person's words.
   *Ask (the designer's standing test, 23 Oct 2026):* "I know where I've come from, I know what to do here, and I know how to get back." (§3.11 to §3.13, §4.6, §2.4)
6. **Reveal in steps.** Tier, don't dump: the often-checked first, the rest behind a tab, a fold or a click. When load and one extra click are in tension, take the click. A fade says there is more.
   *Ask:* what is the least a person needs to see first, and how do they get to the rest? (§4.3, §4.1, §4.6)
7. **Design every state.** Empty, one, many, all hidden, loading, error, and each role. A role removes features; it does not get a different screen. *Ask:* what does this look like with nothing, with 500,
   and for the public user? (§0.7, §3.4, §4.2e)
8. **Reach everyone.** Every control is easy to hit with a finger and a mouse, works from the keyboard, has contrast, and does not depend on motion. *Ask:* can this be used with a thumb, with Tab, and with
   the sound off and the motion reduced? (§1.9, §2.16)
9. **Craft shows.** The details are made, not left: concentric corners, edges that read on any background, tokens for every colour, space and radius, tabular figures, quiet motion, a scrollbar that does not
   cut a card in half. They are measured in a browser, not eyeballed. *Ask:* did I measure it? (§2.1, §2.13, §2.14, §0.6) The catalogue is `/principles/craft`.

## Exploring design-first (CONTRACTS 0.10)

An exploration (a new screen, a layout option, a lab, a restyle) goes in this order. Nothing is built before step 3.

1. **The job.** Who is doing what, on which screen, with which role. One sentence.
2. **The principles at stake.** Name the two or three that bear on it, and where they pull apart. If they do and the repo cannot settle it, ask one precise question (§0.4) before building.
3. **The ground.** The states and roles to walk (principle 7), the closest existing page (principle 3), the data that is really there (principle 4), the components that exist (§1.1).
4. **Options, not one guess,** when the direction is open: real components in a lab, behind `LayoutOptionSwitcher`, each saying which principle it favours (§4.4). A reference (Mobbin and the rest) gives
   interaction and structure, never styling (§2.6).
5. **Judge against the principles before showing it:** the wayfinding test, the state walk, the table test (every word from its source), the measured pass (§0.6 item 4). Say what was measured.
6. **Record why,** in the principle's terms, when the designer chooses; and promote a repeated fix to a check (§0.8).

## Where two pull apart (proposed resolutions; the designer decides)

- **Say less / Make it obvious:** label the control and show its state; do not add a sentence to explain it. A missing affordance is fixed with a control, not with copy.
- **One system / Craft shows:** a better detail is made once, in the component, and every screen gets it (the hit area, the ghost button's fill); it is never made at one screen.
- **Reveal in steps / findable in three clicks:** take the click, but give a shortcut (a count on the tab, "Show N more", a link to the record).
- **Tell the truth / Say less:** a view carries the source's fields, in the source's order and words, and no more (the Map visualise card is the table's own fields, not a summary of them).

## Worked example

Map visualise (`/pages/observations?dataset=...`, 23 Oct 2026) went from a list of computed phrases to the table's own fields (4), with the group heading in every view (3), a trail that answers the wayfinding
test (5), one concept and one type ladder (2), a fade and a pinned button instead of a scrollbar (6, 9), touch targets from the components (8), and then became a pattern (`/patterns/map-list-card`) so
Explore's list could take the same polish (3). Its decisions are `2026-10-23-09` to `-44`.
