# 2026-09-30 - Controlled Vocabulary column widths remembered per vocabulary

- **Sept 30 2026: Controlled Vocabulary column widths remembered per vocabulary.** Follows 2026-09-30-19. The designer: "yes remember. No not the read only to be resized."
  - **Remembered:** a resized text column in the Entries grid (Reference or Descriptive) keeps its width for that vocabulary in this browser, across reloads (a persisted zustand store, `biodata-ctrl-vocab-widths`, keyed by the vocabulary's ID; a new vocabulary not saved yet uses "new"). A personal preference, so it is not part of the vocabulary and not shared with other admins. Double-clicking a column's edge still resets it.
  - **Decided:** the vocabulary page's read-only Entries table stays not resizable.
  - **Verified:** `tsc`, `eslint`, `check:contracts` clean. Live Chrome as BioData Super Admin: Measurement's Name column widened by keyboard to 304 px was stored under BIODATA-114 and came back at 304 px after a full reload; EPBC Act status kept the default 256 px. The test width was removed from the browser afterwards.
  - **Open:** none. Not committed.
