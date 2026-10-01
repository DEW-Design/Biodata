# 2026-10-01 - Notification attachments removable in the preview and 4.2d approved

- **Oct 1 2026: Notification attachments removable in the preview, and §4.2d approved.** Follows 2026-10-01-03.
  - **Attachments:** the designer, off a screenshot of an attachment chip in the form's preview: "attachments must be removable". In the form, each attachment chip in the email preview now has a remove button (`CloseButton` xs, labelled "Remove <file name>"), as well as the list under Attachments; a long file name is truncated with the full name on hover. The record page's preview stays read only (attachments change through Edit). `EmailPreview` gained an optional `onRemoveAttachment`.
  - **§4.2d approved** by the designer ("yes approved.4.2d"), wording unchanged from 2026-10-01-03.
  - **Next:** the designer asked for a Notification Management Option 2 modelled on how CRM and notification platforms manage notifications. Per CONTRACTS 2.6 the patterns are proposed first and the build waits for approval.
  - **Verified:** `tsc`, `eslint`, `check:contracts` clean; live: a file attached in the form shows in the preview with its remove button, which removes it from both places. Not committed.
