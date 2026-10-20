# 2026-10-19 - Post-6-oct lab: tabs aligned to common behaviour, and option 2 stops naming the page twice

- **Oct 19 2026: Post-6-oct lab: tabs aligned to common behaviour, and option 2 stops naming the page twice.** The designer, on option 2 of the frame
  (`2026-10-19-22-*`): "Does having tabs make sense? Without changing the functionality or layout too much can we align it to current behaviour
  patterns? /mobbin this please. Also, keep working on option 2."
  - **Mobbin (2.6; web, 28 screens over three searches):** the strip at the top of a web app is almost always global navigation on the left (Aboard,
    Xero, Deel, fal, ClickUp, Cloudflare) and the global tools on the right (search, create, notifications, help, account), and the tabs that
    appear are views of one thing (Overview, Board, List in Asana; Reconcile, Bank statements in Xero; Documents and Customers in Square). A strip of
    open pages that can be closed, reordered and added to is a desktop-app pattern (Notion, Figma, VS Code, a browser), where the app has no browser
    around it. The nearest web case seen is Relevance AI's editor ("Timeline" with a "+"). None of the 28 had open-page tabs as the main frame.
  - **The answer to "does having tabs make sense":** it is a deliberate departure from the web norm, and it earns its row only if people hold several
    projects or records open to compare them; with one tab, which is most of the time, the strip carries a label and nothing else, and the browser's
    own tabs already do the job of "open this in another place". There are also three layers of tabs on a project page (the window's, the page's views,
    the content's), which Mobbin's examples keep to two. Kept, because removing it changes the functionality and the designer asked not to; the
    alternative (the strip becomes the section navigation and the open pages go to a Recent menu) is recorded below as the larger option.
  - **What was added to the tabs, both layouts, no visual change (`shell.tsx`):** (1) asking to open a page that is already open in a new tab (Cmd
    or Ctrl click, "Open in new tab" in the rail) brings that tab forward, with the view asked for, instead of making a second one, as Notion, Figma and
    VS Code do; the "+" is a blank new tab, as in a browser, and always makes one; Search already did this. (2) A middle click on a tab closes it, as
    a browser's does, and does not start the browser's autoscroll; the only tab is not closed. Already as the pattern has it: close on the active tab,
    a close that shows on pointing at the others, the next tab chosen when one closes, arrow keys between tabs, icon-only tabs past six, Cmd or Ctrl click
    opening beside.
  - **Option 2, kept going (`?layout=2`):** the panel's bar named the page the tab had just named ("Home" under a Home tab, "Home > Reports" under a
    Reports tab; "Home > Search" under Search), which 4.3 says not to do (a fact in two treatments). In option 2 a section page has no breadcrumb; the bar
    is drawn only when the section has actions to put in it (`hasSectionActions`, `sections.tsx`), with those at its right, and is not drawn when it has
    none (Home, for one). Search has no bar. A project page keeps its bar: its breadcrumb is the project switcher and the favourite star, which the tab
    does not hold, and the project's buttons are in it. Option 1 is unchanged.
  - **Open:** (1) the larger option: no open-page tabs, the strip being the section navigation and the global tools; (2) drag to reorder, pinning and
    reopening a closed tab are the desktop pattern's other behaviours and were not added (new functionality); (3) a project's buttons are still in the
    panel's bar, apart from the global tools above; folding them into the strip is the next step of option 2; (4) with Home's bar gone in option 2 the
    Home page starts at the top of the panel, and its spacing there has not been looked at.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `sections.tsx` and `npm run check:contracts` clean. **Not verified:** the
    behaviours in a browser (an open page brought forward rather than doubled, a middle click closing, the only tab surviving one) and how option 2 looks
    on Home, a list and Search without the bar, because no browser tool was available. Typography QA (0.6 item 8) not run: no text added. Not committed.
