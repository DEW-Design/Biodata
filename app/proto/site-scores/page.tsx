"use client";

// LAB: site scores on a site's record (the details panel of the project page). A Bushland Assessment (BAM) site carries the
// scores of DEW's scoresheet: landscape context, vegetation condition and conservation significance, and the unit and total
// biodiversity scores worked out from them.
//
// The direction (designer, 4 Nov 2026, for the business team): the scores had "become very distracting ... taking the first
// place", so they are one section after the site's own sections, the summary first and then the scores. The vegetation
// condition score is worked out from the site's other records, so it is read only, and opens the scoresheet's own block
// (scoresheet.tsx) "on click of the score". The conservation significance score opens its block too, with editable fields
// ("lets work on the conservation score but this will be editable fields"). Options A to C (the working inline, in a
// popover, in a modal, with a section per score and an edit mode) were retired the same day; the designer confirms this
// version here before it goes to the project page, whose own changes were reverted.
//
// The record is the project page's real site, Cleland Stringybark Woodland, with its real sections (SectionFields). Its
// scores are the scoresheet's own worked example, Site 4 of "BAM Site 42" (EP 2 community, Northern Agricultural & Yorke
// Peninsula), so every number can be checked against the PDF: 25.01, 1.00, 1.17, 29.26, 585.20. They do not describe
// Cleland. The landscape context score is the block's (Block!H57), fixed here.

import { Suspense, useState, type Key } from "react";
import { Save01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { Dialog, FormModal, Modal, ModalHeader, ModalOverlay } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { typeLabel } from "@/app/pages/_shared/record-shapes";
import { EditStoreProvider } from "@/app/pages/project-detail/edit-store";
import { adelaideHillsSeed } from "@/app/pages/project-detail/project-seed";
import { RecordIcon } from "@/app/pages/project-detail/record-inspector";
import { SectionFields, SectionTitle } from "@/app/pages/project-detail/record-panel";
import { FieldRow } from "@/app/pages/project-detail/field-notes";
import { formatDate } from "@/app/pages/project-detail/survey-data";
import { fixed2, scoreVegetation, type SpeciesCounts, type VegetationInputs } from "./vegetation-condition";
import { scoreConservation, type SpeciesCountsByStatus } from "./conservation-significance";
import { SiteScoreFigures, TotalsBreakdown, type SiteTotals } from "./summary";
import { ConservationScoresheet, VegetationScoresheet, type ConservationSheet } from "./scoresheet";

// The scoresheet's Site 4. What is entered on the sheet, and what it is worked out with that is held elsewhere: the species
// counts (from the site's plant species list), the block's BCM region (a weed's threat rating is looked up by it) and the
// block's landscape context score.
const SITE_4: VegetationInputs = {
  community: "EP 2 Open Forests & Woodlands with Mid dense Shrub & Grassy Understorey",
  associationDescription: "Degraded native grassland with scattered larger shrubs of Acacia spp. and Senna artemisioides (Desert Senna) over native chenopods.",
  sizeHa: 20,
  lifeForms: { "Trees > 15m": 10, "Shrubs 0.5 - 2m": 2, "Shrubs <0.5m": 2, Forbs: 1, "Grasses > 0.2m": 2 },
  weeds: [
    { species: "Avena barbata", cover: 5 },
    { species: "Centaurea calcitrapa", cover: 1 },
    { species: "Gazania sp.", cover: 2 },
    { species: "Reseda luteola" },
    { species: "Marrubium vulgare", cover: 1 },
  ],
  naturallyTreeless: true,
  biomass: 3,
};
const COUNTS: SpeciesCounts = { native: 10, regenerating: 1 };
const REGION = "Northern Agricultural & Yorke Peninsula";
const LANDSCAPE = 1.17;
const NO_THREATENED: SpeciesCountsByStatus = { stateRare: 0, stateVulnerable: 0, stateEndangered: 0, nationalVulnerable: 0, nationalEndangered: 0 };
const SITE_4_CONSERVATION: ConservationSheet = { inputs: { community: {} }, flora: NO_THREATENED, fauna: NO_THREATENED };

const NP = "Not provided";

/** The site's scores as one section: the summary first, then the two scores, each opening its scoresheet block. */
function ScoresSection({
  record,
  totals,
  vegetation,
  conservation,
  onOpenVegetation,
  onOpenConservation,
}: {
  record: string;
  totals: SiteTotals;
  vegetation: string;
  conservation: string;
  onOpenVegetation: () => void;
  onOpenConservation: () => void;
}) {
  return (
    <div className="@container flex flex-col gap-3 px-3 pt-1 pb-3">
      <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-4">
        <SiteScoreFigures t={totals} />
        <div className="border-t border-secondary pt-3">
          <TotalsBreakdown t={totals} />
        </div>
      </div>
      <div className="flex flex-col">
        <FieldRow
          recordId={record}
          fieldKey="scores:Vegetation condition score"
          label="Vegetation condition score"
          notes={undefined}
          editable={false}
          value={
            vegetation === NP ? (
              vegetation
            ) : (
              <Button color="link-color" size="sm" aria-label={`Vegetation condition score ${vegetation}: open the scoresheet`} onClick={onOpenVegetation} className="tabular-nums">
                {vegetation}
              </Button>
            )
          }
        />
        <FieldRow
          recordId={record}
          fieldKey="scores:Conservation significance score"
          label="Conservation significance score"
          notes={undefined}
          editable={false}
          value={
            <Button color="link-color" size="sm" aria-label={`Conservation significance score ${conservation}: open the scoresheet to edit it`} onClick={onOpenConservation} className="tabular-nums">
              {conservation}
            </Button>
          }
        />
      </div>
    </div>
  );
}

function Lab() {
  const record = adelaideHillsSeed.records.find((r) => r.code === "SU00501")!;
  const [conservation, setConservation] = useState<ConservationSheet>(SITE_4_CONSERVATION);
  const [vegetationOpen, setVegetationOpen] = useState(false);
  const [draft, setDraft] = useState<ConservationSheet | null>(null);
  const [open, setOpen] = useState<Set<Key>>(new Set(["scores"]));
  const veg = scoreVegetation(SITE_4, COUNTS, REGION);
  const cons = scoreConservation(conservation.inputs, conservation.flora, conservation.fauna);
  const totals: SiteTotals = { landscape: LANDSCAPE, vegetation: veg.score, conservation: cons.score, sizeHa: SITE_4.sizeHa };
  const sections = record.sections.filter((s) => (s.rows ?? []).length > 0 && s.id !== "custom");

  return (
    <div className="font-barlow min-h-screen bg-secondary p-8">
      <PrototypeTools />
      <div className="mx-auto flex max-w-[960px] flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-lg font-semibold text-primary">Site scores</h1>
          <p className="m-0 max-w-prose text-sm text-balance text-tertiary">
            {
              "A site's scores on its record, as one section after the site's own: the summary, then the two scores. Each opens its block of the scoresheet; the conservation significance score can be edited there. The values are the scoresheet's own Site 4, so every number can be checked against the PDF."
            }
          </p>
        </div>

        <div className="@container flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-5">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="flex items-center gap-1 text-xs font-semibold tracking-wide text-quaternary uppercase">
              <RecordIcon record={record} className="size-4 shrink-0" />
              <span>
                {typeLabel(record)}
                <span className="font-normal normal-case tracking-normal">
                  , {record.code}, {formatDate(record.date)}
                </span>
              </span>
            </p>
            <h2 className="text-xl font-semibold text-balance text-primary">{record.name}</h2>
          </div>

          <div className="flex flex-col">
            <p className="py-1.5 pl-0.5 text-xs font-medium text-tertiary">{sections.length + 1} sections</p>
            <Accordion
              variant="compact"
              actionPlacement="beforeChevron"
              className="border-t border-secondary"
              openKeys={open}
              onOpenKeysChange={(keys) => setOpen(new Set(keys))}
              items={[
                ...sections.map((section) => ({
                  id: section.id,
                  title: <SectionTitle record={record} section={section} />,
                  content: <SectionFields record={record} section={section} />,
                })),
                {
                  id: "scores",
                  title: "Site scores",
                  content: (
                    <ScoresSection
                      record={record.id}
                      totals={totals}
                      vegetation={veg.community ? fixed2(veg.score) : NP}
                      conservation={fixed2(cons.score)}
                      onOpenVegetation={() => setVegetationOpen(true)}
                      onOpenConservation={() => setDraft(conservation)}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <ModalOverlay isDismissable isOpen={vegetationOpen} onOpenChange={setVegetationOpen}>
        <Modal className="w-full sm:max-w-300">
          <Dialog aria-label="Vegetation condition scores">
            <ModalHeader title="Vegetation condition scores" description={`${record.name}, ${record.code}`} />
            <div className="px-4 pt-5 pb-6 sm:px-6">
              <VegetationScoresheet site={record.name} inputs={SITE_4} counts={COUNTS} region={REGION} />
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      <FormModal
        size="lg"
        isOpen={draft != null}
        onOpenChange={(o) => !o && setDraft(null)}
        title="Conservation significance score"
        description={`${record.name}, ${record.code}`}
        submitLabel="Save changes"
        submitIcon={Save01}
        onSubmit={() => {
          if (!draft) return;
          setConservation(draft);
          setDraft(null);
          toast.success("Conservation significance score saved", { description: "Changes are kept for this session only. This preview has no backend." });
        }}
      >
        {draft && <ConservationScoresheet sheet={draft} set={setDraft} />}
      </FormModal>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <EditStoreProvider canEdit role="biodata-admin" seed={adelaideHillsSeed}>
        <Lab />
      </EditStoreProvider>
    </Suspense>
  );
}
