# 2026-09-21 - Lapse removed; public-user flow specified, options at `/proto/public-user`.

- **Sept 21 2026: Lapse removed; public-user flow specified, options at `/proto/public-user`.** `@aiforui/lapse`,
  its `.npmrc` registry line and `instrumentation-client.ts` are gone (`package.json` and the lockfile match
  the previous commit again).
  - **Public-user flow, as specified by the user (flow layer, see "Build hierarchy"):** (1) lands on
    `/pages/biodata-home`; (2) header "Explore" goes to `/pages/dashboard?userRole=public-user`; (3) the Home
    dashboard has the same three-column shell as `registered-user` (icon rail, column 2, main) with stripped-back
    content; (4) main opens with a gradient card like the registered-user "Hi, Olivia" card, but its message
    changes with the dashboard tab (Overview / Flora / Fauna / Projects) and always offers account creation;
    (5) column 2 explains what BioData SA is and points to guides. This **reverses** the earlier "no `<aside>` for
    guest Home/Projects" decision in "Exploratory page layouts": that reasoning held only while column 2 had
    nothing to hold, and it now does.
  - **Not decided yet:** what column 2 does. `/proto/public-user` compares three directions on that one axis
    (Reference: flat and always visible; Disclosure: the boxed `Accordion`, one section open; How it works: explains
    the journey from sighting to project to published record in three steps, with the guides underneath).
    "Follows the tab" (a fixed about plus guides that changed with the active tab) was cut: it was Reference plus one
    behaviour, and its context was thin because it only reshuffled the same five Knowledge Centre categories and every
    guide points at the same landing-page section. Revisit once real per-topic guides exist. Header, rail, gradient card and dashboard are
    shared and fixed. Not built into `/pages/dashboard` until one is picked.
  - **Copy rules held in the lab:** plain government-service tone, one ask per tab phrased around what the guest
    is looking at, no growth-marketing lines. Guide rows use the real Knowledge Centre category names and
    descriptions from `/pages/biodata-home`; there are no guide pages yet, so the only link is one real anchor to
    that landing-page section. The card reserves a headline plus two body lines so changing tab never shifts the
    dashboard below (caught live: one message wrapped an extra line and moved the tabs 8px).
  - **`DataOverviewContent` keeps only its controlled `activeTab`/`onActiveTabChange` props.** An interim pass added
    `projectsTab` and `showProjectsMetric` for a Species tab; both were removed when that direction was reverted (see
    the "features reduce" entry below), so the real dashboard component is unchanged for every role.
  - **Copy round 2 for the public-user gradient card (per direct feedback: "more engaging, and nudging").** Each
    tab now leads with a headline that speaks to what the guest is looking at and names the personal payoff, then
    one body line that gives a concrete reason to act: Overview "Your sightings belong in this record", Flora
    "Found a plant that isn't on the map?", Fauna "Spotted a bird, mammal or reptile? Log it.", Projects "Give your
    survey a home in the record". The CTA stays "Create a free account" on every tab because that is what the click
    does; the nudge lives in the headline and body, and the sign-up modal each one opens repeats the same specific
    ask. The tone rule that held: warm and second-person, but every claim is one BioData SA already makes about
    itself (who contributes, what records are used for, that every record belongs to a project). No invented
    contributor counts, no urgency, no exclamation marks. Headlines stay under ~46 characters so they hold one line
    at the card's 640px text width.