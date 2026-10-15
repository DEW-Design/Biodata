# 2026-10-15 - Merge origin/sai-wips (newsletter template) into the post-6-oct lab branch

- **Oct 15 2026: Merge origin/sai-wips (newsletter template) into the post-6-oct lab branch.** The designer asked for the branch `saimaniganahalli1/proto-post-6-oct-layout` to be merged with the latest on `sai-wips`. Done under CONTRACTS 5.6: the receiving branch is this one, `origin/sai-wips` was read and not changed.

  **Came in (2 commits, 7ab8ed9 and a2a9b5f):** the newsletter template at `/nltemplate` (`app/nltemplate/**`: blocks, infographic, data, frame, pages), its sample images and the white DEW lockup in `public/`, and 15 decision files (2026-10-08-01 to -03, 2026-10-14-01 to -11, 2026-10-15-01). No change to `CONTRACTS.md`, `contracts/`, `.claude/rules` or `scripts/` came in, so no clause was added, changed or renumbered.

  **Renumbered (5.6 item 4):** both sides had a `2026-10-14-01-*` decision file (ours: the nested rail row's left inset; theirs: the newsletter's picked template). Ours keeps its number; the incoming file is now `2026-10-14-12-newsletter-the-picked-template-option-7-with-the.md` (was `2026-10-14-01-newsletter-the-picked-template-option-7-with-the.md`), content unchanged. Nothing referred to the old name. `context/decisions/INDEX.md` was the only conflict; it is generated, so it was rebuilt from the files (`npm run context:index`), not merged by hand.

  **Before the merge,** the lab's uncommitted work (the nested rail, the notifications popover, the one-sheet project page, the icon Upload dataset, the rail hover inset, decision files 2026-10-13-01 to -08 and 2026-10-14-01) was committed on this branch so the merge had a clean tree.

  Verified: `npx tsc --noEmit` and `npm run check:contracts` clean after the merge. Not pushed.
