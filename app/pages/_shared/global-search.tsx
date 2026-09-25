"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComboBoxStateContext, type Key } from "react-aria-components";
import { Folder, SearchLg, SearchMd } from "@untitledui/icons";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem, SelectSection } from "@/components/base/select/select-item";
import { projects } from "@/app/pages/_shared/project-list-content";
import { rootProjectForParentEventId, searchOccurrences, type SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
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
// Built on the real ComboBox (react-aria's AriaComboBox + our Popover/SelectItem/SelectSection).
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

// Each group shows this many rows until "Show N more results" is pressed.
const GROUP_LIMIT = 5;

// Capped groups plus a "Show N more results" footer once there are more matches than fit (Mobbin:
// Codecademy's "View all results", Literal's "See all search results"). It lives in `listboxFooter`
// rather than as a listbox item, because a real item would run through `onSelectionChange` and
// overwrite the input with its own label.
//
// Provenance comes first: the line under a species is the organisation that published it and the
// project it was recorded in (the scientific name sits beside the common name), so where a record
// came from is the first thing read after what it is.
//
// Layout follows the Mobbin search patterns (Whop, Juicebox, Langdock: results grouped under
// headings with counts; komoot, Langdock: a short second line and the typed text in bold; Hashnode:
// "press Enter for all results"). Species and Projects are two titled groups, each row is a title
// with one line under it (organisation and project for a species; organisation for a project) and a
// short label on the right, and each species carries the icon for its group (mammal, bird, reptile, amphibian, plant).

interface SpeciesEntry {
  species: string;
  commonName: string;
  family: string;
  group: SpeciesGroup;
  /** The published projects that recorded it, and the organisation behind each (same order). */
  projectNames: string[];
  projectOrgs: string[];
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
    const entry = byName.get(o.species) ?? { species: o.species, commonName: o.commonName, family: o.family, group: o.group, projectNames: [], projectOrgs: [], projectIds: [] };
    if (!entry.projectIds.includes(root.id)) {
      entry.projectIds.push(root.id);
      entry.projectNames.push(root.name);
      entry.projectOrgs.push(root.org);
    }
    byName.set(o.species, entry);
  }
  return [...byName.values()];
})();

const matchesSpecies = (s: SpeciesEntry, q: string) => [s.commonName, s.species, s.family, s.group].some((v) => v.toLowerCase().includes(q));

// Provenance leads: who published the record and in which project, before anything else. A species
// recorded by several projects shows the first and counts the rest on the right.
const provenanceOf = (s: SpeciesEntry) => `${s.projectOrgs[0]} · ${s.projectNames[0]}`;
const moreProjects = (s: SpeciesEntry) => (s.projectIds.length > 1 ? `+${s.projectIds.length - 1} more` : undefined);

// Enter with no row highlighted opens Explore for what was typed. It is listened for on the window
// while the list is open (the footer only mounts then), before react-aria sees the key, because the
// ComboBox does nothing with Enter when no row is highlighted.
function SearchAllFooter({ term, remaining, onShowMore, onSearchAll }: { term: string; remaining: number; onShowMore: () => void; onSearchAll: () => void }) {
  const state = useContext(ComboBoxStateContext);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.isComposing) return;
      if (!state || state.selectionManager.focusedKey != null) return;
      e.preventDefault();
      e.stopPropagation();
      onSearchAll();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [state, onSearchAll]);

  return (
    <div className="border-t border-secondary">
      {remaining > 0 && (
        <button
          type="button"
          onClick={onShowMore}
          className="w-full cursor-pointer px-3 py-2.5 text-left text-sm font-medium text-brand-secondary hover:bg-secondary hover:text-brand-secondary_hover"
        >
          Show {remaining} more result{remaining === 1 ? "" : "s"}
        </button>
      )}
      <button
        type="button"
        onClick={onSearchAll}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-secondary hover:bg-secondary hover:text-brand-secondary_hover"
      >
        <SearchLg className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Search all records for &ldquo;{term}&rdquo;</span>
        <span className="shrink-0 rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-secondary ring-inset" aria-hidden="true">
          Enter
        </span>
      </button>
    </div>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const term = query.trim();
  const q = term.toLowerCase();

  // Prefix matches on the common name first, then the rest alphabetically.
  const speciesMatches = useMemo(
    () =>
      q
        ? speciesIndex
            .filter((s) => matchesSpecies(s, q))
            .sort((a, b) => Number(b.commonName.toLowerCase().startsWith(q)) - Number(a.commonName.toLowerCase().startsWith(q)) || a.commonName.localeCompare(b.commonName))
        : [],
    [q],
  );

  // Projects: matched by name or organisation, plus the ones that recorded a matching species -
  // the relation - each noting which species so it is clear why it is listed.
  const projectMatches = useMemo(() => {
    if (!q) return [];
    const relatedTo = new Map<string, string>();
    for (const s of speciesMatches.slice(0, GROUP_LIMIT)) for (const id of s.projectIds) if (!relatedTo.has(id)) relatedTo.set(id, s.commonName);
    return projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.org.toLowerCase().includes(q) || relatedTo.has(p.id))
      .map((p) => ({ project: p, viaSpecies: p.name.toLowerCase().includes(q) || p.org.toLowerCase().includes(q) ? undefined : relatedTo.get(p.id) }));
  }, [q, speciesMatches]);

  const shownSpecies = showAll ? speciesMatches : speciesMatches.slice(0, GROUP_LIMIT);
  const shownProjects = showAll ? projectMatches : projectMatches.slice(0, GROUP_LIMIT);
  const remaining = speciesMatches.length + projectMatches.length - shownSpecies.length - shownProjects.length;

  const searchAllRecords = () => {
    if (!term) return;
    setQuery("");
    router.push(roleHref(`/pages/observations?q=${encodeURIComponent(term)}`));
  };

  const hasResults = shownSpecies.length + shownProjects.length > 0;

  return (
    <ComboBox
      aria-label="Search for projects and species"
      placeholder="Search for projects and species"
      icon={SearchMd}
      shortcut={false}
      popoverMinWidth={440}
      popoverSize="auto"
      // The results are already filtered above (by species, family, group, project name and
      // organisation, and by relation). The ComboBox's own "text contains the input" filter would
      // hide the ones that match through something other than their label, so it is turned off.
      defaultFilter={() => true}
      inputValue={query}
      onInputChange={(value) => {
        setQuery(value);
        setShowAll(false);
      }}
      listboxFooter={q && <SearchAllFooter term={term} remaining={remaining} onShowMore={() => setShowAll(true)} onSearchAll={searchAllRecords} />}
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
      {!q ? (
        <>
          <SelectItem id={PROMPT_ID} label="Start typing to search projects and species" isDisabled />
          {scopeNoticeItems.map((item) => (
            <SelectItem key={item.id} {...item} />
          ))}
        </>
      ) : !hasResults ? (
        <>
          <SelectItem id={NO_RESULTS_ID} label={`No projects or species found for "${term}"`} isDisabled />
          {scopeNoticeItems.map((item) => (
            <SelectItem key={item.id} {...item} />
          ))}
        </>
      ) : (
        <>
          {shownSpecies.length > 0 && (
            <SelectSection title="Species" count={speciesMatches.length}>
              {shownSpecies.map((s) => (
                <SelectItem
                  key={s.species}
                  id={`${SPECIES_PREFIX}${s.species}`}
                  label={s.commonName}
                  textValue={s.commonName}
                  labelSuffix={s.species}
                  supportingText={provenanceOf(s)}
                  trailingText={moreProjects(s)}
                  highlight={term}
                  icon={SPECIES_GROUP_ICON[s.group]}
                  stacked
                />
              ))}
            </SelectSection>
          )}
          {shownProjects.length > 0 && (
            <SelectSection title="Projects" count={projectMatches.length}>
              {shownProjects.map(({ project, viaSpecies }) => (
                <SelectItem
                  key={project.id}
                  id={`${PROJECT_PREFIX}${project.id}`}
                  label={project.name}
                  textValue={project.name}
                  supportingText={project.org}
                  trailingText={viaSpecies ? `Has ${viaSpecies}` : undefined}
                  highlight={term}
                  icon={Folder}
                  isDisabled={!project.href}
                  stacked
                />
              ))}
            </SelectSection>
          )}
        </>
      )}
    </ComboBox>
  );
}
