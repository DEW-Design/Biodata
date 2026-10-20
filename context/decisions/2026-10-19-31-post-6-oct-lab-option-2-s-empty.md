# 2026-10-19 - Post-6-oct lab: option 2's empty panel bar holds the user alert, and the two kinds of message are named

- **Oct 19 2026: Post-6-oct lab: option 2's empty panel bar holds the user alert, and the two kinds of message are named.** The designer, on an annotated screenshot of
  option 2 on a project page, pausing the top right to resolve it first: at the panel's bar, "looks empty - how should this be fixed?"; at the "7 flagged" chip, "this could be
  a user-specific alert that could sit on top"; at the "4 notices need attention" banner, "I'm calling this system-notif / alert"; and "under this section".
  - **The vocabulary (adopted, written into `project-notices.tsx` and the lab's comments):** a **user alert** is specific to the person (the flagged concepts they can review); a
    **system notification** is what the system has to say about the project (the banner of uploads that failed or were partly added). The bell's rows are a third thing, the
    person's inbox, and keep their own words.
  - **The fix for the empty bar, option 2 only (`FlaggedAlert`):** on a project page the bar's left now holds the user alert: a warning flag and "16 flagged concepts need review in
    this project" (the count in the bar's text weight, `font-medium text-primary`; "1 flagged concept needs review"), a chevron, the whole line one button that opens the
    flagged concepts, as the chip did. It is drawn only for a role that reviews them and only while one is open (`useCanReview`, `useReviewItems`), as the chip was. The "7 flagged"
    chip is then not drawn beside the title in option 2 (it would say the same thing twice, 4.3). Option 1 keeps the chip and a bar with the trail.
  - **The system notification stays under the tabs** (the summary row and its list, `ProjectNotices`), in both options, as before; "under this section" was read as that.
  - **How it is built:** the bar is drawn by the shell, outside the project page's data, and the alert needs the project's flagged concepts. So the bar leaves an element at its left
    (`PanelBar` `lead`, kept by the shell as `barLead`), and the project page draws the alert into it (`createPortal`, from `ProjectWorkspace` `alertSlot`); the slot is `undefined`
    in option 1, so the header knows whether to draw the chip. The element is a `role="group"` named "Alerts for you".
  - **Open:** (1) a person with nothing to review has no alert, so the bar at the left is empty again for them (a Registered User, or a reviewer with none open): the same "looks
    empty" for the roles that most need the page to be quiet. Options: leave it, since an absent alert is honest (2.12); move the project's buttons into the page header and draw
    no bar when there is no alert; or give the bar's left the page's own tabs. Not decided; (2) other user alerts (a request awaiting this person's decision, a nomination) are not
    on a project page and so are not here; the same slot could take them; (3) "under this section" could also mean the bar itself is "under" the top row, in which case the system
    notification would move up too; it was not moved; (4) the top right of the top row is untouched, paused as asked.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean; option 2 serves (200). **Not verified:** the alert in the bar (its
    size and weight on the Gray 100 bar, the hover fill, the button opening the flagged concepts), the chip gone from the title in option 2 and back in option 1, and
    the bar for a role with nothing to review, because no browser tool was available. Typography QA (0.6 item 8) not run: the alert's wording is the old banner's
    ("need review in this project"), at the bar's `text-sm`, with the count in the weight the notice rows use. Not committed.
