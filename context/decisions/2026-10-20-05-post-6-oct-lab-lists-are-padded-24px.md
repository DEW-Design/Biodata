# 2026-10-20 - Post-6-oct lab: lists are padded 24px, as Home and the project page

- **Oct 20 2026: Post-6-oct lab: lists are padded 24px, as Home and the project page.** The designer, on a screenshot of the lab's Projects list: "we need to make the padding consistent with home and project
  detail. I like the padding on home and project detail. Just need to make sure the concentric corner radii is applied all across to make the ui look much nicer."
  - **What was wrong (`shell.tsx`):** a list's toolbar and header were padded 24px by the lists' shared body (`p-6`), but its sheet (the table card) was pulled out to 4px from the panel's edge on the left,
    right and bottom by a descendant selector on `<main>` (`[&_.flex-col.p-6>.overflow-hidden.rounded-xl]:-mx-[21px]` and `-mb-[21px]`, put in so the sheet's 12px corner was the panel's 16px less a 4px gap,
    CONTRACTS 2.13). Measured: the sheet's left edge 3px from the panel's inner edge, the search above it 24px, so the page had two insets. Home and the project page put their cards 24px in.
  - **The fix:** the override and its selector are gone (the one place in the lab that pulled content out of its padding, searched). Every list now has the one inset the body gives it. Measured in the browser,
    the sheet is 24px from the left, right and bottom of the panel and 1104px wide, the same as Home's hero and cards, for Projects, Data Licencing Agreement, Data Sharing Agreement, Sensitive Nominations,
    Template Finder and the Admin lists (User Management, Taxonomy Management, Notification Management, Controlled Vocabulary: 24, 24, 24; Voucher Management and Reports draw no sheet).
  - **Concentric corners, checked everywhere they can meet (2.13):** a scan of every rounded box in the panel against its nearest rounded ancestor, on Home, Projects, the project page's four tabs and its records
    tree and properties panels. Two boxes' corners meet only where the inner's corner is inside the outer corner's radius-by-radius square (both gaps smaller than the outer radius). At 24px the sheet is 25px
    from the panel's corner (with the border), more than its 16px radius, so the curves do not meet and the sheet keeps its own 12px radius, as Home's cards do; the panel bar's chip (16 less 8 = 8), the
    view tabs' segments (10 less 4 = 6) and the property panels' buttons are concentric as measured. **One miss, not changed (a production file):** the record panel's header on the Project records tab
    (`app/pages/project-detail/record-panel.tsx`, the header at about line 779) has a 28px icon button (6px corner) 6px from the top and 8px from the right of its 12px card, so its insets disagree: 6px both ways
    would make 12 less 6 = 6 exact (the header's right padding to 6px), or 8px both ways with a 4px corner. The same file is the real project page's, so this is the designer's to say (CONTRACTS 0.4).
  - **A clause to settle (not edited):** 2.13 says the inner radius is 0 where the gap is the same as or more than the outer radius, and also says it applies only where corners meet. Home and the project page
    (and now the lists) rely on the second: cards with 12px corners 25px from a 16px panel. If the first were read literally those cards would be square. The wording could say plainly that a box whose corner is
    outside the outer's radius-by-radius corner square keeps its own radius. Proposed, not changed: the contracts are the designer's.
  - **Open:** none from the change itself. Nothing outside `app/proto` was touched by this change. Not committed.
  - **Verified, in a browser (Playwright, scripts outside the repo):** the insets and the corner scan above, the Projects page looked at after the change (the table's left edge on the search's and the header's),
    zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a very short window (the sheet keeps its `min-h-48` floor, not exercised here), the
    Registered User's and the Signed out visitor's lists (the same body; the inset does not depend on the role), and the table's hover and focus states at the new inset. Typography QA (0.6 item 8): no text
    changed. Not committed.
