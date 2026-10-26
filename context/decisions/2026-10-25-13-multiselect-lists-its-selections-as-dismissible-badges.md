# 2026-10-25 - MultiSelect lists its selections as dismissible badges

- **Oct 25 2026: MultiSelect lists its selections as dismissible badges.** The designer, from the Select doc page: "Everywhere we use this
  component, the selections must be shown with the dismissible badge below", like the Badge page's dismissible badge, "but dont make the
  letters all caps."
  - **Changed (components).** `MultiSelect` (multiple mode) lists each selection under the field as a `BadgeWithButton` (gray pill, sm for a
    sm field, md otherwise); its x removes that one, and focus moves to the badge now in its place, the one before it, or the field when none
    are left (1.9 item 3). On by default, so every caller has it (1.3); `showSelectedBadges={false}` turns it off and no caller uses it. Single
    mode is unchanged. Labels are remembered as items are seen, so a badge keeps its name while a search hands over only the matches.
    Uncontrolled use now keeps its selection in the component, so the trigger's count and the badges agree (no caller is uncontrolled today).
    `BadgeWithButton` gains `uppercase` (default true, every other badge unchanged, 1.6); the selection badges pass `false`.
  - **Fixed on the way (same component).** `MultiSelect` never declared `aria-label`: eight callers pass it and it was dropped (a hyphenated
    JSX prop is not type-checked), so those fields had no accessible name. It is now a prop: the trigger reads "Observers, 2 selected", and the
    list and badge group take the name.
  - **Docs.** Badge page: `uppercase` in the API table and a sentence-case example. Select page: the MultiSelect line names the badges and
    `aria-label`.
  - **Verified.** `eslint` clean on every touched file, `tsc` clean except the two stale `.next/types` option-2 stubs, `check:contracts` OK.
    Live: Select doc page (add by click and Select all, remove by click and by keyboard Enter, focus moves to the next badge, then to the
    field); a record's Observers field in edit mode shows its two observers as badges. Computed: Barlow 14px semibold, text-transform none,
    letter-spacing normal, 32px tall, 6px under the field. No console errors from the app. Typography skills (0.6 item 8) not run; the text
    treatment is the design system badge's own, with only the case changed as asked.
  - **Open.** The trigger still says "2 selected" above the badges that list them (4.3, a fact in two treatments): keep, or show the
    placeholder once badges are there? Project registration's concept rows (`concept-rows.tsx`) put the chosen names in the trigger
    (`selectedCountFormatter`), so the names now appear twice there.
