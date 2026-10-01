"use client";

import { useState, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { Edit05, SearchMd } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem, SelectSection } from "@/components/base/select/select-item";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import type { SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import { REGISTRATION_SPECIES, SPECIES_GROUP_OPTIONS, type RegistrationSpecies } from "@/app/pages/project-registration/data";

// The one species picker for forms (nominations, Add Project's species restriction). Picking one
// species from a long list is a combo box in the field, with rich rows grouped under headings, the
// same pattern and the same row as the header search (ComboBox, SelectSection, stacked SelectItem).
// Once picked, the field becomes a summary card with a Change button that reopens the combo box.

export const SPECIES_GROUP_PLURAL: Record<SpeciesGroup, string> = { Mammal: "Mammals", Bird: "Birds", Reptile: "Reptiles", Amphibian: "Amphibians", Plant: "Plants" };

const matches = (s: RegistrationSpecies, q: string) =>
  !q || [s.commonName, s.species, s.family, s.group, SPECIES_GROUP_PLURAL[s.group]].some((v) => v.toLowerCase().includes(q));

const NO_RESULTS_ID = "__no-species__";

export function SpeciesCombobox({
  onSelect,
  excludeIds = [],
  statusFor,
  isInvalid,
  autoFocus,
  ariaLabel = "Species",
}: {
  onSelect: (species: RegistrationSpecies) => void;
  /** Species that cannot be picked here (already chosen elsewhere in the same form). */
  excludeIds?: string[];
  /** A short word on the right of a row, e.g. "Restricted" or "Nominated". */
  statusFor?: (species: RegistrationSpecies) => string | undefined;
  isInvalid?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = REGISTRATION_SPECIES.filter((s) => !excludeIds.includes(s.id) && matches(s, q));
  const groups = SPECIES_GROUP_OPTIONS.filter((g) => results.some((s) => s.group === g));

  return (
    <ComboBox
      aria-label={ariaLabel}
      placeholder="Search by common name, scientific name or family"
      icon={SearchMd}
      shortcut={false}
      popoverSize="md"
      menuTrigger="focus"
      autoFocus={autoFocus}
      isInvalid={isInvalid}
      // The list below is already filtered (by name, scientific name, family and group); the
      // ComboBox's own "label contains the input" filter would hide family and group matches.
      defaultFilter={() => true}
      inputValue={query}
      onInputChange={setQuery}
      onSelectionChange={(id: Key | null) => {
        const species = REGISTRATION_SPECIES.find((s) => s.id === id);
        if (!species) return;
        setQuery("");
        onSelect(species);
      }}
    >
      {groups.length === 0 ? (
        <SelectItem key={NO_RESULTS_ID} id={NO_RESULTS_ID} label={`No species found for "${query.trim()}"`} isDisabled />
      ) : (
        groups.map((group) => {
          const inGroup = results.filter((s) => s.group === group);
          // Keyed on the typed text as well as the group: see SelectSection. A section updated in
          // place breaks typing in development builds.
          return (
            <SelectSection key={`${group}:${q}`} title={SPECIES_GROUP_PLURAL[group]} count={inGroup.length}>
              {inGroup.map((s) => (
                <SelectItem
                  key={s.id}
                  id={s.id}
                  label={s.commonName}
                  textValue={s.commonName}
                  labelSuffix={s.species}
                  supportingText={s.family}
                  trailingText={statusFor?.(s)}
                  highlight={q}
                  // The photo as the row's avatar, or the group icon when there is none (the same
                  // icon the header search and the Species tiles use). A component or a URL, never
                  // a rendered element: react-aria builds the list in a hidden collection first.
                  avatarUrl={speciesImage(s.species)?.src}
                  icon={SPECIES_GROUP_ICON[s.group]}
                  stacked
                />
              ))}
            </SelectSection>
          );
        })
      )}
    </ComboBox>
  );
}

/** The picked species: photo, names, family and group, and Change. Notes about the species (already
 *  restricted, an open nomination) go in `children`, under the card. */
export function SpeciesSummaryCard({ species, onChange, children }: { species: RegistrationSpecies; onChange: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 rounded-lg border border-secondary bg-primary p-4">
        <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-14" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold text-primary">{species.commonName}</span>
          <span className="text-sm text-tertiary italic">{species.species}</span>
          <span className="text-xs text-quaternary">
            {species.family} · {species.group}
          </span>
        </div>
        <Button iconLeading={Edit05} color="secondary" size="sm" onPress={onChange}>
          Change
        </Button>
      </div>
      {children}
    </div>
  );
}

/** The combo box until a species is picked, then its summary card; Change reopens the combo box
 *  with focus in it. */
export function SpeciesField({
  value,
  onChange,
  excludeIds,
  statusFor,
  isInvalid,
  notes,
}: {
  value: RegistrationSpecies | undefined;
  onChange: (species: RegistrationSpecies | null) => void;
  excludeIds?: string[];
  statusFor?: (species: RegistrationSpecies) => string | undefined;
  isInvalid?: boolean;
  notes?: (species: RegistrationSpecies) => ReactNode;
}) {
  const [reopened, setReopened] = useState(false);
  if (value) {
    return (
      <SpeciesSummaryCard
        species={value}
        onChange={() => {
          setReopened(true);
          onChange(null);
        }}
      >
        {notes?.(value)}
      </SpeciesSummaryCard>
    );
  }
  return <SpeciesCombobox onSelect={onChange} excludeIds={excludeIds} statusFor={statusFor} isInvalid={isInvalid} autoFocus={reopened} />;
}
