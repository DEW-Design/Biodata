# 2026-10-19 - Post-6-oct lab: the upload pill becomes a temporary icon, uploads join the bell, and the bell gets a Filter

- **Oct 19 2026: Post-6-oct lab: the upload pill becomes a temporary icon, uploads join the bell, and the bell gets a Filter.** The
  designer, on the ingestion pill in the project bar (about 480px wide: the file name and its status in 10px capitals on a grey fill,
  from the wireframe, Figma 484:4056): "taking too much space, what should it be instead? ... this is mainly to track the progress of
  uploads", then "this is a temp icon ... this needs to show up in the activity notifications as well ... a filter for uploads in the
  activity notifications popup." The recommendation (an upload icon with a progress ring, not a refresh icon) was put and taken forward.
  - **The icon (`upload-status-button.tsx`):** one 24px round button like its neighbours (`barBtn`). While the upload runs: the upload
    icon in a ring that fills with the percentage. When it ends the ring completes in the result's colour and the icon says which
    (check circle added, triangle partly added, alert circle failed: the same icons as the project's notices and the bell; the
    partly added chip used an eye before). The tooltip and accessible name carry the file name and result; the end of the run is also
    announced once through a visually hidden status. Pressed, it opens the unchanged popover (stages, reasons, actions).
  - **It is temporary:** drawn while the run goes and for a minute after it ends, whatever the result (`ProjectIngestionChip transient`).
    Before, a failed or partly added run stayed until the next upload on that project; in the lab that is now carried by the project's
    notices and the bell. The product page's chip is unchanged (button, chevron, the old persistence). Only uploads made in this
    browser have an icon; the Adelaide Hills sample uploads have none.
  - **Product files, opt-in only (1.6):** `IngestionChip` takes `trigger` (a node in place of the button) in place of the in-progress
    `pill` prop, and `ProjectIngestionChip` takes `Trigger` (a component given the run) and `transient`. The in-progress pill was removed
    with its 10px capitals and primitive grey (2.9, 2.1). A component, not a function called while rendering, because the React Compiler lint
    rules reject the latter.
  - **The bell (`upload-activity.ts`, `attention.tsx`):** each upload whose run has ended is a row: "<file> was added to BD-5039",
    "... was partly added to BD-5039. 4,153 rows could not be placed.", "... could not be added to BD-5039", with the status icon and
    tone, dated (an upload made here when its run ended, a sample by its upload date), opening that dataset on the project page.
    A run still going is not a row; it is the icon. Read from the same datasets and outcomes as the Datasets view and the notices
    (`useProjectDatasets` for Adelaide Hills, the store for other projects), so they agree. Every signed in role gets them; a signed
    out visitor gets none. They are in the Inbox, so the unread dot counts them.
  - **The Filter (`notifications-popover.tsx`):** every row has a kind (uploads, data licence requests, nominations, flagged concepts,
    your tasks). A "Filter" button under the Inbox and Archive tabs is the product's own (4.2d: secondary, small, the filter icon, a
    count badge while on, a menu with end checkmarks, several kinds at once, applied as ticked, no Apply button), plus "Show all
    activity" while one is on. It is drawn only when the rows are of more than one kind (2.12). It narrows what is listed in both
    tabs; the Inbox count and the bell's unread dot stay the whole inbox's, so a filter never hides that something needs attention.
    "Mark all done" acts on what is listed. An empty filtered list says what it was narrowed to. The filter is kept with the inbox
    state, so it is still on when the bell is opened again.
  - **Open:** (1) a success is a notification and counts as unread; whether a success should be quiet (listed, never an unread dot) is
    not decided; (2) the sample uploads appear as dated rows (Nov 2025, Feb 2026); they are mock data like the notices; (3) the
    registered user's Home tasks are classified by the page they name (a request, a nomination), and one that names neither is "Your
    tasks"; (4) an upload shows in the bell only after it ends, so there is no entry for "started".
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on every touched lab and ingestion file, and `npm run check:contracts` clean.
    **Not verified:** a live browser pass (the ring filling and ending in each state, the popover from the new trigger, the bell with a
    filter on and off for the Super Admin and the Registered User, an empty filtered list, nested popover and menu layering), because no
    browser tool was available. Typography QA (0.6 item 8) not run: no new text layer, the rows use the bell's existing sentence
    treatment and the Filter is the product's. Sibling grep: `IngestionChip` and `ProjectIngestionChip` have other callers (the product
    project page, the dataset-ingestion lab) that pass none of the new props. Not committed.
