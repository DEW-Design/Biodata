"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart01, Database01, Save01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalFooter, ModalHeader, ModalOverlay } from "@/components/application/modals/modal";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { boundaryAreaKm2, type LandscapeInputs } from "@/app/pages/project-detail/landscape";
import { LandscapeScoresheet } from "@/app/pages/project-detail/landscape-view";
import { ConservationScoresheet, type ConservationSheet } from "@/app/pages/project-detail/site-scores/scoresheet";
import { SURVEY_RECORDS } from "@/app/pages/project-detail/survey-data";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { ConservationOption, LandscapeOption, type SheetOption } from "./sheets";

// LAB: better ways to show the Landscape context scores and Conservation significance score sheets (the designer, 11 Nov 2026, with a
// screenshot of each: "show me better ways to visually represent this"). Both are a long column of label and number rows in a 640px modal:
// the total is the last row, under a scroll; each factor's rule is a sentence of bands ("0-10% = 0.05 pts; >10-20% = 0.04 pts; ..."); the
// four things a person types on the landscape sheet sit among eight worked-out figures; the ten species counts of the conservation sheet
// are ten rows of fields, flora then fauna.
//
// The job: someone who can edit a Block or a Site enters a few values and checks the score they make; anyone else reads how the score was
// reached. Principles first (0.10): 2 One thing first (the score is what the sheet is for, and it is last), 6 Reveal in steps (every rule
// and figure at once), 4 Tell the truth (the sheet's words, bands and points stay, nothing is computed that the sheet does not), 3 One
// system (the design system's progress bar, accordion, table, fields and modal). Every option uses the same scoring (landscape.ts,
// conservation-significance.ts) and the Adelaide Hills block (BK00501) and site (SU00501).
//   A  as it is
//   B  the score first, each factor's bands drawn as steps with the one it falls in marked, its share beside its heading
//   C  the score first, then a breakdown of the factors that opens: each row its share and a bar, the ones you type open
//   D  what you type on the left, the score building up on the right (a wider modal)
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this folder.

type Option = "a" | SheetOption;
type Sheet = "landscape" | "conservation";
type Sample = "record" | "threatened";

const OPTIONS: { id: Option; label: string; description: string }[] = [
  { id: "a", label: "A: As it is", description: "The total last; each rule a sentence of bands" },
  { id: "b", label: "B: Score first, bands as steps", description: "2 One thing first, 4 Tell the truth: the rule drawn, the band it falls in marked" },
  { id: "c", label: "C: A breakdown that opens", description: "6 Reveal in steps: each factor a row with its share; the ones you type open" },
  { id: "d", label: "D: Enter left, score right", description: "5 Make it obvious: what you type apart from what is worked out; a wider modal" },
];
const SHEETS: { id: Sheet; label: string; description: string }[] = [
  { id: "landscape", label: "Landscape context scores", description: "Block BK00501" },
  { id: "conservation", label: "Conservation significance score", description: "Site SU00501" },
];
const SAMPLES: { id: Sample; label: string; description: string }[] = [
  { id: "record", label: "As the record has them", description: "No threatened community or species" },
  { id: "threatened", label: "Some threatened", description: "Lab values only, to see the bands move" },
];

const ZERO = { stateRare: 0, stateVulnerable: 0, stateEndangered: 0, nationalVulnerable: 0, nationalEndangered: 0 };
// Made-up counts for the lab only, never stored: enough to put each weighted total in a band above the first.
const THREATENED: ConservationSheet = {
  inputs: { community: { stateVulnerable: true, nationalVulnerable: true } },
  flora: { ...ZERO, stateRare: 2, stateVulnerable: 1 },
  fauna: { ...ZERO, nationalVulnerable: 1 },
};

const block = SURVEY_RECORDS.find((r) => r.code === "BK00501")!;
const site = SURVEY_RECORDS.find((r) => r.code === "SU00501")!;
const ctx = { lat: block.lat, lon: block.lon, areaKm2: boundaryAreaKm2(block.location?.boundary) };
const blockInputs: LandscapeInputs = block.sections.find((s) => s.landscape)?.landscape?.inputs ?? {};
const siteConservation: ConservationSheet = site.sections.find((s) => s.siteScores)?.siteScores?.conservation ?? { inputs: { community: {} }, flora: ZERO, fauna: ZERO };

function Lab(): ReactNode {
  const params = useSearchParams();
  const router = useRouter();
  const roleHref = useRoleHref();
  const canEdit = useUserRole() !== "public-user";
  const option = (OPTIONS.find((o) => o.id === params.get("option"))?.id ?? "a") as Option;
  const sheet = (SHEETS.find((s) => s.id === params.get("sheet"))?.id ?? "landscape") as Sheet;
  const sample = (SAMPLES.find((s) => s.id === params.get("sample"))?.id ?? "record") as Sample;
  const href = (next: { option?: Option; sheet?: Sheet; sample?: Sample }) =>
    `/proto/score-sheets?option=${next.option ?? option}&sheet=${next.sheet ?? sheet}&sample=${next.sample ?? sample}`;

  useRegisterTool({
    id: "sheet",
    label: "Score sheet",
    barLabel: "Sheet",
    barValue: SHEETS.find((s) => s.id === sheet)?.label ?? "",
    icon: BarChart01,
    options: SHEETS,
    value: sheet,
    onChange: (id) => router.push(roleHref(href({ sheet: id as Sheet }))),
  });
  useRegisterTool(
    sheet === "conservation"
      ? {
          id: "sample",
          label: "Values shown",
          barLabel: "Values",
          barValue: SAMPLES.find((s) => s.id === sample)?.label ?? "",
          icon: Database01,
          options: SAMPLES,
          value: sample,
          onChange: (id) => router.push(roleHref(href({ sample: id as Sample }))),
        }
      : null,
  );

  const initialConservation = sample === "threatened" ? THREATENED : siteConservation;
  const [landscape, setLandscape] = useState<LandscapeInputs>(blockInputs);
  const [conservation, setConservation] = useState<ConservationSheet>(initialConservation);
  const [open, setOpen] = useState(true);
  // A new sample starts the sheet again from its values.
  const [sampleShown, setSampleShown] = useState(sample);
  if (sampleShown !== sample) {
    setSampleShown(sample);
    setConservation(initialConservation);
  }

  const setL = canEdit ? setLandscape : undefined;
  const setC = canEdit ? setConservation : undefined;
  const content = useMemo(() => {
    if (sheet === "landscape")
      return option === "a" ? <LandscapeScoresheet inputs={landscape} ctx={ctx} set={setL} /> : <LandscapeOption option={option} inputs={landscape} ctx={ctx} set={setL} />;
    return option === "a" ? <ConservationScoresheet sheet={conservation} set={setC} /> : <ConservationOption option={option} sheet={conservation} set={setC} />;
  }, [sheet, option, landscape, conservation, setL, setC]);

  const title = sheet === "landscape" ? "Landscape context scores" : "Conservation significance score";
  const record = sheet === "landscape" ? block : site;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-6 py-8 font-barlow">
      <Button color="secondary" size="md" iconLeading={BarChart01} onClick={() => setOpen(true)}>
        Open the scoresheet
      </Button>
      <ModalOverlay isDismissable isOpen={open} onOpenChange={setOpen}>
        <Modal className={option === "d" ? "w-full sm:max-w-240" : "w-full sm:max-w-160"}>
          <Dialog aria-label={title}>
            <ModalHeader title={title} description={`${record.name}, ${record.code}`} />
            <div className="px-4 pt-5 sm:px-6">{content}</div>
            {canEdit ? (
              <ModalFooter>
                <Button color="secondary" size="md" iconLeading={XClose} slot="close">
                  Cancel
                </Button>
                <Button color="primary" size="md" iconLeading={Save01} onClick={() => setOpen(false)}>
                  Save changes
                </Button>
              </ModalFooter>
            ) : (
              <div className="pb-6" />
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
      <PrototypeTools />
      <LayoutOptionSwitcher ariaLabel="Score sheet options" current={option} options={OPTIONS.map((o) => ({ ...o, href: href({ option: o.id }) }))} />
    </div>
  );
}

export default function ScoreSheetsLab(): ReactNode {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
