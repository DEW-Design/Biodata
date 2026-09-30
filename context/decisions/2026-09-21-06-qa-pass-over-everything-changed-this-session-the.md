# 2026-09-21 - QA pass over everything changed this session (the Final check contracts plus the post-ingestion QA

- **Sept 21 2026 QA pass over everything changed this session (the Final check contracts plus the post-ingestion QA
  checklist).** `tsc` and `eslint` clean on every touched file; 40 live page loads (all six roles across the five
  canonical pages, plus the lab, both `/test-*` screens and the Accordion/Table/Tabs docs) with no console or page
  errors; nav and config still alphabetical; no new dead utility classes, no em-dashes or arrow characters in added
  UI copy. Findings, all fixed in the same pass:
  - **`Accordion`'s new `boxed` title wraps but had no `text-balance`** (QA item 6) - added. Confirmed live that the
    boxed title, which sits inside `.prose-doc` on its own doc page, also picks up none of the doc-site heading rules
    (it is a span, not a heading).
  - **`/test-site-details` still called its Accordion "composed, not a real component"** after `Accordion
    variant="boxed"` landed - the flow-through contract. Swapped for the real component (a thin local wrapper adapts
    the title-plus-children call sites and keeps every section open on load, as the frame draws it), the mapping row
    and gap cards updated, and the composed version's dead `text-md` title class disappeared with it. The page keeps
    its own `rounded-lg` radius via a class override on the wrapper so nothing changed visually.
  - **The Table doc page didn't document the branch's new API** - `size="xs"`, `bodyScrollable`, `sticky`,
    `TableCard.PaginationNumbered`, `tableCardPaginationRange` - and still said numbered pagination wasn't built.
    API table corrected, a live "Numbered pagination" demo added, and the Figma-gap note dropped.
  - **Checked and clean:** portaled content carries Barlow (the sign-up modal, and the tooltip's text nodes - the
    outer overlay wrapper reads Geist but holds no text), the shell header is a top-level sibling on every shell, and no
    `components/base/**` change was made for a doc-only need.
  - **Known gap: `/test-site-details`' Figma frame could not be audited.** The Figma file returned "no access" when
    the swap was made, so neither the composed radius (8px) nor the real variant's default (6px) is verified against
    frame 88:11339. Revisit when file access is granted: compare the accordion radius, then drop the class override if
    the frame matches the component.
  - **Known gap: two dead utility classes in throwaway labs, present before this session:** `border-l-brand-solid` in
    `/proto/dashboard-options` and `border-error-subtle` in `/proto/data-model-stress-test` (neither exists in
    `app/globals.css`). Not fixed - the labs are not part of this work.