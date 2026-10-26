# 2026-10-23 - Map visualise: project before file, the file regular, and a clearer type ladder

- **Oct 23 2026: Map visualise: project before file, the file regular, and a clearer type ladder.** The designer, with a screenshot: "Can we swap project name and the dataset file name? also dataset file name to be barlow
  regular. I still find the type hierarchy really weird, something's off. Can you look into this?" Typography QA (0.6 item 8) with `/emil-typography` and `/emil-design-foundations` ("hierarchy is subtraction", "restraint reads
  as intent: fewer weights", "every size comes from a scale"), each layer taken from the design system or a sibling (2.9), measured with `getComputedStyle`.
  - **Swapped, and regular:** the project is now the first line under the title (Folder icon, name and code as one label, 14/500, cut by words, the code never cut) and the file the second (14/400, kept by its end).
  - **The ladder before (measured, px/weight):** back link 14/600 tertiary; eyebrow 12/600 uppercase quaternary; Hide list 14/600 tertiary; title 16/600 primary; project 14/500; file 14/500; tabs 14/600; counts 12/600; category
    heading 12/600 uppercase; row title 14/500; row id 12/400 tertiary; severity 12/600. Nine layers, and six of the twelve roles at 600.
  - **What was off, from the numbers:**
    1. The way back was 14/600, the same weight as the title and two pixels smaller than it, and heavier than the facts it sits above (500 and 500): chrome louder than content, and the title was not a clear focal point.
       On every record page the way back is the record pages' back link, 14/500 tertiary (`RecordBackLink`); here it was a button at 600, so one role had two treatments (2.9 item 2).
    2. The title was 16/600 against 14/500 facts: a two pixel and one step step of weight, so "front and centre" (the designer, same day) was not met in type.
    3. The project and the file were the same layer (14/500), so the two facts under the title could not be told apart by type.
  - **Changed:**
    - **Title 18/600** (the layer Explore's second layout titles its card with, `text-lg font-semibold`): a clear step above the 14px facts and the links.
    - **The way back is `RecordBackLink`** (14/500, tertiary, primary on hover, no underline), with two opt-in props, `inline` (no page-width wrapper, able to give way where the card is narrow) and `className`
      (the card adds its touch target, 40px, unchanged); its default markup, on the 17 screens that use it, is unchanged (1.6, 1.3).
    - **Project 14/500, file 14/400**, as asked: a fact that reads first, then the file as plain detail.
  - **The ladder after:** title 18/600; project 14/500; file 14/400; row title 14/500; row id 12/400; labels (eyebrow, category heading) 12/600 uppercase quaternary; controls (Hide list, tabs, counts, badges) 14/600 and
    12/600 as the design system draws them; the back link 14/500. The weights are 400, 500 and 600, each with one job: 400 detail, 500 what you read, 600 labels, controls and the title.
  - **Known and not fixed:** **Hide list is 14/600 (the design system's link button) and now sits beside a 14/500 back link**, so it is the heavier of the two grey links. It cannot be made 500 at the call site
    (2.9: text in a real component is not restyled) and a hand-built lookalike toggle would break 1.2. The ways out are a designer's: make the design system's link buttons 500, make the back link 600 again (and the
    record pages'), or give the toggle a quieter form (an icon-only chevron as Explore's second layout does, which loses the label the designer asked for). The tabs (14/600, idle in quaternary) are also the design system's.
  - **Checked:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; the computed type of every line above; the back link still opens the report on this dataset from a tap 9px above it
    (its target is 40px, as before the swap); at 340 and 280px the project is cut by words with its code kept; zero console errors. **Not verified:** the record pages' back link after the opt-in props (its default
    markup is untouched; one page not opened), touch.
  - **Open:** (1) the Hide list weight, above; (2) whether the eyebrow "Dataset" earns its line now that the title is the id ("DS-" says it); (3) the design system's 600 on idle tabs, which makes the strip as loud as the
    title. Not committed.
