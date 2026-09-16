"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem } from "@/components/base/select/select-item";
import { projects } from "@/app/pages/_shared/project-list-content";
import { useRoleHref } from "@/lib/use-role-href";

// The header search, made real - functionally scoped to projects only (that's the one type with
// real example content), but the brief's actual scope is broader ("projects, datasets or
// species") and the control now says so honestly, rather than narrowing its own claimed scope to
// match what's wired up. Flagged directly by the user: the placeholder/label previously said
// "projects" only, underselling the real intended breadth of this control. The fix isn't to
// pretend Datasets/Species are searchable - there's no example content behind either yet, and
// silently no-op'ing a species-name query would be its own dishonesty - it's to show them as real,
// named, *not-yet-searchable* categories (inert rows with a "Coming soon" note) instead of omitting
// them entirely. Same "no fake links, no fake affordances, but no hiding real scope either"
// balance as everywhere else in this build.
//
// Built on the real ComboBox (react-aria's AriaComboBox + our Popover/SelectItem), not a
// hand-rolled input+dropdown - the same "only base components" rule applied everywhere else in
// this build.
//
// Status filter chips (a ToggleButtonGroup in `listboxHeader`) removed - flagged directly by the
// user: "we don't need filters here. We'll need filters when the search results show up" - filters
// belong on a real results view once there's something worth narrowing, not as a way to browse the
// whole list with no query typed. Browsing-via-filter went with it; opening the tray with no query
// now just prompts to type, nothing more.
const PROMPT_ID = "__prompt__";
const NO_RESULTS_ID = "__no-results__";

// Shown alongside the prompt/no-results states (not mixed into real project results, so they never
// crowd out or get confused with an actual match) - the honest "this category exists, it just
// isn't wired up yet" rows for the brief's other two search scopes.
const scopeNoticeItems = [
  { id: "__datasets__", label: "Datasets", supportingText: "Coming soon", isDisabled: true },
  { id: "__species__", label: "Species", supportingText: "Coming soon", isDisabled: true },
];

// Capped list + a "Show N more results" footer once there are more matches than this - pattern
// checked against Mobbin (Codecademy's "View all results" button, Literal's "See all search
// results" link below a capped list) rather than inventing a pagination scheme from scratch. Lives
// in `listboxFooter` (components/base/select/combobox.tsx), not as another selectable listbox
// item - a real listbox item would run through `onSelectionChange` on click, which would overwrite
// the input with its own label text and could close the popover, neither of which "reveal more
// rows in place" should do.
const RESULTS_LIMIT = 10;

export function GlobalProjectSearch() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = projects.filter((project) => !query || project.name.toLowerCase().includes(query.toLowerCase()));
  const visible = showAll ? filtered : filtered.slice(0, RESULTS_LIMIT);
  const remaining = filtered.length - visible.length;

  // Only "Adelaide Hills Bushland Survey" has a real `href` (project-detail/option-1) - the other
  // 3 don't. Selecting one of those used to call `router.push(project.href ?? "/pages/project-
  // list/option-1")`, which silently no-ops whenever you're already on that fallback page -
  // the popover closes, the input is left showing garbled leftover text (react-aria sets the
  // input to the selected item's textValue), and the URL never changes - reads as "nothing
  // happens" / "broken", flagged directly by the user. Fixed via `isDisabled` on results with no
  // real destination, so they can't be "selected" (and therefore can't misfire) at all - same
  // convention as TaskItem/ProjectRow only linking rows with a real page. Still findable (shown,
  // not filtered out), just inert - `SelectItem` already renders a disabled row as
  // cursor-not-allowed + reduced opacity, which is signal enough on its own. The supporting text
  // used to also spell out *why* ("- no detail page yet"), which read as an internal build note
  // leaking into a screen meant to look like something a real user would use - flagged directly by
  // the user, who chose dropping the explanation over the alternatives (a real page per project,
  // or hiding the result outright).
  const items = !query
    ? [{ id: PROMPT_ID, label: "Start typing to search projects, datasets, or species", isDisabled: true }, ...scopeNoticeItems]
    : visible.length > 0
      ? visible.map((project) => ({
          id: project.id,
          label: project.name,
          supportingText: project.org,
          isDisabled: !project.href,
        }))
      : [{ id: NO_RESULTS_ID, label: `No projects found for "${query}"`, isDisabled: true }, ...scopeNoticeItems];

  return (
    <ComboBox
      aria-label="Search for projects, datasets or species"
      placeholder="Search for projects, datasets or species"
      icon={SearchMd}
      shortcut={false}
      inputValue={query}
      onInputChange={(value) => {
        setQuery(value);
        setShowAll(false);
      }}
      items={items}
      listboxFooter={
        remaining > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full cursor-pointer border-t border-secondary px-3 py-2.5 text-left text-sm font-medium text-brand-secondary hover:bg-secondary hover:text-brand-secondary_hover"
          >
            Show {remaining} more result{remaining === 1 ? "" : "s"}
          </button>
        )
      }
      onSelectionChange={(id: Key | null) => {
        // PROMPT_ID/NO_RESULTS_ID and every hrefless project are `isDisabled`, so react-aria
        // never fires a selection for them - every id that reaches here has a real `href`. The
        // "show more" control lives outside this listbox entirely (see `listboxFooter` above), so
        // it can never reach this handler at all.
        const project = projects.find((p) => p.id === id);
        if (!project?.href) return;
        setQuery("");
        router.push(roleHref(project.href));
      }}
    >
      {(item) => <SelectItem id={item.id} label={item.label} supportingText={item.supportingText} isDisabled={item.isDisabled} />}
    </ComboBox>
  );
}
