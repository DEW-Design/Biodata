# 2026-10-19 - Post-6-oct lab: the notifications split into Inbox, Activity and Archive, with two-line rows, day headings and folded uploads

- **Oct 19 2026: Post-6-oct lab: the notifications split into Inbox, Activity and Archive, with two-line rows, day headings and folded uploads.**
  The designer, on a screenshot of the bell's popover: "the notifications bit looks really confusing, can we please refine this experience? also,
  let's look at /mobbin for patterns to make nicer", then, to the proposal below, "Split into three tabs, let's see how it looks." This corrects
  the Filter menu added in `2026-10-19-07-*`.
  - **What was confusing:** the Inbox held 17 rows, 16 of them "<same long file name> was added to <project>", each unread, and the one failure
    was fourth among them; the count read as 17 things to do; what differed between rows (the project, the date) was the least visible part; three
    controls (the Inbox and Archive tabs, the Filter and "Show all activity") answered one question; the Filter's "1" did not say what was on.
  - **Patterns taken (Mobbin, 2.6; proposed and approved before building):** Slite's "where you're needed" against "nice to see" tabs; Fireflies'
    day headings; Jira's and Qatalog's two lines; Air's several uploads folded into one event; Proton's and fal's quick tabs for the kind of row.
    Hashnode's and Klaviyo's import results (one quiet line, the detail on the job) confirmed that a success is not an alert.
  - **Three tabs (`notifications-popover.tsx`):** **Inbox** is what asks something of the person: a failed or partly added upload, a request, a
    nomination, flagged concepts. It is the only tab with unread dots, Done and "Mark all done", and the tab's count and the bell's dot are made of
    it alone. **Activity** is the log of what only tells them (an upload that was added): read only, never unread, nothing to mark. **Archive** is
    what was marked done. Which a row is is `attention` on the row (`attention.tsx`); `upload-activity.ts` sets it false only for an upload added.
  - **Rows:** an upload is two lines: what happened in bold ("Upload failed", "Upload partly added: 4,153 rows could not be placed", "Upload
    added"), then the file and the project, muted and cut with an ellipsis; the time stays at the right. A row with no file (a request, a
    nomination, the flagged concepts) is the sentence it was. Type is taken from what is already there (2.9): the bold segment's
    `text-sm font-semibold text-primary` for the title, `text-sm text-tertiary` for the detail, the time's `text-sm text-quaternary`, and the
    day heading is the Dropdown section header's `text-xs font-semibold text-quaternary`.
  - **Day headings:** Today, Yesterday, Earlier, newest first; a row with no date (the flagged concepts) comes first under none.
  - **Folding:** uploads that ended the same way, in the same project, on the same day become one row ("3 uploads added", "<file> and 2 more
    · BD-5039", the newest time, a chevron) that opens in place to list them, each still opening its dataset and, in the Inbox and Archive, with its own
    Done. A folded group has no Done of its own.
  - **The kind tabs** (All, Uploads, Requests, Nominations, Flagged, Tasks; the DEW `TabList` in its grey button type, small) replace the Filter
    button and "Show all activity": one control instead of three. Drawn only on a tab whose rows are of more than one kind (2.12), single choice,
    applied as chosen, kept with the inbox state; a tab that has none of the chosen kind shows All. Mark all done acts on what is listed. Its
    earlier wording "Data licence requests" is "Requests" here, to fit five in a 380px popover.
  - **Not what it seemed:** the earlier note that the pinned "Mark all done" clipped the last row was wrong: that was the list scrolling inside its
    box. Folding makes the list short enough that it rarely does.
  - **Open:** (1) Activity today holds only successful uploads, so it never shows kind tabs; it is where other "FYI" events would go (a request
    approved, a nomination decided) and none exists yet; (2) a success can no longer be unread, which settles the question left open in
    `2026-10-19-07-*`; (3) whether Archive should also take Activity rows, which cannot be marked done; (4) groups fold by day in UTC.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean. **Not verified:** a live browser pass
    (the three tabs and their counts for the Super Admin and the Registered User, the unread dot, a folded group opening and closing, the kind tabs
    and their horizontal scroll at 380px, Done and Move back, keyboard order, nested tabs inside a tab panel), because no browser tool was
    available. Typography QA (0.6 item 8) not run: no new text layer, each treatment is one already in use, as listed above. Sibling grep:
    `useInboxState` and `NotificationsBell` are used only by `shell.tsx`. Not committed.
