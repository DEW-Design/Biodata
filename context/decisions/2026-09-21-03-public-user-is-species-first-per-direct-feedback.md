# 2026-09-21 - public-user is species-first (per direct feedback: public users are more curious about species

- **Sept 21 2026: public-user is species-first (per direct feedback: public users are more curious about species
  than projects; a project is only a way of organising species by their occurrences and observations).** Scoped to
  the public-user persona and built so far only in `/proto/public-user`; the real `/pages/*` shells are unchanged
  until a column-2 variant is picked and promoted.
  - **Header:** "Add project" and "Upload dataset" removed for this persona (only Log in / Sign up remain), and the
    search is a species search (common or scientific name) that jumps to the Species tab as you type. Repeats the
    earlier round-3 decision that the shipped `1834aa7` shell had reversed, so promote it to the real shells too.
  - **Rail: unchanged - Home, Projects, Explore (corrected the same day).** A first pass replaced Projects with
    Species, which was wrong: a public user still has to be able to go into Projects, find a project and read more.
    Species-first lives in Home (the Species tab, the species search, the copy), and Projects stays a real destination
    that reads species-first.
  - **Dashboard:** the fourth tab is "Species" (a browsable list with a group filter) instead of Projects, the
    Overview shows three cards (Records, Flora species, Fauna species) and drops "Projects across SA", and the gradient
    card copy is species-led on every tab.
  - **Same publication rule as Explore:** a species is listed only when the project that recorded it is Active or
    Completed, so drafts and projects under review never surface a species. Empty groups are hidden (Reptile has no
    public records in the mock data because its project is a draft).
  - **Known limits, not fixed:** the mock data gives 8 public species, all fauna, so the Flora tab stays aggregate
    only; there is no species detail page, so rows are not clickable (honest, not a dead link); and the group per
    species comes from a small factual lookup in the lab because the mock records carry none.
  - **Projects: unchanged, the real shared table (corrected the same day).** A first pass hand-built a species-first
    project list in the lab, which redesigned a screen nobody asked to change and stood in for the real `Table` with
    a lookalike. Reverted: the Projects section renders `ProjectListContent` exactly as `/pages/project-list` does
    (verified cell for cell), in the same three-column shell, with no gradient card because the real page has none.
    Rail -> Projects -> a project row -> project detail works as it always has. The one species-to-project link kept in
    the lab is on a species row ("Recorded through <project>"), which opens that project's record panel.
  - **Open, not changed:** the real Projects table shows Draft and Under review projects to a public user, while
    Explore hides them. That is the real page's behaviour for every role (see the Backlog entry on Level 1 public
    filtering), so it was left alone here; decide it when the real shells are updated.
  - **Still project-first, flagged for the next round:** Explore's results open on the Projects tab, the real
    shells' header search (`GlobalProjectSearch`) only finds projects, and the real `/pages/project-list` and
    `/pages/project-detail` don't list species yet. A species-first Explore, and a "Species recorded" summary at the
    top of the real project detail page, are the natural next steps.