"use client";

import { Suspense } from "react";
import { TemplateList, useTemplateFilter } from "@/app/pages/_shared/template-finder/template-list";
import { TemplateNav } from "@/app/pages/_shared/template-finder/template-nav";
import { TemplateFinderShell } from "@/app/pages/_shared/template-finder/template-finder-shell";

// /pages/template-finder - the standard dataset templates, fitted from the wireframe (Figma
// YMproGZfrFB5jUqPHPxMhk node 38:60287) into the collection pattern (CONTRACTS 4.2): Section header,
// search and filter, then the table. Departures from the wireframe, on purpose:
//   - the card grid is a table (every collection screen is a table, 4.2), and the cards' image
//     placeholders are dropped (there are no template images);
//   - the three filter selects and "Find Templates" are the search box and the filter button every
//     list uses, applying as you choose; the "Project ID / Title" filter is left out, since nothing
//     links a template to a project yet;
//   - the Excel and PDF glyphs are one Download button that opens the two formats, both "Coming soon"
//     (`TemplateDownloads`, shared with the upload form), instead of a disabled pair on every row;
//   - rows are not links: a template has no page of its own;
//   - column 2 (the designer chose "grouped facets" in /proto/column-2, 5 Oct 2026) lists All templates, then the
//     species types and collection methods under group headings, with counts. They are the Filter menu's own state,
//     not a second filter (4.2d).
// Signed-in roles only (`templateFinder`); a public user gets the shell with the restriction in main.

export default function TemplateFinderPage() {
  return (
    <Suspense fallback={null}>
      <TemplateFinder />
    </Suspense>
  );
}

// Column 2 and the list share one filter: column 2's items are the Filter menu drawn as places (4.2d).
function TemplateFinder() {
  const filter = useTemplateFilter();
  return (
    <TemplateFinderShell localNav={<TemplateNav filter={filter} />}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TemplateList filter={filter} />
      </div>
    </TemplateFinderShell>
  );
}
