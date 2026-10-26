# 2026-10-23 - Popups: what Mobbin shows for dim, edge and both, and what a dim would touch

- **Oct 23 2026: Popups: what Mobbin shows for dim, edge and both, and what a dim would touch.** The designer: "Can we look at patterns across /mobbin for popup? is dim or both the usual option? How would this
  behaviour affect other component behaviours?" Follows `2026-10-23-14-*` (the Popup tool: as the design system draws it, a stronger edge, dim, both), which recommended dim and left the choice open. Research only
  (CONTRACTS 2.6: ingest, extract, propose a list and stop): no code changed, the Popup tool is as it was.
  - **What was looked at:** six Mobbin searches, 8 results each (web: a switcher with search, a dropdown with the page dimmed, a menu on a card, a filter popover on a white table, a workspace switcher; iOS: a
    context menu with a blurred background). 48 screens, of which 44 were used (a settings page that is not a popup, a closed select and two unreadable iOS captures were left out). Each is cited by its Mobbin link in the
    session report. No `ai_usage_notice` came back with any result.
  - **Finding 1: for an anchored popover on the web, elevation alone is the norm; a scrim belongs to the centred overlay.** 22 anchored menus and popovers (Basecamp, Threads, GetYourGuide, Cosmos, Dovetail,
    StackAI, Meetup, Fabric, Notion, Zoom, Microsoft Loop, Wix, Zapier, Clay, Sketch, Twenty, Snowflake, Linear, Obvious, Air, Plane, Postman) show no scrim. One (Amazon's account flyout) looks dimmed. All 11
    centred overlays (command palettes, search dialogs, small dialogs: [untitled], Craft, Lovable, Frame.io, Navattic, Hex, Wrike, Adaline, Braintrust, Etsy, GoFundMe) are dimmed, four with blur. Asking
    Mobbin for "a dropdown with the page dimmed" returned mostly dialogs, not dropdowns.
  - **Finding 2: "both" (a scrim and a strong edge) is the recipe of a dialog, not of a popover.** A dialog always has a scrim and a shadow. No anchored popover in the sample has both, and the one dimmed anchored
    popover dims the whole page, never one card.
  - **Finding 3: a popover inside a dialog adds no second scrim.** Vapi, YouTube Music, Modal and ClassDojo each show a select open inside a dimmed dialog: one scrim, owned by the dialog, and the select is raised
    by its shadow and edge only.
  - **Finding 4: on a white surface, products separate a popover without dimming.** Seen: a visible 1px grey edge plus a shadow (Zapier, Twenty, Postman, Linear, Notion); a solid or inverted surface (Basecamp's blue
    panel, Fabric's dark menu); a canvas under the popover that is not white (Linear, Plane, Air, Snowflake); a popover that opens off the card onto the page (Threads, Cosmos, Meetup). Judged on 768px
    screenshots, not measured.
  - **Finding 5: on iOS the background is often defocused.** A long-press context menu is blurred and dimmed (Clubhouse); the glass popover menus soften the content behind (Grok, Apple Notes, Notion). Craft and
    Apple Photos show no scrim. There is no hover on touch and the menu is the one thing to act on; it is a different input model from this app's desktop screens.
  - **What a dim would touch (read from the repo, nothing run):**
    - Dim already means "this blocks you" here: `bg-overlay` (black 40 per cent, blurred) behind modals at `z-[20000]`, and 70 per cent of it with a 2px blur behind the edit drawer, the expandable map and the side panel.
      A 10 per cent, unblurred dim for a popup would be a third dim with a third meaning. The nearest written position on dimming is 4.8 item 3 (editing in place: "MUST NOT dim or lock the other cards").
    - The design system `Popover` (`components/base/select/popover.tsx`) is imported directly by 12 files outside the labs and wrapped by `Select`, `ComboBox`, `MultiSelect`, `TagSelect`, `Dropdown`, the date field and
      the date range. A dim put in the component reaches all of them (a four-row select would dim a page); one put at a call site is a one-off pattern (0.9 item 3).
    - react-aria's `Popover` is modal by behaviour: no caller sets `isNonModal`, so it draws a full-viewport underlay, is a `role=dialog` and the rest of the page is inert while it is open, with a click outside only
      closing it (light dismiss). A dim would make the look match what the page already does; it would not change behaviour.
    - The card's dim is keyed to `group-has-[button[aria-expanded=true]]/card:`, so any expanded button in the card (a disclosure, a later select) would dim it. A popover that opens another (the filter menu's value
      submenu) would keep one dim lit through both levels, and a select inside a modal would sit over two.
    - `lib/layers.ts` has no level for a popover scrim: the card's is local (`z-20` inside the `z-[1000]` panel, under the popover's own 100000); a page-level one would need a new level, and between 1000 and 10000 it
      leaves the Prototype tools bar undimmed, above it covers it (3.8).
    - `popover.tsx`'s own enter and exit (`animate-in fade-in`, 150ms) has no `motion-reduce` variant in the file; whether the global styles handle it was not checked. The card's dim has one.
    - **Not checked:** toasts over an open popup, touch, forced-colours mode, and whether any other screen has an expanded button inside a card that would trigger the dim.
  - **Recommendation (a designer decision, 0.4):** do not dim, and do not take "both". The market sample says the usual answer is a visible edge and a shadow, with a scrim kept for modals. That reverses the
    recommendation in `2026-10-23-14-*` (dim), which was made from this one card; the earlier note that "a stronger edge" was a modest gain on this card still stands, so the thing to look at next is the
    popover's edge against Zapier's, Twenty's and Linear's, not the dim. The edge is a change to the shared `Popover` tokens (the ring and the shadow step), which reaches every popover and is an override of 1.5 and 1.9
    needing a record in 9.1, so it is the designer's to authorise. If this card needs more than that, the other levers seen are a non-white surface under the popup and the open name already tinted and anchored.
  - **Open:** (1) which Popup treatment to keep, then the other options are deleted (4.4); (2) whether the edge is changed in the `Popover` itself or only at this card; (3) whether anything in the product should dim
    for a non-modal popup at all. Typography QA (0.6 item 8): no text changed. Not committed.
