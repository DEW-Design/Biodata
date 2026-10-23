# 2026-10-23 - Map visualise: severity gets a label over its column, and what it means is still unsourced

- **Oct 23 2026: Map visualise: severity gets a label over its column, and what it means is still unsourced.** The designer, with a screenshot of the list: "should we have a label above for severity? Like, what does high,
  medium really mean? Against mental models." Two questions: does the badge need a name, and does the scale need a meaning.
  - **What the repo says severity is:** a property of the rule, not of the record. `RULES` in `data-validation-error-report-data.ts` gives each of eight rules one severity, so every error of a rule has it: High for
    Observation method missing, Number observed under 1, Cover abundance missing and Coordinates outside the project's extent; Medium for Vegetation stratum missing, a species outlier ("verify identification or
    coordinates") and a Habitat value outside the controlled vocabulary; Low for a Visit date not in DD/MM/YYYY ("read as written"). Colours: High error red, Medium warning amber, Low neutral grey. **No source in the
    repo defines what High, Medium and Low mean** (searched the decisions, the rules, `CONTEXT.md`, the data and the screens); the scale is the prototype's sample data, not a BDBSA one, so it is not written up as a
    definition (0.3).
  - **The mental-model gap:** next to an error, High reads as priority ("fix first"), as impact ("how bad") or as confidence ("how sure"); in this data it is a fixed per-rule level, closest to impact. The badge alone
    does not say which. The report names it ("Severity" is a column header and a filter) and the record summary names it (the "Severity" row); the list rows, the place a person scans it, did not.
  - **Built (the naming; the meaning is not ours to invent):**
    - **"Severity" over the badge column**, right-aligned to the badges' own right edge (measured: label and badges both end at the same x in every view), in the card's eyebrow layer (12/600 uppercase quaternary:
      no new layer). In All errors it is at the right end of each category's heading ("Business rule 54 ... Severity"), so it is in view wherever the list is scrolled to; in a category tab, which has no heading, it is a
      label row of its own at the top. Checked in All errors, Coordinate mismatch and Metadata, and at 300px.
    - **A screen reader hears it:** each badge reads "Severity: High" (visually hidden prefix), where it read "High".
  - **Not built, proposed:** (1) **a meaning**, an info affordance on the label that opens what High, Medium and Low mean: needs the definitions from the business rules (the BRD or the BDBSA owners); until then the
    sample's pattern (High: a required value missing or a place outside the project; Medium: something to verify or fix; Low: accepted as written) is a hypothesis to confirm, not copy. (2) **Order by severity** within a
    category: the list is in record order, so finding the High ones means reading every badge; the report can sort and filter by severity and the card cannot. (3) Whether Low in neutral grey tells a person it can wait,
    which may or may not be what the rule intends.
  - **Checked:** `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean; zero console errors; BioData Super Admin at 1686px. **Not verified:** a screen reader (the markup is read, not heard), touch.
  - **Open:** the meaning of High, Medium and Low and who owns it; whether to sort by severity; where an explanation would live (on the label, in the report's column header too). Not committed.
