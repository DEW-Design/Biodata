# 2026-09-24 - `/proto/collection-sidebar` consolidated to a single direction, per direct

- **Sept 24 2026: `/proto/collection-sidebar` consolidated to a single direction, per direct
  instruction ("Let the 'Actions' become the baseline... do not do anything to it").** The
  "Actions" variant (from the round above) is now the sole Baseline - `QuickCreateButton` and the
  plain `StatusNav`-mirror-only variant are dropped, not kept as dead code, since "Actions" had
  already won on its own merits across several rounds of feedback rather than being one option
  among equals. `ProtoPicker`/`VARIANTS` are gone too - a comparison widget with one entry compares
  nothing; reintroduce it once a real second variant exists (see below). Verified live: no picker,
  the real `Actions` group (Export CSV/Create report) and both `TaskItem` banners still render and
  work identically to before, `tsc --noEmit`/`eslint` clean.
  - **Two real directions queued for the next round, grounded in Mobbin research, not yet built -
    per direct instruction to research before building.** (1) **Status as tabs above the table**
    instead of the `StatusNavColumn` list - real precedent: Xero's "Quotes" (All/Draft/Sent/
    Declined/Accepted/Invoiced as tabs directly under the page title) and Remote's "Team's
    expenses" (Pending/Approved/Declined/All requests, same placement) - a well-established, common
    pattern, not a novel idea. (2) **A real view switcher in column 2** once status moves out of
    it - not another status list, but a genuinely different lens, the same shape as Home's own My
    BioData / Flora and Fauna Dashboard split. Employment Hero's "Goals" page (My Goals / Team
    Goals / Company Goals / Search Goals as tabs) is the closest real precedent for this exact
    personal-vs-org-wide axis. For DLA specifically, "My Requests" (submitted by the current user)
    vs. "All Requests" (every request, the admin/reviewer view) is a real, domain-accurate split - a
    request has a genuine submitter and a genuine reviewer, unlike a cosmetic re-grouping. DSA has
    no equivalent submitter/reviewer split (a single-persona, admin-authored collection), so whether
    it needs an equivalent switcher at all, and on what axis, is still an open question - not
    assumed symmetric with DLA just because the two collections share a shell shape.