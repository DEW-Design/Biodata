# 2026-09-28 - modals now copy Untitled UI's own modal anatomy, per page feedback off a screenshot of the redesigned discard prompt ("this is not in line with the behaviour that untitled ui components have. Please make sure you properly mimic what's on untitled").

- **Sept 28 2026: modals now copy Untitled UI's own modal anatomy, per page feedback off a screenshot of the redesigned discard prompt ("this is not in line with the behaviour that untitled ui components have. Please make sure you properly mimic what's on untitled").** This corrects the redesign logged just above, which was modelled on other products (Braintrust, OpenAI) rather than on Untitled.
  - **Source:** the open-source Untitled UI repo has only the modal container. The content layouts were pulled with the CLI (`npx untitledui add modals/stacked-left-aligned`, `destructive-stacked-left-aligned`, `horizontal`, `destructive-horizontal`, `input-field`, `form-01`) **into a scratch copy in /tmp, not this repo** (CONTRACTS 1.8: the CLI rewrote `modal.tsx`, `button.tsx`, `checkbox.tsx` and `package.json` there). The scratch copy was then deleted. This repo's `components/base` is untouched.
  - **Now, in `components/application/modals/modal.tsx`:**
    - **Stacked layout** (400px, `sm:max-w-100`):
      - the close X floats in the top-right corner (`absolute top-3 right-3 sm:top-4 sm:right-4`);
      - a 40px "modern" featured icon above the title, and the title with the description under it (`gap-0.5`);
      - two equal-width buttons in a two-column row (secondary, then primary), stacked full width with the primary on top on a phone;
      - no divider.
      Used by `ConfirmationModal`, two-action `DestructiveModal`s, `FormModal` and the sign-up invite.
    - **Horizontal layout** (544px, `sm:max-w-136`): the icon beside the title and the buttons right-aligned at their natural width. Used only for the three-action discard prompt (Keep editing, Save draft, Discard changes), which doesn't fit the two-column row.
  - **Icons are back everywhere, as in Untitled:**
    - `ConfirmationModal` has `icon` (default HelpCircle) and a new `iconColor`. The nomination Accept confirmation uses a green CheckCircle.
    - `FormModal` gained optional `icon` and `iconColor` (default gray).
    - `RejectModal` shows a red XCircle; the Return modal a warning MessageAlertCircle; DLA's approve a green CheckCircle; Add location a gray pin, plus a one-line description.
    - `SignUpPromptModal`'s `icon` prop and its five callers' icons are restored.
  - **Sizes:** `FormModal` is 400px, 480px or 640px (`sm`, `md`, `lg`), as Untitled's form modals are.
  - **Kept from the earlier round:** the dimmed background (black at 40%), the discard prompts being destructive with Save draft, and `text-base` for Untitled's `text-md` (not defined here).
  - **Docs:** the Modal docs page and its API table describe the Untitled anatomy and the new props.
  - **Verified live at 1708x1024:**
    - Measured widths and buttons: Confirmation, Destructive and the sign-up invite are 400px with two 170px buttons. The Form example is 480px with two 210px buttons. The discard prompt is 544px with three buttons at their natural width. At 420px wide the Reject modal's buttons stack full width.
    - Escape returns focus to the form's X.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` on touched files and `npm run check:contracts` are clean.
  - Not committed.