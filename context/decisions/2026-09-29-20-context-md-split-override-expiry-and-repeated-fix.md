# 2026-09-29 - CONTEXT.md split into context/decisions/, override reviewBy dates, and the "promote a repeated fix" contract

- **Sept 29 2026: CONTEXT.md's 7,578-line append-only log split into `context/decisions/` (one file per
  dated entry, 156 files), CONTRACTS.md gained a new §0.8 and real override-expiry enforcement, and the
  §3.9/§3.10 ordering bug was fixed - per direct instruction, following a review of how well the
  CONTRACTS/CONTEXT guardrail system was working.** `CONTEXT.md` shrank from 7,578 to 1,490 lines - only
  the standing reference material (Final check through User roles) stays inline; every dated decision
  moved to its own file under `context/decisions/`, indexed by a new "## Decision log" section at the
  end of `CONTEXT.md`. The split was done mechanically (a scratch Node script, `.context/split-context.mjs`,
  gitignored) rather than by re-typing content through an agent's own output, and verified **byte-for-byte
  lossless** against a backup (`.context/CONTEXT.md.orig-backup`) before anything was deleted. One real
  hazard surfaced mid-task: a concurrent session working in this same shared git worktree appended one
  more entry directly to `CONTEXT.md` *after* the split ran, landing outside the new structure (caught by
  the presence of "Not committed." - a phrase that should never appear in a one-line index entry - still
  in the file after the split). Folded into its own file (`2026-09-29-19-...`) rather than left dangling.
  - **New §0.8, "Promote a repeated fix":** the second time the same underlying bug is fixed for the
    same reason, it MUST NOT be fixed by hand a third time - the same task writes or extends an `AUTO`
    check instead. Origin: `MultiSelect`'s Escape-clears-selection bug, fixed six times before becoming
    `AUTO §1.9a` (see §1.9's own origin line).
  - **Override `reviewBy` dates, enforced in real time:** every entry in `contracts/overrides.json` now
    carries a `reviewBy` date (the four existing overrides backfilled to 2027-03-25, six months out).
    `scripts/check-contracts.mjs` gained `AUTO §1.4b`: it compares `reviewBy` against today on every run
    (locally, on every pull request, and on the scheduled weekday run) and fails once it's passed -
    verified live by temporarily setting a `reviewBy` to the past and confirming the check failed with
    the expected message, then restoring the real file and confirming it passed again. `scripts/add-override.mjs`
    now requires or defaults `reviewBy` to 180 days out. §1.4 and §9.2 updated to match.
  - **§3.9 ("Navigation order") and §3.10 ("Column 2 is navigation and actions only") were printed out of
    numeric order** in the document (§3.10 appeared physically before §3.9, since §3.10 was appended
    later without reordering) - swapped to match their numbers. No renumbering: every other clause number
    stays exactly as it was, since `check-contracts.mjs` and dozens of `CONTEXT.md`/code-comment
    cross-references hardcode clause numbers like `AUTO §2.1c` and `CONTRACTS.md 9.4`.
  - **Every mechanical `CONTEXT.md` reference inside `CONTRACTS.md` was updated** (§0.1, §0.6 item 6,
    §1.3, §5.1, §9.1, §9.4) to describe the new two-tier structure precisely, rather than leaving the
    constitution describing a mechanism that no longer matches reality.
  - **Not done, flagged rather than silently attempted:** roughly 90 code comments scattered across
    `app/**`/`lib/**`/`config/**` say "see CONTEXT.md's '<section name>'" for sections that moved into
    `context/decisions/`. Rewriting every one was out of scope for this task and would have cost far
    more than the value - checked instead that they're still genuinely findable (`grep -rl "<phrase>"
    context/decisions/` locates the right file every time tried), so nothing is actually broken, just one
    grep away instead of zero.
  - Verified: `npm run check:contracts` clean before and after every change (including a live
    reviewBy-in-the-past test proving the `AUTO §1.4b` check fires); the CONTEXT.md split verified
    byte-for-byte lossless by reconstructing the original from `CONTEXT.md` + `context/decisions/*.md`
    and diffing line-by-line (zero mismatches); `context/decisions/` confirmed not accidentally
    gitignored (`.context/` is, `context/` is not). Not committed.
