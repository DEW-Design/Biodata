# 2026-10-19 - Post-6-oct lab: the attachment is labelled Add an attachment, and the bar's icon buttons take the tweaked frame

- **Oct 19 2026: Post-6-oct lab: the attachment is labelled Add an attachment, and the bar's icon buttons take the tweaked frame.**
  The designer: "in the + menu, label = [Add an attachment]. Not the whole thing", and "I tweaked the design of the icon buttons"
  (Figma `bgksKvmSaVR7ZptB98LzGr`, node 484:4051). This corrects `2026-10-19-09-*`, which called the item "Add an artefact and attachment".
  - **The label:** the "+" menu item, the form's title and description, its toast ("Attachment added") and the signed out prompt ("Sign up to
    add attachments") now say "attachment" alone. The tab the item lands in is still "Artefacts and attachments", and the data model still
    calls the thing a file on a field; only the words on the new controls changed. The form's file name `add-artefact-modal.tsx` is unchanged.
  - **The icon buttons (`barBtn`, `panel-controls.tsx`):** the frame, fetched by node (2.5), now draws every button in the project bar as
    a white 24px circle with a 1px border of black at 10% and a 12px icon at 60% black; it replaced the grey fill of node 484:4034.
    In tokens (2.1, nothing hard-coded): `bg-primary` (white, exact), `border-secondary` (Gray 200 #e5e4e2; 10% black is #e6e6e6) and
    `text-tertiary` (Gray 600 #706b68; 60% black is #666666). The frame draws no hover or on state, so these are the lab's: hover takes the
    page's hover fill and a darker icon; a button that is on (the records tree, the properties) a tertiary fill. Applies to the "+", the
    records tree, Copy link, Properties and the "..." menu, and to the "More actions" button of the panel bar that shares `barBtn`.
    The 32px round buttons in the rail and tab strip (Add, the bell, New tab, the left panel switch) are not in this frame and are unchanged.
  - **The upload button (`upload-status-button.tsx`) follows node 484:4068:** a white circle with no border; in its place a thin ring on the
    edge (1.2px) that is the progress, its track at 10% of the colour; when the run fails the ring is left where the run stopped and the
    icon is an octagon alert in red. Added and partly added are not in the frame, so they keep the check circle and the triangle with a full
    ring in their colour. The state colour is kept on hover.
  - **Open:** (1) the frame's failed icon is the octagon alert, but the project's notices, the bell's rows and the popover's reasons still use
    the alert circle for the same state; one icon per concept (2.4) means one of them should move, and which is the designer's call (the
    popover's reasons are the product's shared ingestion detail); (2) the frame's other states, the running ring and the finished ones, are
    this lab's reading; (3) the earlier question of swapping these hand-built buttons for `ButtonUtility` is moot while the frame draws them,
    so they stay hand-built, tokens only.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the lab files and `npm run check:contracts` clean. The frame's spec was read from the six
    node exports (circle fill, stroke, opacities) because the buttons come back as flattened vectors. **Not verified:** a live browser pass
    (the new look of every bar button in rest, hover, on and focus states; the ring in each state; the menu label), because no browser tool
    was available. Typography QA (0.6 item 8) not run: the only text changed is the menu label, the form title and description, the toast and the
    prompt. Not committed.
