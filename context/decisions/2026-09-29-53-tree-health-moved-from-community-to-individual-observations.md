# 2026-09-29 - Tree health moved from Community to Individual observations, per designer correction (branch `mohan-wips`)

- **Sept 29 2026: Tree health moved from Community to Individual observations, per designer correction (branch `mohan-wips`).**
  - `observationSections` (`survey-data.ts`) builds one Tree health section and adds it to Individual observations, after Species. Community now ends at Overstorey measurements.
  - The example tree health values on the Community seed (OB00504) were dropped.
  - The Individual seeds are all animals (bandicoot, echidna, possum), so their Tree health reads "Not provided". Crown extent and crown density scores still show once a value is entered.
  - Verified headlessly: Community shows Observation details, Landscape context scores, Overstorey, Observers, Temporal, Location. Bandicoot and Echidna show Tree health after Species. Zero console errors; `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.
