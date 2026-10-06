# 2026-10-04 - Merge flow applied: Mohan's five 2 Oct decisions renumbered 27 to 31, and a check for repeated decision numbers (5.1c)

- **Oct 4 2026: Merge flow applied: Mohan's five 2 Oct decisions renumbered 27 to 31, and a check for repeated decision numbers (5.1c).** The designer answered both open questions of `2026-10-04-01` with yes. First use of `CONTRACTS.md` §5.6.
  - **Renumbered (rename only, `git mv`, ours keep 01 to 26):**

    | Old name | New name |
    | --- | --- |
    | `2026-10-02-01-voucher-management-option-2-a-row-per-field` | `2026-10-02-27-...` |
    | `2026-10-02-02-voucher-management-ignoring-needs-a-reason-ignored-lines` | `2026-10-02-28-...` |
    | `2026-10-02-03-voucher-management-needs-review-shows-only-lines-to` | `2026-10-02-29-...` |
    | `2026-10-02-04-merge-main-sai-wips-pr-11-into-mohan` | `2026-10-02-30-...` |
    | `2026-10-02-05-notification-message-uses-the-rich-text-editor-artefacts` | `2026-10-02-31-...` |

    The new numbers are the next free ones after the highest used that day (26). Content is unchanged except two references between his own entries: the old `Follows 2026-10-02-01.` is now `-27` and `Follows 2026-10-02-02.` is now `-28`. Nothing else in the repo named the old files (the index is regenerated). `mohan-wips` was not touched.
  - **`AUTO §5.1c` added to `scripts/check-contracts.mjs`:** two decision files sharing a date and number fail the check, with the §5.6 remedy in the message. Tried against a deliberate duplicate (fails) and without it (passes). Days up to 1 Oct 2026 already repeat numbers (30 Sept 03 to 22, 1 Oct 01 to 10, from before the check and quoted by name in the contracts), so the check starts after 1 Oct (`LEGACY_REPEATS_THROUGH`); they are not renumbered. This changes a guard script, which `CONTRACTS.md` §9.4 flags in the audit; it was asked for by the designer.
  - **`CONTRACTS.md` §5.6 enforcement line** now names `AUTO §5.1c` and `AUTO §5.5`; `.claude/rules/contracts-core.md` regenerated.
  - **Verified:** `check:contracts`, with the index rebuilt (345 decisions).
  - **Open:** the two commits on `sai-wips` with a Co-Authored-By trailer (bf283b5, bc8ad0f) await the designer. Not committed, not pushed.
