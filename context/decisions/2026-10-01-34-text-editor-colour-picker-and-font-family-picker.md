# 2026-10-01 - Text editor: colour picker and font family picker removed

- **Oct 1 2026: Text editor: colour picker and font family picker removed.** Designer instruction: remove the colour picker and the font picker; keep Bold, Italic, Underline, the font size picker, image attachments and links.
  - **Removed:** `TextEditorColor` and `TextEditorFontFamily` (exports, both toolbars, the doc page's controls list and copy), with the token-read swatch palette and font list added in `2026-10-01-33`. `getTokenColor` stays, because the resize handle still reads the border token. `TextStyleKit` stays, because font size is a `textStyle` mark.
  - **Kept as it was:** Bold, Italic, Underline, font size, link, image, left and centre align, bullet list. The simple toolbar still has no size, link or image, and the advanced toolbar still has them.
  - **Verified:** `tsc`, `eslint` and `check:contracts` clean; live browser: no colour or font family control on the page, font size 24px applied with italic and underline, zero console errors. The production build was not re-run for this change.
  - **Open:** whether alignment and the bullet list stay (they were not named in the instruction), and whether the simple toolbar should also carry size, link and image. Not committed.
