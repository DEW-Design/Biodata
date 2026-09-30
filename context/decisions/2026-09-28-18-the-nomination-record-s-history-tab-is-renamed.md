# 2026-09-28 - the nomination record's "History" tab is renamed "Audit history", per page feedback on `/pages/nominations/NSS-2026-00003`.

- **Sept 28 2026: the nomination record's "History" tab is renamed "Audit history", per page feedback on `/pages/nominations/NSS-2026-00003`.** Only the tab label changed (`nomination-detail.tsx`); its content, the dated list of status changes with who made each one, is the same. No other record page has a History tab. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.
  - **Designer decisions on the two questions left open by the Explore summary card entry above:**
    - Short maps are not a case to design for, so the details keep their last-resort scroll and the photo stays.
    - The role switcher, the layout options button and the feedback toolbar keep their current default positions.