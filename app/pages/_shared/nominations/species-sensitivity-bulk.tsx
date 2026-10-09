"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { toast } from "@/components/application/toast/toast";
import { RecordBackLink } from "@/app/pages/_shared/record-hero";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SENSITIVITY_PATH } from "@/app/pages/_shared/nominations/nomination-version";
import { RiskBadge } from "@/app/pages/_shared/nominations/species-sensitivity-fields";
import { DataReleaseEditor, fromEditor, isEditorValid, toEditor, type EditorState } from "@/app/pages/_shared/nominations/species-sensitivity-editor";
import { Card } from "@/app/pages/_shared/nominations/species-sensitivity-record";
import { DEFAULT_RATING, accessLevelMeta, appliesToLabel, ratingSummary, releaseRiskMeta, speciesBySlug, speciesSlug } from "@/app/pages/_shared/nominations/species-sensitivity";
import { latestChanges, ratingOf, saveBulkRating, useRatingChanges } from "@/app/pages/_shared/nominations/species-sensitivity-store";
import { useRoleHref } from "@/lib/use-role-href";

// Bulk change (/species-sensitivity/bulk?species=<slug>,<slug>): the species ticked on the list, then the same data release
// editor a species' page has (whole species or specific attributes with their values), applied to each of them. A page, not a
// modal (the designer asked for none here), laid out like editing a species: the Selected species card shows each one's current
// rating, which the new one replaces, and a species can be taken out; Cancel and Apply sit in the footer (CONTRACTS 4.8).

export function SpeciesSensitivityBulk() {
  const params = useSearchParams();
  const router = useRouter();
  const roleHref = useRoleHref();
  const changes = useRatingChanges();
  const [slugs, setSlugs] = useState(() => (params.get("species") ?? "").split(",").filter((s) => !!speciesBySlug(s)));
  const [draft, setDraft] = useState<EditorState>(() => toEditor(DEFAULT_RATING));
  const [showErrors, setShowErrors] = useState(false);

  const latest = latestChanges(changes);
  const species = slugs.flatMap((s) => speciesBySlug(s) ?? []);
  const back = roleHref(SENSITIVITY_PATH);

  const apply = () => {
    if (!isEditorValid(draft)) {
      setShowErrors(true);
      return;
    }
    const rating = fromEditor(draft);
    const summary = ratingSummary(rating);
    saveBulkRating(
      species.map((s) => s.id),
      rating,
    );
    toast.success(`${species.length} species updated`, { description: `${releaseRiskMeta[summary.risk].label}, ${accessLevelMeta[summary.access].label}, ${rating.appliesTo === "species" ? "whole species" : "specific attributes"}` });
    router.push(back);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-gutter:stable]">
        <RecordBackLink href={back}>Back to species sensitivity</RecordBackLink>
        <SectionHeader.Root className="px-6 pb-2">
          <SectionHeader.Group>
            <div className="flex flex-1 flex-col gap-1">
              <SectionHeader.Heading>Change {species.length} species</SectionHeader.Heading>
              <SectionHeader.Subheading>The rating you set here replaces the current rating of each species below.</SectionHeader.Subheading>
            </div>
          </SectionHeader.Group>
        </SectionHeader.Root>

        {species.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-sm text-balance text-tertiary">No species are selected. Tick species on the list to change them together.</p>
            <Button color="link-color" size="sm" href={back} iconLeading={ArrowLeft}>
              Back to species sensitivity
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            <Card title={`Selected species (${species.length})`} editing={false}>
              <ul className="m-0 flex list-none flex-col p-0">
                {species.map((s) => {
                  const current = ratingOf(latest, s.id);
                  const summary = ratingSummary(current);
                  return (
                    <li key={s.id} className="flex items-center gap-4 border-b border-secondary px-4 py-3 last:border-b-0">
                      <SpeciesPhoto scientificName={s.species} alt={s.commonName} fallbackIcon={SPECIES_GROUP_ICON[s.group]} className="size-8" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-primary">{s.commonName}</span>
                        <span className="truncate text-xs text-quaternary italic">{s.species}</span>
                      </div>
                      <div className="hidden min-w-0 flex-1 flex-col items-start gap-1 sm:flex">
                        <span className="text-xs text-quaternary">Now</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <RiskBadge risk={summary.risk} />
                          <span className="truncate text-sm text-tertiary">
                            {accessLevelMeta[summary.access].label}, {appliesToLabel(current)}
                          </span>
                        </span>
                      </div>
                      <Button color="tertiary" size="sm" iconLeading={XClose} aria-label={`Take ${s.commonName} out of this change`} isDisabled={species.length === 1} onClick={() => setSlugs(slugs.filter((x) => x !== speciesSlug(s.id)))} />
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card title="New data release" editing>
              <DataReleaseEditor state={draft} onChange={setDraft} showErrors={showErrors} />
            </Card>
          </div>
        )}
      </div>

      {species.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary px-6 py-4">
          <p className="m-0 text-sm text-tertiary">
            Changing <span className="font-semibold text-primary">{species.length} species</span>
          </p>
          <div className="flex items-center gap-3">
            <Button iconLeading={XClose} color="secondary" href={back}>
              Cancel
            </Button>
            <Button iconLeading={Check} color="primary" onClick={apply}>
              Apply to {species.length} species
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
