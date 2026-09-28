# 2026-09-22 - `/pages/project-detail` rebuilt to a supplied screenshot.

- **Sept 22 2026: `/pages/project-detail` rebuilt to a supplied screenshot.** Records sidebar (label "Records") reads
  Project > Site > Visit > Occurrence > Observation from `project-record-tree.ts`, root row is the project name and
  opens Overview; children only bucket by type once a node has more than 8 (`shouldGroup`), so a Site lists its
  Visits/Occurrences flat. The sidebar's own icon collapses every open branch. Main column: `LayoutLeft` sidebar toggle
  + "Back to projects", then the Home gradient card carrying the project ID/dates/status/publisher (the old "Project
  Details" rail card and the Datasets tab are gone, so nothing is stated twice), then 8 tabs (Overview, Locations, Data
  Collection Scope, Permit, URI/DOI, Privacy and Restrictions, Artefacts & Attachments, Comments). The Tree/Table
  toggle is a react-aria `ToggleButtonGroup` (nesting a second `Tabs` inside the tab row's `Tabs` would fight its
  collection); Table collapses the sidebar and shows an honest placeholder until its design is supplied.
  Demo project is now Adelaide Hills Bushland Survey, BD-5039, matching the Projects list.
  Also: `MapView` reflows on its own container's resize (Highcharts only re-measured on window resize, so a
  collapsing sidebar left a stale pixel width that pushed the Overview rail off screen); a record-type filter and
  Expand all / Collapse all sit above the tree; every Explore results table (`ResultsTable`) now defaults to the
  `md` row size the Projects page uses, and both Projects tables show the same Project ID (`code`, BD-5039).