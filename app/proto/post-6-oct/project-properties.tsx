"use client";

// The project's properties, opened by the "i" in the panel's bar (the designer, 19 Oct 2026: an info icon at the top right "to open file properties, similar to
// Obsidian"). A panel that slides over the page from the right, under the bar, as the records tree does from the left (branch-drawer.tsx), so it takes no width
// from the content or from "On this page"; Escape or a click outside closes it. It holds what the page's header does not already say: the header has the project's
// ID, dates, status and publisher, and the Overview tab its title, abstract, people and where, so this is the rest of what the project holds, as a list of
// properties (a name, then its value): how it is identified (the object ID prefix, the URI or DOI), how it was collected (survey type, method, permits), what is
// held back (the restrictions) and what it holds (records, species, artefacts, datasets). When it was created and last changed, and by whom, are not held by the
// project, so they are not here (CONTRACTS 0.3). Every value is the project's own, from the same store as the page.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useEffect, useRef, type ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { useProjectSpecies } from "@/app/pages/project-detail/species-view";
import { COLLECTION_METHOD_OPTIONS, PERMIT_TYPE_OPTIONS, SURVEY_TYPE_OPTIONS } from "@/app/pages/project-registration/data";
import { RESTRICTION_TYPE_META } from "@/app/pages/project-registration/step-3-privacy-restrictions";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-AU")} ${n === 1 ? one : many}`;

function Group({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2 border-b border-secondary px-4 py-4 last:border-b-0">
      <h3 className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">{title}</h3>
      <dl className="m-0 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm">
            <dt className="text-tertiary">{r.label}</dt>
            <dd className="m-0 min-w-0 break-words text-primary">{r.value || <span className="text-quaternary">Not provided</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProjectProperties({ artefactCount, onClose }: { artefactCount: number; onClose: () => void }) {
  const { project, meta, records } = useEditStore();
  const species = useProjectSpecies();
  const datasets = useDatasets().filter((d) => d.projectId === meta.id);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const c = project.collection;
  const r = project.restrictions;
  const kind = (k: string) => records.filter((x) => x.kind === k).length;
  const enabled = r.hasRestrictions ? RESTRICTION_TYPE_META.filter((m) => r.enabledTypes.has(m.key)).map((m) => m.title) : [];
  const permits = c.permits.map((p) => [PERMIT_TYPE_OPTIONS.find((o) => o.id === p.type)?.label, p.number].filter(Boolean).join(" "));

  return (
    <>
      {/* A click outside the panel closes it. */}
      <div aria-hidden className="absolute inset-x-0 top-10 bottom-0 z-10" onClick={onClose} />
      <aside
        ref={ref}
        tabIndex={-1}
        aria-label="Project properties"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="absolute top-10 right-0 bottom-0 z-20 flex w-80 flex-col border-l border-secondary bg-primary shadow-lg outline-hidden"
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-secondary pr-2 pl-4">
          <p className="m-0 text-sm font-semibold text-primary">Properties</p>
          <button type="button" aria-label="Close properties" onClick={onClose} className="grid size-7 place-items-center rounded-md text-quaternary outline-focus-ring hover:bg-secondary hover:text-primary focus-visible:outline-2">
            <XClose className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Group
            title="Identifiers"
            rows={[
              { label: "Object ID prefix", value: meta.objectPrefix },
              { label: "URI / DOI", value: c.uriDoi },
            ]}
          />
          <Group
            title="Collection"
            rows={[
              { label: "Survey type", value: SURVEY_TYPE_OPTIONS.find((o) => o.id === c.surveyType)?.label ?? "" },
              { label: "Method", value: COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod)?.label ?? "" },
              { label: "Permits", value: permits.join(", ") },
            ]}
          />
          <Group title="Privacy" rows={[{ label: "Restrictions", value: enabled.length > 0 ? enabled.join(", ") : "None" }]} />
          <Group
            title="Holds"
            rows={[
              { label: "Records", value: `${plural(kind("event"), "event", "events")}, ${plural(kind("occurrence"), "occurrence", "occurrences")}, ${plural(kind("observation"), "observation", "observations")}` },
              { label: "Species", value: String(species.length) },
              { label: "Artefacts", value: String(artefactCount) },
              { label: "Datasets", value: String(datasets.length) },
            ]}
          />
        </div>
      </aside>
    </>
  );
}
