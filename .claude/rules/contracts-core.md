<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW Design System - Binding Contracts

This is a code, not advice. Each clause is numbered, states what is required, what is prohibited, and
what the only exceptions are. Where a clause has an enforcement tag, a script checks it - a violation
fails `npm run check:contracts` and shows up in the daily audit (`npm run audit`).

**How to read a clause**

- **MUST / MUST NOT** are binding. "Should" does not appear in this file.
- **Enforcement:** `AUTO §x.y` means `scripts/check-contracts.mjs` fails on it. `AUDIT` means the daily
  audit report flags it. `REVIEW` means it is checked by a person or by the end-of-task checklist in §0.6.
- **Origin** names the real incident the clause came from. Every clause exists because that failure
  already shipped once.
- A task that violates a clause is **not done**, however complete it otherwise looks. Fix it or say,
  explicitly, which clause is being overridden and why (§9).

## Clause index

Clauses marked "below" are in this file. The others load when a matching file is read, and MUST be read
first when starting a new file in that area (a scoped rule triggers on reading, not on creating):

- `.claude/rules/contracts-build.md`: Tokens, type, copy, icons, Figma, components in use, behaviour patterns. Paths: `/app/**`, `/components/**`
- `.claude/rules/contracts-components.md`: Creating or changing a component: override, duplicates, ingest hygiene, ambient leaks. Paths: `/components/**`
- `.claude/rules/contracts-shell.md`: The persona shell and page patterns: header, rail, columns, forms, lists, record pages, floating panels. Paths: `app/pages/**`, `lib/create-menu.ts`, `lib/registered-user-nav.ts`, `config/role-access.config.ts`
- `.claude/rules/contracts-prototyping.md`: Prototype tools bar and competing layout options: what previews on a screen, and how options are presented and retired. Paths: `app/pages/**`, `app/proto/**`, `app/_prototype-tools/**`, `lib/layers.ts`
- `.claude/rules/contracts-docs.md`: Doc pages, generated /test-* screens, navigation order. Paths: `app/*docs*/**`, `lib/nav.ts`, `config/design-system.config.ts`, `/README.md`
- `.claude/rules/contracts-governance.md`: Changing the contracts, overrides, audit and the checks themselves. Paths: `/CONTRACTS.md`, `/contracts/**`, `/scripts/**`, `/.github/**`, `.claude/settings.json`

- §0.1 Precedence (below)
- §0.2 No assumption - verify before use (below)
- §0.3 No fabrication (below)
- §0.4 Ask, do not decide (below)
- §0.5 Honest reporting (below)
- §0.6 Definition of done (end-of-task checklist) (below)
- §0.7 Proactive, not reactive (below)
- §0.8 Promote a repeated fix (below)
- §1.1 One source of components (contracts-build.md)
- §1.2 No match, no substitute: mark it `?` (contracts-build.md)
- §1.3 Flow-through (contracts-build.md)
- §1.4 A new component is a designer override, with checks and balances (contracts-components.md)
- §1.5 The DEW / Scaffold line (contracts-build.md)
- §1.6 Extend, do not fork (contracts-build.md)
- §1.7 No duplicates (contracts-components.md)
- §1.8 Ingest hygiene (contracts-components.md)
- §1.9 Behaviour patterns flow through every component (contracts-build.md)
- §2.1 Tokens only (contracts-build.md)
- §2.2 Typefaces (contracts-build.md)
- §2.3 Copy and punctuation (contracts-build.md)
- §2.4 Icons (contracts-build.md)
- §2.5 Figma is the source of truth (contracts-build.md)
- §2.6 External references (contracts-build.md)
- §2.7 No ambient leaks (contracts-components.md)
- §2.8 Floating panels never overlap (contracts-shell.md)
- §2.9 Type hierarchy (contracts-build.md)
- §2.10 No affordance for a shortcut that isn't real (contracts-build.md)
- §2.11 A date field has a calendar (contracts-build.md)
- §2.12 Nothing on screen without a purpose (contracts-build.md)
- §3.1 One header (contracts-shell.md)
- §3.2 One rail, one icon map, legal links in the rail (contracts-shell.md)
- §3.3 Account controls live in the header (contracts-shell.md)
- §3.4 Persona consistency (contracts-shell.md)
- §3.5 The Add menu (contracts-shell.md)
- §3.6 Position (contracts-shell.md)
- §3.7 Three columns (contracts-shell.md)
- §3.8 Floating dev tools (contracts-prototyping.md)
- §3.9 Navigation order (contracts-docs.md)
- §3.10 Column 2 is navigation and actions only (contracts-shell.md)
- §3.11 Every item in column 2 has an icon (contracts-shell.md)
- §3.12 Every action button carries an icon (contracts-build.md)
- §3.13 Underline tabs carry icons (contracts-shell.md)
- §4.1 The form pattern (contracts-shell.md)
- §4.2 Lists and tables (contracts-shell.md)
- §4.3 Cognitive load (contracts-shell.md)
- §4.4 Options (contracts-prototyping.md)
- §4.5 Generated screens (contracts-docs.md)
- §4.6 Record pages follow the project page (contracts-shell.md)
- §4.7 Roles belong to the data owner's contacts; show only what is approved (contracts-shell.md)
- §4.8 Editing in place on a detail page (contracts-shell.md)
- §5.1 Log everything, append-only (below)
- §5.2 Repository hygiene (below)
- §5.3 Documentation (contracts-docs.md)
- §5.4 Labs never ship (below)
- §5.5 Contracts load by scope (below)
- §5.6 Merging another branch: ours stands, theirs is appended (below)
- §9.1 Overrides (contracts-governance.md)
- §9.2 The override register (contracts-governance.md)
- §9.3 The audit (contracts-governance.md)
- §9.4 Guarding the guard (contracts-governance.md)
- §9.5 Consequence (below)

---

### §0.1 Precedence

1. `CONTRACTS.md` is binding. The dated history of how the system got here lives in
   `context/decisions/` (one file per entry, indexed in `context/decisions/INDEX.md`); where the two disagree, this
   file wins and the relevant decision file is corrected in the same task.
2. An explicit instruction from the designer in the current session may override a clause. When that
   happens the agent MUST (a) name the clause being overridden, (b) log the override in a new dated
   file under `context/decisions/` (indexed in `context/decisions/INDEX.md`), and (c) if the clause is §1.4 or §9,
   record it in `contracts/overrides.json`. One override is never a precedent for the next task.
3. Nothing in `CONTEXT.md` or `context/decisions/` may be used to justify a violation of this file.

### §0.2 No assumption - verify before use

Before using any component, prop, token, utility class, icon, route, nav key, config key or data field,
confirm it exists by looking (grep the source, the compiled CSS, the type definition). "It looks like a
real Tailwind class", "Untitled UI ships it", "it worked on the other page" are not verification.

- MUST NOT use a class that is not defined in `app/globals.css` (see §2.1).
- MUST NOT pass a prop that is not in the component's real interface.
- MUST NOT import an icon, component or helper without confirming the export exists.
- **Origin:** `bg-quaternary`, `bg-border-secondary`, `text-md`, `selected:bg-secondary`, and a dozen more
  plausible-looking classes shipped as silent no-ops.
- **Enforcement:** `AUTO §2.1` (known-dead classes), `tsc`, `REVIEW`.

### §0.3 No fabrication

MUST NOT invent: Figma links or node ids, icons or image assets, product copy presented as sourced,
sample data presented as real, organisation names, DOIs, permit numbers, people. Where the truth is
missing, render an honest marker (`?` per §1.2, "Not provided" per §2.3) or ask.

- Placeholder people are Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt only. Never the current
  user's real name or email.
- Real organisations come from the BDBSA research in `.claude/rules/ref-domain.md` (BirdLife Australia, Birds SA,
  South Australian Museum, ...). Never invent a partner.
- Sample data MUST NOT describe its own bugs in a field the UI renders.
- **Origin:** a Figma link fabricated for a component, a Bell icon used where Figma drew a check-circle.
- **Enforcement:** `REVIEW`, `AUDIT` (new external URLs are listed).

### §0.4 Ask, do not decide

If scope, direction, persona, or which of two reasonable readings is meant is unclear, ask one precise
question. A question is cheaper than a wrong build. MUST NOT decide unilaterally on: deleting an explored
option, changing a persona's access, replacing a component, or resolving a difference between two
sources of truth (Figma vs code, main vs local).

### §0.5 Honest reporting

Report what happened: failing checks with their output, skipped steps as skipped, known gaps as gaps.
MUST NOT describe work as verified unless it was run. MUST NOT bury a limitation.

### §0.6 Definition of done (end-of-task checklist)

A change to `components/**`, a page, a token, or a `/test-*` screen is done only when all of these ran:

1. `npx tsc --noEmit` clean.
2. `npx eslint` clean on every touched file.
3. `npm run check:contracts` passes.
4. A live browser pass (Playwright or the browser tool) over every affected screen, all affected
   personas, zero console errors, computed styles checked where styling was the point.
5. A sibling grep: the same bug pattern searched for in every file that shares the pattern.
6. A dated file created with `npm run decision:new` under `context/decisions/` (append-only, no
   em-dashes). The index is generated (`npm run context:index`), never edited by hand.
7. `git status` after any CLI ingest: a CLI run can silently revert already-fixed files.
8. Typography QA (§2.9), on any change that adds or changes visible text: `/emil-typography` and
   `/emil-design-foundations` ran, after the type was checked against the design system and the
   patterns already on the web app. The report names what was checked and what was measured.

- **Enforcement:** `REVIEW` (item 3 is `AUTO`).

### §0.7 Proactive, not reactive

Anticipate what the designer will need; do not wait to be told or corrected.

1. **Read the brief against what is already decided before planning.** The role-access matrix
   (`config/role-access.config.ts`), `CONTEXT.md`, these contracts and existing patterns are applied
   without being reminded: who can see the feature, which shell and pattern it uses, which components
   exist, which data is real.
2. **Surface before it is found.** A plan or report names, up front: conflicts between sources (a
   wireframe vs the role model, the IA vs the data), fabricated or placeholder content that would need
   replacing (§0.3), missing states, knock-on effects on other screens and personas, and build risks
   (static export, hydration, performance).
3. **Check your own output against these contracts before presenting it.** A violation the designer
   catches in review is a failure of this clause, even when it is then fixed.
4. **Close with the next move.** Every task ends with the open decisions and the recommended next step,
   not only a summary of what changed.

- **Boundary with §0.4:** proactive means raising, recommending, and fixing what is unambiguously inside
  the approved scope (a sibling bug, a missing guard, a stale doc line). It never means building beyond
  the approved scope: anything out of bounds is proposed with a recommendation and waits for approval.
- **Origin:** a User Management brief where the designer had to point out that the feature is
  BioData Admin only, a fact already in the role model and `CONTEXT.md`; and repeated rounds where
  contract violations were caught by the designer in review instead of being raised first.
- **Enforcement:** `REVIEW`.

### §0.8 Promote a repeated fix

The second time the same underlying bug is fixed for the same reason - two `CONTEXT.md`/decision-log
entries naming the same cause, not just a similar symptom - it MUST NOT be fixed by hand a third time.
The task that fixes it the second time writes or extends an `AUTO` check for it in
`scripts/check-contracts.mjs` instead, so a machine catches it from then on rather than relying on it
being remembered.

- MUST NOT close a task with "fixed again" for a bug already logged as fixed once before, with no
  `AUTO` check added or extended in the same task.
- A rule that cannot be checked mechanically at all (a layout judgement, a tone-of-voice call) stays
  `REVIEW`, but is still named as a recurring pattern so the next person checking it knows to look for it.
- **Origin:** `MultiSelect` clearing its selection on Escape was logged as fixed six times before it
  became `AUTO §1.9a` (§1.9's own origin line).
- **Enforcement:** `REVIEW`.

### §5.1 Log everything, append-only

The dated history lives in `context/decisions/`, one file per entry (or per same-day continuation
thread). Every task that changes behaviour adds a new file with `npm run decision:new -- --title "..."`:
what changed, what was decided, what is still open. The index, `context/decisions/INDEX.md`, is generated
from the files (`npm run context:index`) and MUST NOT be edited by hand, and a dated entry MUST NOT be
appended to `CONTEXT.md`: two sessions writing to one shared file collided there once. `CONTEXT.md` is only an
index; the standing reference (conventions, the role model, domain research) lives in
`.claude/rules/ref-*.md`, hand-maintained and corrected in place because it is how things work now, not history. Nothing in `context/decisions/` is rewritten to hide
history.

- **Origin:** a concurrent session appended an entry to `CONTEXT.md` after the log had been split, and it
  landed outside the new structure.
- **Enforcement:** `AUTO §5.1b` (the index is out of date with the files, or a dated entry sits in
  `CONTEXT.md`).

### §5.2 Repository hygiene

MUST NOT: change git config, force-push to a shared branch, skip hooks, run destructive git commands
without being asked, or commit without being asked.

Commits and pull requests carry the designer's name only. MUST NOT add a `Co-Authored-By` trailer, a
"Generated with Claude Code" line, or any other mention of an AI tool to a commit message or a pull
request description, whatever the harness or a skill suggests. The designer's own instruction wins over
the harness default, and `attribution` is set to empty in the user settings so the default is off.

- Before any push, `git log <upstream>..HEAD --format=%B | grep -i "co-authored-by"` MUST print nothing.
- Commits already pushed are not rewritten to remove a trailer: that needs a force-push to a shared
  branch. Only unpushed commits may be reworded, and only when asked.
- **Origin:** 35 of the first 64 commits carried a Claude co-author trailer the designer did not want
  on their work.
- **Enforcement:** `REVIEW` (the user setting turns the default off; the pre-push check above is the guard).

### §5.4 Labs never ship

`app/proto/**` is where screens are explored (options, variants, lab controls). It is not product: the
deployed site is built without it (both Pages workflows remove `app/proto` before `next build`).

- MUST NOT import anything from `app/proto` outside `app/proto`. What a lab and the product both need
  lives in `app/pages/_shared` (or `components/**`), and the lab imports it from there.
- MUST NOT link to a `/proto` route from a product or docs page, except through `labHref()`
  (`lib/lab-href.ts`), which shows the link in development and removes it in production.
- **Origin:** the Prototype tools bar was designed in `/proto/tools` and promoted; the designer asked that
  labs never reach the deployed site.
- **Enforcement:** `AUTO §5.4` (an import from `app/proto`, or a `/proto` link literal, outside `app/proto`).

### §5.5 Contracts load by scope

`CONTRACTS.md` is the one canonical text and keeps its clause numbers. What a session loads is generated
from it: `npm run contracts:rules` writes `.claude/rules/contracts-*.md` using the scope map in
`contracts/rule-scopes.json`. The core (how to read, Part I conduct, the process rules, and a one-line
index of every clause with the file that holds it) has no `paths` and loads at launch; the rest carries
`paths` and loads when a matching file is read (components, build, shell, prototyping, docs,
governance).

- MUST NOT hand-edit a generated `.claude/rules/contracts-*.md` file: edit `CONTRACTS.md`, then run
  `npm run contracts:rules`.
- MUST give a new clause a scope in `contracts/rule-scopes.json`; a clause with none fails the check.
- A scoped rule triggers when a matching file is opened with the Read tool, not when one is created, and
  not when a file is read or written through the shell. A task that starts a new file in a scoped area
  MUST first read the rule file the core index names for it (the hook below refuses the write until it has).
- **Every other way of touching a file:** a project hook (`.claude/settings.json`,
  `scripts/rules-for-tools.mjs`, tested by `npm run test:rules-hook`) covers what the Read tool does not.
  Before a change (a Write, an Edit, or a shell command that writes: a redirect, `mv`, `cp`, `rm`, `tee`,
  `sed -i`, `--write`, a script that writes), if the files being written have rules not in the agent's
  context, it refuses the change and lists them; the agent Reads them and makes the change again. This is
  what enforces reading the rules before creating a file. After a shell command, a Grep or a Glob that read
  files, it lists the missing rules for what was read; the agent MUST Read each one before continuing work
  in that area. Glancing (`ls`, `test`, `stat`, `wc`, `echo`, `git status`, `find` without `-exec`) lists
  nothing. What is in context is read from the agent's own transcript: a rule counts only if it was injected
  or Read since the last compaction, so a compaction or `/clear` can never leave a rule marked as loaded when
  it is not. If the transcript is missing or its format is not recognised, the hook warns on screen.
- **Relevance is set by folder, not by exclusion:** the loader ignores `!` patterns in `paths`. Code that
  is not a screen does not live under `app/pages/`, so screen rules never load for it.
- **Origin:** `CONTRACTS.md` loaded whole in every session while it kept growing; then a mock run showed
  rules arriving only by accident, or not at all when files were read through the shell.
- **Enforcement:** `AUTO §5.5` (a generated file is out of date, or a clause has no scope); the shell
  hook; `REVIEW` for following its list.

### §5.6 Merging another branch: ours stands, theirs is appended

When another person's branch is brought into ours (a teammate's `*-wips` into `sai-wips`, or the reverse), the
branch being merged in is read, never changed, and nothing of the receiving branch's numbering is overridden.
New information is appended after what is there. Nothing is lost, replaced or renumbered to make room.

1. **The incoming branch is not touched.** The merge, the renames and the fixes happen on the receiving
   branch, and only that branch is pushed. MUST NOT commit to, rewrite or force-push the incoming branch.
2. **No clause disappears, and no clause number is reused.** After the merge, every clause number in either
   side's `CONTRACTS.md` is in the result, with the same number and at least the same strength.
   - A clause only the incoming side has is added in its Part with the next free number in its series (the
     highest in use on either side, plus one), whatever number it had there. Every place the incoming work
     names it (a `AUTO §x.y` tag, a comment in `scripts/check-contracts.mjs`, a decision file) is updated to
     the new number in the same merge.
   - A clause both sides changed keeps both changes: the incoming sentences are added to ours, none of ours
     is dropped. Where the two contradict each other, MUST NOT pick one: ask the designer (§0.4) and leave
     both visible until answered.
   - MUST NOT weaken, shorten or drop a clause, an `Origin` line or an `Enforcement` tag to resolve a
     conflict. Removing a clause is a designer decision (§9.4), never a merge result.
3. **Generated and registered files follow their source.** `.claude/rules/contracts-*.md` are never merged by
   hand: merge `CONTRACTS.md` and `contracts/rule-scopes.json` (a union: every clause keeps a scope), then run
   `npm run contracts:rules`. `contracts/*.json` registers (`overrides.json`, `component-inventory.json`,
   `figma-colours.json`) are unions: MUST NOT drop an entry, and MUST NOT raise a ratchet count in
   `contracts/baseline.json` to make the merge pass (§9.4).
4. **Decision files keep their content and the receiving branch keeps its numbers.** An incoming
   `context/decisions/` file whose number is already used by a different file is renamed to the next free
   number after the highest in use that day (appended, never inserted, never swapping ours out), with its
   content unchanged. A reference to the old name is updated. Then `npm run context:index` rebuilds the
   index (never edited by hand, §5.1). The merge itself is logged as a new decision file that lists what came
   in, what was renumbered (old name, new name) and what is still open.
5. **Reference files (`.claude/rules/ref-*.md`, `CONTEXT.md`) are added to, not replaced.** Incoming
   paragraphs are added where they belong; where both sides edited the same paragraph, both versions stay
   until the designer chooses. A file that exists on both sides is never taken wholesale from either one
   ("local files kept" is not a merge).
6. **The order:** (a) fetch, then list what the incoming side changed in `CONTRACTS.md`, `contracts/`,
   `context/`, `.claude/rules` and `scripts/` (`git diff --stat <merge-base> <incoming> -- <those paths>`);
   (b) merge; (c) renumber and rewrite references as above; (d) `npm run contracts:rules`, then
   `npm run context:index`; (e) confirm no clause number from either side is missing and no decision file was
   lost (compare the two sides' lists of `### §` headings and `context/decisions/` file names against the
   result); (f) `npx tsc --noEmit`, `npm run check:contracts`; (g) log the decision; (h) push the receiving
   branch only, after the §5.2 trailer check has printed nothing.

- **Origin:** the 2 Oct 2026 merge of `mohan-wips` into `sai-wips`: both branches numbered that day's
  decisions from 01, so five numbers (01 to 05) were each used twice, and an earlier merge had kept local
  files over the incoming ones wholesale. The designer: "when normalised, we don't override any numbers.
  If there's new info, we simply append to ours without any clashes. No contracts can disappear."
- **Enforcement:** `AUTO §5.1c` (two decision files share a date and number; days up to 1 Oct 2026 had
  repeats before the check existed, are named in the contracts, and are not renumbered), `AUTO §5.5` (a clause
  in the scope map is missing from `CONTRACTS.md`, or has no scope), `REVIEW` for the rest, including the order
  in item 6.

### §9.5 Consequence

A violation blocks completion (§0.6). The audit verdict is **ATTENTION** if anything is flagged and
**CLEAN** only when nothing is.
