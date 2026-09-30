# Rule loading: before and after benchmark

29 September 2026. Before: commit `62d5015`, the last commit before the rules were split. After: the working tree
once every open item was closed (context/decisions/2026-09-29-35). Re-run any time with `npm run bench:rules`
(sizes) and `npm run test:rules-hook` (behaviour).

## In one line

Every task now carries 91% to 97% less contract and reference text. The right rules still arrive every
time, including after a compaction and on every way of touching a file. That was proven on real runs, not
estimated.

## What changed

| Before | After |
| --- | --- |
| `CLAUDE.md` imported all of `CONTRACTS.md` and all of `CONTEXT.md`, most of it dated history | `CONTRACTS.md` is split into scoped rule files by area; `CONTEXT.md` is a 4 KB index; history lives in `context/decisions/` and loads only when searched |
| Every rule for every area loaded on every task | Rules load for the area a task touches |
| Reference text mixed current practice with history, and parts were no longer true | The screen, roles and ingest references rewritten to current practice; the old text archived word for word |
| (No gap: everything was always loaded) | A hook makes sure the right rules arrive on every path the loader misses (below) |

## Size: what a session carries

Sizes are bytes of text; tokens are estimated at 4 bytes each.

| Task | Before | After | Saving |
| --- | --- | --- | --- |
| Answer a question (no files) | 909 KB (~233k tokens) | 23 KB (~5.9k tokens) | 97.5% |
| Change the contracts or checks | 909 KB | 25 KB (~6.4k) | 97.2% |
| Prototype lab (`/proto/tools`) | 909 KB | 46 KB (~11.8k) | 94.9% |
| Record page (DSA detail) | 909 KB | 53 KB (~13.7k) | 94.1% |
| Edit a doc page | 909 KB | 48 KB (~12.3k) | 94.7% |
| Change a component | 909 KB | 50 KB (~12.7k) | 94.5% |
| Explore / map search | 909 KB | 64 KB (~16.3k) | 93.0% |
| Build a screen (Template Finder) | 909 KB | 75 KB (~19.2k) | 91.8% |

**Share of the context window.** This session compacted 20 times, each at about 970k tokens. Before, about
233k of that (roughly a quarter) was rules on every task. After, it is 6k to 19k (under 2%).

**Where the remaining size is:**

| Loads | File | Size |
| --- | --- | --- |
| Always | `contracts-core.md` (conduct, process, clause index) | 18 KB |
| Screens | `contracts-shell.md` 11 KB, `ref-shell.md` 8 KB | 19 KB |
| All app and component work | `contracts-build.md` | 10 KB |
| Domain screens | `ref-domain.md` | 10 KB |
| Components and docs | `ref-ingest.md` 8 KB, `ref-scaffold.md` 6 KB, `contracts-components.md` 3 KB | 17 KB |
| Roles, docs, governance, prototyping | 5, 1, 2, 2 KB | 10 KB |

The three references rewritten this round:
- `ref-shell.md`: 30.8 KB to 8.2 KB.
- `ref-roles.md`: 13.2 KB to 5.4 KB.
- `ref-ingest.md`: 25.7 KB to 8.3 KB.

## Reliability: does the right rule arrive?

| Situation | Before | After |
| --- | --- | --- |
| A file is opened with the Read tool | Yes (everything was loaded) | Yes: the loader injects that area's rules |
| A file is read through the shell (`cat`, `sed`, a script) | Yes (everything was loaded) | Yes: the hook lists the missing rules right after the command |
| A file is created or changed (Write, Edit, or a shell write) | Yes (everything was loaded) | Yes, enforced: the change is refused until that area's rules are read |
| After a compaction or `/clear` | Yes (the imports were re-read) | Yes: the hook reads what is loaded from the transcript since the last compaction |
| A rule for an unrelated area | Always loaded (all 909 KB) | Not loaded. Doc pages no longer get the components contract just because their folder is also named `components` |
| Guidance that was no longer true | Loaded on every task | Removed from the three references; kept only in the archive |
| The check itself breaks (transcript format changes) | Not applicable | Said on screen, and every matching rule is listed rather than none |

The "before" setup never missed a rule because it loaded all of them. The saving above comes without giving
that up: every way a file can be touched now gets its rules, and a change cannot happen without them.

## Proof

- **Loader behaviour was measured, not assumed.** Claude Code's rule matching was probed with throwaway rule
  files read by fresh subagents: 18 observations, with a positive and a negative control. The model: a
  trailing `/**` is dropped, then gitignore rules apply. The hook and the benchmark share it
  (`scripts/rule-paths.mjs`), and the observations are test cases.
- **Five real runs matched the benchmark exactly.** Doc page, component, lab, new screen and record page:
  fresh subagents opened each task's files, and the rules Claude Code injected (read from their
  transcripts) were exactly the predicted set, with no extras and no misses.
- **Real compaction.** On this session's own transcript, a screen read listed only 1 rule just before a real
  compaction, all 4 just after, and none once they had been Read again.
- **Live refusals:**
  - A new doc-page file was refused while the docs rules were missing, then went through once they were
    Read.
  - A subagent's shell write into `app/pages` was refused, naming the four screen rules, and the file was
    never created.
- **Tests:** `npm run test:rules-hook` passes 60 of 60. That covers 19 loader observations and 41 hook cases:
  shell reads, heredocs, glancing, searches, every kind of write, compaction, a subagent, and a broken
  transcript.

## Cost of the hook

- **Time:** about 20 to 35 ms per tool call (median, measured on this session's real 235 MB transcript).
  Commands that only glance, or name no repo path, cost about 20 ms.
- **Context:** a listing is a short pointer (about 0.5 KB). This session produced 16 listings and 2
  refusals.

## Limits, stated plainly

- **Shell writes are recognised by pattern:** redirects, `mv`, `cp`, `rm`, `tee`, `sed -i`, `--write` or
  `--fix`, and scripts written inline that write. A separate script file run as `node x.mjs` or through
  `npm run` that writes into a scoped area is not gated. Neither is a path built at run time from a
  variable.
- **Grep and Glob** are covered, but those tools don't exist in this Claude Code setup, so they are tested
  with synthetic inputs only. All searching here goes through the shell, which was tested live.
- **The loader model matches Claude Code as it is today.** If Claude Code changes how it matches rules, the
  observation tests are the place to update.
- **The "before" figure assumes Claude Code loaded the whole 896 KB `CONTEXT.md`.** Whether it cut the
  file short could not be checked, so 233k tokens is the most it could have been.
- **Token counts are estimates** (4 bytes per token).
