# 2026-09-23 - `components/base/textarea/textarea.tsx` ingested (Untitled UI CLI), closing the "Purpose of Data

- **Sept 23 2026: `components/base/textarea/textarea.tsx` ingested (Untitled UI CLI), closing the "Purpose of Data
  Sharing" gap the DSA entries above log and the "Location Comment" gap `/test-site-details` logs.** `TextArea`
  composes the same shared `Label` and `HintText` (`components/base/input/label.tsx`/`hint-text.tsx`) `Input`
  already uses - its two real dependencies are those two shared files, not new ones of its own. `Label` already
  wraps `Tooltip`/`TooltipTrigger` (`components/base/tooltip/tooltip.tsx`), so `TextArea`'s own `tooltip` prop is
  the same already-shipped, already-audited Tooltip integration Input's `tooltip` prop uses - confirmed live (the
  `HelpCircle` trigger and its `text-fg-quaternary`/`hover:text-fg-quaternary_hover` classes render correctly in
  the doc page's SSR output) rather than assumed from the import alone.
  - **Attach primitives**: every class in `textarea.tsx` (`bg-primary`, `ring-primary`, `ring-brand`,
    `ring-error_subtle`, `ring-error`, `text-placeholder`, `autofill:*`) is the exact class chain `Input`'s own
    base field already uses, checked individually against the live `app/globals.css` - all real, all resolve, no
    dead classes shipped with this ingest. `font-barlow` was already present on the field wrapper (copied from
    Input's own pattern), so no gap there either.
  - **Doc page** (`app/(docs)/components/textarea/page.tsx`) follows the full template - Playground, Sizes,
    With hint text, **With tooltip** (added this pass - the doc page had the prop in its API table but no live
    section demonstrating it, so the Tooltip dependency wasn't actually shown working anywhere on the page; fixed
    to match `Input`'s own "With tooltip" section, plus a matching `tooltip` feature key in
    `config/design-system.config.ts` and the `ContextualConfigPanel` toggle list), Disabled, Invalid, API, Usage,
    an honest "not linked yet" Figma placeholder. Slotted alphabetically in both `lib/nav.ts` and
    `design-system.config.ts` (`tabs` -> `textarea` -> `toast`).
  - **`/pages/_shared/dsa/dsa-form.tsx`'s "Purpose of data sharing" field** now renders the real `TextArea`
    (`label`/`hint`/`isInvalid`/`rows`/`value`/`onChange`) in place of the `GapField` `?` marker, and
    `validateDsa` (`dsa-data.ts`) now requires it on submit - the `purpose` field and its seed data already existed
    (added when the DSA workflow first shipped, anticipating this ingest), so this closes the gap without touching
    the data model. `errorTab` already routed `purpose` to the "Agreement" tab, so the form's per-tab error count
    was correct with no further change. The deep-dive (`dsa-detail.tsx`) already rendered `dsa.purpose` with an
    honest "Not provided" fallback, so the whole path (form -> validation -> store -> deep dive) is now real
    end to end - verified live via a real `<textarea>` rendering on `/pages/dsa/new`.
  - **`/test-site-details`'s "Location Comment" `GapField`** (per the flow-through rule under "Generated screens"
    above) was swapped for the real `TextArea`, wrapped in the same `Inspectable` pattern every other real
    component on that screen uses (`textareaTokens`, mirroring `inputTokens` exactly since `TextAreaBase` shares
    the identical class chain). The now-unused `GapField` helper was deleted, the mapping table gained a
    "Free text (2000-word comment)" row, and the "New components identified" section's prose/gap-cards were
    updated to state that no component gaps remain on that screen (Radio and Textarea were the only two, both
    now resolved).
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, and a live pass via `curl`'d SSR output
    (no browser-automation tool was available in this session) confirming: the textarea doc page's Playground,
    Sizes, "With tooltip" section (real `HelpCircle` trigger with correct classes), Disabled, and Invalid sections
    all render real `<textarea>` elements with the expected class chain (including `ring-error_subtle` on the
    Invalid demo); `/pages/dsa/new`'s "Purpose of data sharing" field renders a real `<textarea>`; and
    `/test-site-details`'s "Location Comment" row renders a real `<textarea aria-label="Location Comment">` with
    no `?` marker left on the page. Full interactive hover/focus verification of the tooltip and resize-handle
    wasn't done in a live browser this pass (no automation tool available) - the wiring is otherwise identical to
    Input's already browser-verified Tooltip integration, so it inherits that verification rather than duplicating
    it blind.