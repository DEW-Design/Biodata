"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { Feather, Folder, SearchLg, SearchMd } from "@untitledui/icons";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem } from "@/components/base/select/select-item";
import { projects } from "@/app/pages/_shared/project-list-content";
import { rootProjectForParentEventId, searchOccurrences, type SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import { useRoleHref } from "@/lib/use-role-href";

// The header search: projects and species, and how they relate. Type a species and you see it,
// where it was recorded, and the projects that recorded it; type a project and you see it and the
// species it holds. Anything the dropdown does not list (events, occurrences, observations,
// artefacts) is one click away: "Search all records" opens Explore for the same term across all of
// South Australia, where every related record shows up in its own tab
// (app/pages/observations/page.tsx reads the `?q=` this sends).
//
// Species come from the same occurrence data Explore searches, under the same publication rule: a
// species is listed only when the project that recorded it is Active or Completed, so drafts and
// projects under review never surface one. A sensitive (Level 2) species is findable by name; its
// location is still obscured in Explore, as everywhere else.
//
// Datasets still have no example content, so they stay a named "Coming soon" row rather than being
// hidden or faked (same honesty convention as before).
//
// Projects with no detail page are shown but inert (`isDisabled`), so selecting one can never
// misfire - the same convention as TaskItem/ProjectRow only linking rows with a real page, chosen
// directly by the user over explaining "no detail page yet" in the UI.
//
// Built on the real ComboBox (react-aria's AriaComboBox + our Popover/SelectItem). It has no
// section headers, so the two kinds of result are told apart by a leading icon and by what the
// supporting text says, rather than by patching the component.
//
// No status filter chips here - flagged directly by the user: filters belong on a results view
// (Explore) once there is something worth narrowing, not on a typeahead.
const PROMPT_ID = "__prompt__";
const NO_RESULTS_ID = "__no-results__";
const SPECIES_PREFIX = "species:";
const PROJECT_PREFIX = "project:";

// The named-but-not-yet-searchable category, shown with the prompt and no-results states (never
// mixed into real matches, so it cannot be confused with one).
const scopeNoticeItems = [{ id: "__datasets__", label: "Datasets", supportingText: "Coming soon", isDisabled: true }];

const SPECIES_LIMIT = 5;

// Capped list plus a "Show N more results" footer once there are more matches than this (Mobbin:
// Codecademy's "View all results", Literal's "See all search results"). It lives in `listboxFooter`
// rather than as a listbox item, because a real item would run through `onSelectionChange` and
// overwrite the input with its own label.
const RESULTS_LIMIT = 10;

interface SpeciesEntry {
  species: string;
  commonName: string;
  family: string;
  group: SpeciesGroup;
  /** Names of the published projects that recorded it. */
  projectNames: string[];
  projectIds: string[];
}

// One entry per species (scientific name), built once from the occurrence data. Non-Biotic and
// Community rows (no family/group) are not species and are skipped.
const speciesIndex: SpeciesEntry[] = (() => {
  const byName = new Map<string, SpeciesEntry>();
  for (const o of searchOccurrences) {
    if (!o.family || !o.group) continue;
    const root = rootProjectForParentEventId(o.parentEventId);
    if (!root || (root.status !== "Active" && root.status !== "Completed")) continue;
    const entry = byName.get(o.species) ?? { species: o.species, commonName: o.commonName, family: o.family, group: o.group, projectNames: [], projectIds: [] };
    if (!entry.projectIds.includes(root.id)) {
      entry.projectIds.push(root.id);
      entry.projectNames.push(root.name);
    }
    byName.set(o.species, entry);
  }
  return [...byName.values()];
})();

const matchesSpecies = (s: SpeciesEntry, q: string) => [s.commonName, s.species, s.family, s.group].some((v) => v.toLowerCase().includes(q));

const recordedIn = (s: SpeciesEntry) => (s.projectNames.length === 1 ? `Recorded in ${s.projectNames[0]}` : `Recorded in ${s.projectNames.length} projects`);

interface ResultItem {
  id: string;
  label: string;
  supportingText?: string;
  icon?: typeof Folder;
  isDisabled?: boolean;
}

export function GlobalSearch() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();

  const results = useMemo<ResultItem[]>(() => {
    if (!q) return [];
    // Prefix matches on the common name first, then the rest alphabetically.
    const speciesMatches = speciesIndex
      .filter((s) => matchesSpecies(s, q))
      .sort((a, b) => Number(b.commonName.toLowerCase().startsWith(q)) - Number(a.commonName.toLowerCase().startsWith(q)) || a.commonName.localeCompare(b.commonName))
      .slice(0, SPECIES_LIMIT);
    const speciesItems: ResultItem[] = speciesMatches.map((s) => ({
      id: `${SPECIES_PREFIX}${s.species}`,
      label: s.commonName,
      supportingText: `${s.species} · ${recordedIn(s)}`,
      icon: Feather,
    }));

    // Projects: matched by name or organisation, plus the ones that recorded a matching species -
    // the relation - each noting which species so it is clear why it is listed.
    const relatedTo = new Map<string, string>();
    for (const s of speciesMatches) for (const id of s.projectIds) if (!relatedTo.has(id)) relatedTo.set(id, s.commonName);
    const projectItems: ResultItem[] = projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.org.toLowerCase().includes(q) || relatedTo.has(p.id))
      .map((p) => ({
        id: `${PROJECT_PREFIX}${p.id}`,
        label: p.name,
        supportingText: p.name.toLowerCase().includes(q) || p.org.toLowerCase().includes(q) ? p.org : `Recorded ${relatedTo.get(p.id)}`,
        icon: Folder,
        isDisabled: !p.href,
      }));

    return [...speciesItems, ...projectItems];
  }, [q]);

  const visible = showAll ? results : results.slice(0, RESULTS_LIMIT);
  const remaining = results.length - visible.length;

  const items: ResultItem[] = !q
    ? [{ id: PROMPT_ID, label: "Start typing to search projects and species", isDisabled: true }, ...scopeNoticeItems]
    : visible.length > 0
      ? visible
      : [{ id: NO_RESULTS_ID, label: `No projects or species found for "${query.trim()}"`, isDisabled: true }, ...scopeNoticeItems];

  const searchAllRecords = () => {
    const term = query.trim();
    if (!term) return;
    setQuery("");
    router.push(roleHref(`/pages/observations?q=${encodeURIComponent(term)}`));
  };

  return (
    <ComboBox
      aria-label="Search for projects and species"
      placeholder="Search for projects and species"
      icon={SearchMd}
      shortcut={false}
      // The results are already filtered above (by species, family, group, project name and
      // organisation, and by relation). The ComboBox's own "text contains the input" filter would
      // hide the ones that match through something other than their label, so it is turned off.
      defaultFilter={() => true}
      inputValue={query}
      onInputChange={(value) => {
        setQuery(value);
        setShowAll(false);
      }}
      items={items}
      listboxFooter={
        q && (
          <div className="border-t border-secondary">
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full cursor-pointer px-3 py-2.5 text-left text-sm font-medium text-brand-secondary hover:bg-secondary hover:text-brand-secondary_hover"
              >
                Show {remaining} more result{remaining === 1 ? "" : "s"}
              </button>
            )}
            <button
              type="button"
              onClick={searchAllRecords}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-secondary hover:bg-secondary hover:text-brand-secondary_hover"
            >
              <SearchLg className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">Search all records for &ldquo;{query.trim()}&rdquo;</span>
            </button>
          </div>
        )
      }
      onSelectionChange={(id: Key | null) => {
        // The prompt, the no-results row and every project with no page are `isDisabled`, so
        // react-aria never fires a selection for them. The footer controls live outside the
        // listbox entirely, so they cannot reach this handler.
        const key = String(id ?? "");
        if (key.startsWith(SPECIES_PREFIX)) {
          const species = speciesIndex.find((s) => s.species === key.slice(SPECIES_PREFIX.length));
          if (!species) return;
          setQuery("");
          router.push(roleHref(`/pages/observations?q=${encodeURIComponent(species.commonName)}`));
          return;
        }
        if (key.startsWith(PROJECT_PREFIX)) {
          const project = projects.find((p) => p.id === key.slice(PROJECT_PREFIX.length));
          if (!project?.href) return;
          setQuery("");
          router.push(roleHref(project.href));
        }
      }}
    >
      {(item) => <SelectItem id={item.id} label={item.label} supportingText={item.supportingText} icon={item.icon} isDisabled={item.isDisabled} />}
    </ComboBox>
  );
}
