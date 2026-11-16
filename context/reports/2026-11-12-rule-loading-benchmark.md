# Rule loading: re-run, 12 November 2026

Re-run of `2026-09-29-rule-loading-benchmark.md` with the same tools (`npm run bench:rules`,
`npm run test:rules-hook`), on the working tree of `saimaniganahalli1/push-pr-merge-sai-wips` (it has uncommitted
edits to the contract rule files, so sizes are slightly above HEAD). Sizes are bytes of text; tokens are
estimated at 4 bytes each.

## In one line

The scoping still works and the hook is still cheap, but a session now carries 2 to 3 times the rule text it did
in September, and the hook's own test suite is red (37 of 60) because its expectations predate one new rule file.

## Size: what a session carries

| Task | 29 Sep | 12 Nov | Change |
| --- | --- | --- | --- |
| Answer a question (no files) | 23 KB | 34 KB (~8.6k tok) | +48% |
| Change the contracts or checks | 25 KB | 36 KB (~9.2k) | +44% |
| Prototype lab | 46 KB | 109 KB (~27.8k) | 2.4x |
| Record page (DSA detail) | 53 KB | 162 KB (~41.5k) | 3.1x |
| Edit a doc page | 48 KB | 104 KB (~26.7k) | 2.2x |
| Change a component | 50 KB | 106 KB (~27.0k) | 2.1x |
| Explore / map search | 64 KB | 174 KB (~44.7k) | 2.7x |
| Build a screen (Template Finder) | 75 KB | 190 KB (~48.5k) | 2.5x |

The saving against the old 909 KB "load everything" baseline fell from 91.8%-97.5% to 79.1%-96.3%. That baseline
is no longer the fair comparison: 896 KB of it was `CONTEXT.md` history, long since removed.

**The fairer comparison: all the rule files together are now about 203 KB.** A screen task loads 190 KB of that,
so for screen work (the most common work here) scoping now saves about 7%. It only pays off for questions,
contract edits, docs and components.

## Where the growth is

| Rule file | 29 Sep | 12 Nov (HEAD) | Working tree |
| --- | --- | --- | --- |
| `contracts-shell.md` | 10.8 KB | 49.1 KB | 54.9 KB |
| `contracts-build.md` | 10.6 KB | 44.9 KB | 49.3 KB |
| `contracts-core.md` (always loaded) | 17.9 KB | 28.0 KB | 28.3 KB |
| `ref-shell.md` | 8.2 KB | 15.3 KB | 15.3 KB |
| `ref-roles.md` | 5.4 KB | 9.3 KB | 9.3 KB |
| `ref-principles.md` (new 23 Oct) | none | 6.3 KB | 6.3 KB |
| `CONTRACTS.md` | 40.8 KB | 123.2 KB | 136.4 KB |

- **Three clauses are 36 KB of the 104 KB in the build and shell files:** §4.2 Lists and tables (15.7 KB),
  §4.6 Record pages follow the project page (13.3 KB), §3.12 Every action button carries an icon (7.3 KB).
- **The `Origin` lines are not the cause.** They total about 6 KB across core, build and shell. The bulk is clause
  body text.
- `contracts-core.md` is the always-loaded file; at 28 KB it is now bigger than the whole September launch set.
- `ref-principles.md` loads on `app/pages/**`, `app/proto/**`, `app/_prototype-tools/**`, `components/**` and doc
  pages, so it is in nearly every task (6 KB).
- Decision log: 688 files (it is not loaded; read or grep on demand).

## Cost of the hook

Median of 15 runs each, against this session's transcript (592 KB, far smaller than the 235 MB one measured in
September, so the transcript-scan cost is not re-measured).

| Call | Median | Max | Output |
| --- | --- | --- | --- |
| Glance (`git status`) | 32 ms | 35 ms | none |
| Command naming no repo path | 32 ms | 36 ms | none |
| Shell read of a screen | 37 ms | 39 ms | 752 B |
| Write to a screen | 37 ms | 40 ms | 761 B |
| Bare `node -e 0` (floor) | 28 ms | | |

Hook overhead above Node's own start-up is 4 to 9 ms. This matches September (20 to 35 ms).

## Reliability

- **`npm run test:rules-hook`: 37 of 60 pass. 23 fail, all for one reason.** `ref-principles.md` was added on
  23 Oct and loads on `app/pages/**` and `components/**`; the test cases still expect the September rule sets, so
  every case that touches a screen, component or doc page sees one extra rule (`ref-principles`) and fails. In
  every failing case the hook listed or refused the right rules plus `ref-principles`; none missed a rule.
  The behaviour is correct and the expectations are stale. The tests were last changed in `8e91c36` (29 Sep).
- **Not re-run:** the live checks from September (fresh subagents opening files and reading back the injected
  rules, a real compaction, live refusals). So "the right rules arrive in a real session" rests on the hook
  tests above and on this session's own behaviour, not on a fresh end-to-end run.
- **One over-trigger seen live:** a shell command that only mentioned the word `components` (reading size
  figures, no component file touched) made the hook list five component rules (about 75 KB). That is by design
  (a bare folder name counts as a folder search, test "folder search on the command line"), but obeying it on a
  non-component task would cost 75 KB.

## Limits

- Token counts are estimates (4 bytes per token). The launch figure leaves out the memory index and the skills
  list, which also load at launch.
- Sizes come from the working tree, which has uncommitted rule edits.
- Hook timing is on a small transcript.

## Open for the designer

1. Update the 23 test expectations to include `ref-principles` (no behaviour change; the test file is a guard, so
   §9.4 says it is your call).
2. Decide whether to trim `contracts-core.md` (it loads every time) and the three largest clauses, or accept the
   growth. Trimming §4.2 and §4.6 into a reference file that loads only on list and record screens would cut about
   29 KB from every build or shell task.
3. Re-run the live end-to-end checks (a few fresh subagents, a real compaction) if you want the reliability half
   re-proven, not only the size half.
