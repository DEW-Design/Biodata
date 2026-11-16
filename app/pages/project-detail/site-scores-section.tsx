"use client";

// A site's scores, its last section on the project's records (designer, 9 Nov 2026: "lets move this site scores from this test
// page to main sites in the projects"). It was the page /pages/site-scores, built for the business team on 4 Nov 2026 and shown
// on one site; it is now on every Site event, and that page is gone.
//
// As it was on that page: the summary first (the scoresheet's "Total Scores for the Site", and how the unit and total
// biodiversity scores are worked out), then the two scores, each opening its scoresheet block "on click of the score". The
// vegetation condition score is worked out from the site's other records, so its sheet is read only; the conservation
// significance sheet is edited there, by anyone who can edit the record. The landscape context score is the score of the
// Block event in the site (landscape.ts, "The landscape context score is the block's"); a site with no block has none, and
// then the unit and total scores say so. Saved from the view, a sheet saves the record; opened while the card is being
// edited, it goes into that edit.
//
// The species counts are worked out from the site's own records (designer, 9 Nov 2026: "the species count must be calculated
// from the site's records"), not typed: every occurrence under the site whose species is a plant, counted once per species, less
// the herbaceous annuals (an observation answering "Is annual herb?" Yes), as the sheet's "minus herbaceous annuals" says; and of
// those, the species with an observation answering "Regeneration" Yes. The records have no native or introduced flag, so every
// plant species recorded is counted as native (open: the weeds are entered on the sheet, apart from the records).

import { useState } from "react";
import { Save01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, FormModal, Modal, ModalHeader, ModalOverlay } from "@/components/application/modals/modal";
import { useEditStore } from "./edit-store";
import { FieldRow } from "./field-notes";
import { boundaryAreaKm2 } from "./landscape";
import { scoreBlock } from "./landscape-view";
import { NSX_SPECIES } from "./field-schema";
import type { SiteScoresData, SurveyRecord } from "./survey-data";
import type { SpeciesCounts } from "./site-scores/vegetation-condition";
import { fixed2, scoreVegetation } from "./site-scores/vegetation-condition";
import { scoreConservation } from "./site-scores/conservation-significance";
import { SiteScoreFigures, TotalsBreakdown, type SiteTotals } from "./site-scores/summary";
import { ConservationScoresheet, VegetationScoresheet, type ConservationSheet } from "./site-scores/scoresheet";

const NP = "Not provided";

/** A row's value in a record, by its label. */
const valueOf = (r: SurveyRecord, label: string) =>
  r.sections.flatMap((s) => s.rows ?? []).find((row) => row.label === label)?.value;

/** The plant species recorded under a site, and how many of them are regenerating (see the header). */
export function siteSpeciesCounts(records: SurveyRecord[]): SpeciesCounts {
  const isPlant = (r: SurveyRecord) =>
    r.group === "Plant" || NSX_SPECIES.find((x) => x.scientific === r.scientificName)?.kingdom === "Flora";
  const species = new Map<string, { annual: boolean; regenerating: boolean }>();
  for (const occ of records.filter((r) => r.kind === "occurrence" && r.scientificName && isPlant(r))) {
    const entry = species.get(occ.scientificName!) ?? { annual: false, regenerating: false };
    for (const ob of records.filter((r) => r.kind === "observation" && r.parentId === occ.id)) {
      if (valueOf(ob, "Is annual herb?") === "Yes") entry.annual = true;
      if (valueOf(ob, "Regeneration") === "Yes") entry.regenerating = true;
    }
    species.set(occ.scientificName!, entry);
  }
  const counted = [...species.values()].filter((s) => !s.annual);
  return { native: counted.length, regenerating: counted.filter((s) => s.regenerating).length };
}

export function SiteScoresSection({
  record,
  sectionId,
  data,
  labelWidth,
  onSave,
}: {
  record: SurveyRecord;
  sectionId: string;
  data: SiteScoresData;
  labelWidth?: string;
  /** Saves the conservation significance sheet; left out for people who can't edit, and the sheet is then read only. */
  onSave?: (next: SiteScoresData) => void;
}) {
  const store = useEditStore();
  const [vegetationOpen, setVegetationOpen] = useState(false);
  const [conservationOpen, setConservationOpen] = useState(false);
  const [draft, setDraft] = useState<ConservationSheet | null>(null);

  const subtree = store.subtreeOf(record.id);
  const counts = siteSpeciesCounts(subtree);
  const block = subtree.find((r) => r.type === "Block");
  const blockLandscape = block?.sections.find((s) => s.landscape)?.landscape;
  const landscape = block && blockLandscape
    ? scoreBlock(blockLandscape.inputs, { lat: block.lat, lon: block.lon, areaKm2: boundaryAreaKm2(block.location?.boundary) }).total
    : undefined;
  const veg = scoreVegetation(data.vegetation, counts, data.region);
  const cons = scoreConservation(data.conservation.inputs, data.conservation.flora, data.conservation.fauna);
  const totals: SiteTotals = { landscape, vegetation: veg.community ? veg.score : undefined, conservation: cons.score, sizeHa: data.vegetation.sizeHa };
  const vegetation = veg.community ? fixed2(veg.score) : NP;
  const conservation = fixed2(cons.score);
  const subtitle = `${record.name}, ${record.code}`;

  return (
    <div className="@container flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-4">
        <SiteScoreFigures t={totals} />
        <div className="border-t border-secondary pt-3">
          <TotalsBreakdown t={totals} />
        </div>
      </div>
      <div className="flex flex-col">
        <FieldRow
          recordId={record.id}
          fieldKey={`${sectionId}:Vegetation condition score`}
          label="Vegetation condition score"
          notes={undefined}
          editable={false}
          labelWidth={labelWidth}
          value={
            vegetation === NP ? (
              vegetation
            ) : (
              <Button color="link-color" size="sm" aria-label={`Vegetation condition score ${vegetation}: open the scoresheet`} onClick={() => setVegetationOpen(true)} className="tabular-nums">
                {vegetation}
              </Button>
            )
          }
        />
        <FieldRow
          recordId={record.id}
          fieldKey={`${sectionId}:Conservation significance score`}
          label="Conservation significance score"
          notes={undefined}
          editable={false}
          labelWidth={labelWidth}
          value={
            <Button
              color="link-color"
              size="sm"
              aria-label={`Conservation significance score ${conservation}: open the scoresheet${onSave ? " to edit it" : ""}`}
              onClick={() => (onSave ? setDraft(data.conservation) : setConservationOpen(true))}
              className="tabular-nums"
            >
              {conservation}
            </Button>
          }
        />
      </div>

      <ModalOverlay isDismissable isOpen={vegetationOpen} onOpenChange={setVegetationOpen}>
        <Modal className="w-full sm:max-w-300">
          <Dialog aria-label="Vegetation condition scores">
            <ModalHeader title="Vegetation condition scores" description={subtitle} />
            <div className="px-4 pt-5 pb-6 sm:px-6">
              <VegetationScoresheet site={record.name} inputs={data.vegetation} counts={counts} region={data.region} />
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      {onSave ? (
        <FormModal
          size="lg"
          isOpen={draft != null}
          onOpenChange={(o) => !o && setDraft(null)}
          title="Conservation significance score"
          description={subtitle}
          submitLabel="Save changes"
          submitIcon={Save01}
          onSubmit={() => {
            if (draft) onSave({ ...data, conservation: draft });
            setDraft(null);
          }}
        >
          {draft && <ConservationScoresheet sheet={draft} set={setDraft} />}
        </FormModal>
      ) : (
        <ModalOverlay isDismissable isOpen={conservationOpen} onOpenChange={setConservationOpen}>
          <Modal className="w-full sm:max-w-160">
            <Dialog aria-label="Conservation significance score">
              <ModalHeader title="Conservation significance score" description={subtitle} />
              <div className="px-4 pt-5 pb-6 sm:px-6">
                <ConservationScoresheet sheet={data.conservation} />
              </div>
            </Dialog>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
