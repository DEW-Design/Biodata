"use client";

// The record inspector: the right-hand pane of the Survey records explorer. Picking any event,
// occurrence or observation (in the tree or the table) shows its metadata here without leaving the
// list, the master-detail pattern of GBIF's occurrence pages, Finder's preview column and Linear's
// issue panel. Metadata is grouped by Darwin Core class in the order the BDBSA "Details Container"
// frames use. A full-screen button opens the same details across the whole window.
//
// Metadata sections are accordions (all open to start), as in the first version. For people who can
// edit, every section's header has its own Edit, beside the toggle (Accordion's `action`), which opens
// the record's form in the edit drawer (record-form.tsx) scrolled to that section; Add inside (only the record types allowed under this one, record-rules.ts) and
// Delete (confirmed, and it says what else goes with it) sit under the title. The same drawer
// edits the project, so every edit on the page works the same way.

import { displayValue } from "./field-schema";
import dynamic from "next/dynamic";
import { createElement, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Edit02, File06, Folder, InfoCircle, Maximize02, Plus, Trash01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { recordIcon } from "@/app/pages/_shared/record-icons";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { recordMapShape } from "./record-map";
import { artefactTypeMeta, type Artefact } from "@/app/pages/_shared/artefact-lightbox";
import { cx } from "@/utils/cx";
import { useEditStore } from "./edit-store";
import { childOptions, createRecord, type ChildOption } from "./record-rules";
import { RecordDrawer } from "./record-form";
import { formatDate, typeDescription, type MetaSection, type RecordKind, type SurveyRecord } from "./survey-data";

const LocationMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-lg bg-secondary" />,
});

export const KIND_LABEL: Record<RecordKind, string> = { event: "Event", occurrence: "Occurrence", observation: "Observation" };
export const KIND_PLURAL: Record<RecordKind, string> = { event: "Events", occurrence: "Occurrences", observation: "Observations" };
export const KIND_COLOR: Record<RecordKind, "brand" | "success" | "blue"> = { event: "brand", occurrence: "success", observation: "blue" };

// Type icons for this page's records live in `_shared/record-icons.ts`, one map for every screen that draws them.
export { recordIcon };

/**
 * The start of every record path: the project, as a folder icon and its ID (the same text identity
 * every other step shows, "SU00501"). It opens the project, like every other step opens its record.
 */
export function ProjectCrumb({ title, onPress }: { title: string; onPress: () => void }) {
  const { meta } = useEditStore();
  return (
    <button type="button" onClick={onPress} title={`Project: ${title}`} className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-tertiary hover:bg-secondary hover:text-primary">
      <Folder className="size-3.5 text-fg-quaternary" aria-hidden />
      <span>{meta.code}</span>
      <span className="sr-only">(project)</span>
    </button>
  );
}

/** A record's type icon, drawn without creating a component during render. */
export function RecordIcon({ record, className }: { record: Pick<SurveyRecord, "kind" | "type">; className?: string }) {
  return createElement(recordIcon(record), { className });
}

// A restricted record never shows its precise position: its coordinates are rounded to 0.1 degrees
// (about 10 km), matching the project's species restriction.
function shownPosition(record: SurveyRecord): [number, number] {
  if (!record.locationNote) return [record.lat, record.lon];
  return [Math.round(record.lat * 10) / 10, Math.round(record.lon * 10) / 10];
}

const EMPTY = new Set(["", "Not provided", "None recorded"]);

function Rows({ section }: { section: MetaSection }) {
  const rows = section.rows ?? [];
  if (rows.length === 0) return <p className="text-sm text-quaternary">None recorded</p>;
  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-x-4 border-b border-secondary py-2 last:border-b-0">
          <dt className="text-sm text-tertiary">{row.label}</dt>
          <dd className={cx("text-sm text-balance", EMPTY.has(row.value) ? "text-quaternary" : "text-primary")}>{EMPTY.has(row.value) ? "Not provided" : displayValue(row)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Measurements({ section }: { section: MetaSection }) {
  const ms = section.measurements ?? [];
  if (ms.length === 0) return <p className="text-sm text-quaternary">No measurements yet</p>;
  return (
    <>
      <div className="overflow-hidden rounded-lg border border-secondary">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-3 py-2 text-xs font-semibold text-quaternary">Measurement</th>
              <th className="px-3 py-2 text-xs font-semibold text-quaternary">Value</th>
              <th className="px-3 py-2 text-xs font-semibold text-quaternary">Method</th>
            </tr>
          </thead>
          <tbody>
            {ms.map((m) => (
              <tr key={m.type} className="border-t border-secondary">
                <td className="px-3 py-2 text-tertiary">{m.type}</td>
                <td className="px-3 py-2 font-medium text-primary">
                  {m.value}
                  {m.unit && <span className="ml-1 font-normal text-tertiary">{m.unit}</span>}
                </td>
                <td className="px-3 py-2 text-tertiary">{m.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SectionBody({ record, section }: { record: SurveyRecord; section: MetaSection }) {
  const [lat, lon] = shownPosition(record);
  return (
    <div className="flex flex-col gap-3">
      {section.withMap && (
        <>
          <div className="relative isolate h-40 overflow-hidden rounded-lg border border-secondary">
            <LocationMap {...recordMapShape(record, lat, lon)} onBoundaryAdd={() => {}} activeDrawTool={null} onDrawToolChange={() => {}} className="size-full" />
          </div>
          {!record.locationNote && <LocationDetailsTable lat={lat} lon={lon} />}
        </>
      )}
      {section.rows && <Rows section={{ ...section, rows: section.rows.filter((r) => r.type !== "measurements") }} />}
      {section.measurements && <Measurements section={section} />}
    </div>
  );
}

function RecordLink({ record, onSelect }: { record: SurveyRecord; onSelect: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onSelect(record.id)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-secondary">
      <RecordIcon record={record} className="size-4 shrink-0 text-fg-quaternary" />
      <span className="min-w-0 flex-1 truncate text-sm text-primary">{record.name}</span>
      <span className="shrink-0 text-xs text-tertiary">{record.type}</span>
    </button>
  );
}

/** "Add inside" - only the record types allowed under `parent` (`null` = the project). */
export function AddChildMenu({ parent, onPick, label = "Add inside" }: { parent: SurveyRecord | null; onPick: (option: ChildOption) => void; label?: string }) {
  const { childrenOf } = useEditStore();
  const options = childOptions(parent, childrenOf(parent?.id ?? null));
  if (options.length === 0) return null;
  return (
    <Dropdown.Root>
      <Button color="secondary" size="sm" iconLeading={Plus} iconTrailing={ChevronDown}>
        {label}
      </Button>
      <Dropdown.Popover placement="bottom start" className="w-64">
        <Dropdown.Menu
          aria-label={label}
          onAction={(key) => {
            const o = options.find((x) => `${x.kind}:${x.type}` === key);
            if (o) onPick(o);
          }}
        >
          {options.map((o) => (
            <Dropdown.Item key={`${o.kind}:${o.type}`} id={`${o.kind}:${o.type}`} label={o.label} icon={recordIcon({ kind: o.kind, type: o.type as SurveyRecord["type"] })} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/** Starts a new record of `option` under `parent` and opens it in the edit drawer. */
export function useAddRecord(onAdded: (id: string) => void) {
  const { records } = useEditStore();
  const [creating, setCreating] = useState<SurveyRecord | null>(null);
  const start = (parent: SurveyRecord | null, option: ChildOption) =>
    setCreating(createRecord({ kind: option.kind, type: option.type, parent, name: "", date: new Date().toISOString().slice(0, 10), recordedBy: "Olivia Wyatt", records }));
  const drawer = creating ? (
    <RecordDrawer
      key={creating.id}
      record={creating}
      mode="create"
      onClose={() => setCreating(null)}
      onSaved={(r) => {
        setCreating(null);
        onAdded(r.id);
      }}
    />
  ) : null;
  return { start, drawer };
}

export function RecordInspector({
  record,
  onSelect,
  onOpenArtefact,
  onFullscreen,
  isFullscreen = false,
}: {
  record: SurveyRecord | undefined;
  onSelect: (id: string | null) => void;
  onOpenArtefact: (artefact: Artefact) => void;
  /** Shows the full-screen button; omitted inside the full-screen view itself. */
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}) {
  const store = useEditStore();
  // Which section's Edit was pressed; the drawer opens scrolled to it. `null` = closed.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const add = useAddRecord((id) => onSelect(id));

  const fullscreenButton = onFullscreen ? <Button color="tertiary" size="sm" iconLeading={Maximize02} aria-label="Open full screen" onClick={onFullscreen} /> : null;
  if (!record) return <ProjectSummary onSelect={onSelect} onAdd={(o) => add.start(null, o)} addDrawer={add.drawer} fullscreenButton={fullscreenButton} />;

  const ancestors = store.ancestorsOf(record);
  const children = store.childrenOf(record.id);
  const attachments = store.artefactsFor(record.id);
  const photo = record.scientificName ? speciesImage(record.scientificName) : undefined;
  const subtree = store.subtreeOf(record.id);
  const innerCount = subtree.length - 1;
  const innerFiles = store.artefacts.filter((a) => subtree.some((r) => r.id === a.recordId)).length;

  return (
    <div className={cx("flex flex-col gap-4", isFullscreen ? "px-6 py-2" : "p-5")}>
      <div className="flex items-start justify-between gap-2">
      <nav aria-label="Record path" className="flex flex-wrap items-center gap-1 text-xs text-tertiary">
        <ProjectCrumb title={store.project.details.shortTitle} onPress={() => onSelect(null)} />
        {ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-fg-quaternary" />
            <button type="button" onClick={() => onSelect(a.id)} className="rounded px-1 py-0.5 hover:bg-secondary hover:text-primary" title={a.name}>
              {a.code}
            </button>
          </span>
        ))}
        <ChevronRight className="size-3 text-fg-quaternary" />
        <span className="px-1 font-medium text-primary">{record.code}</span>
      </nav>
      {fullscreenButton}
      </div>

      <div className="flex items-start gap-3">
        {record.scientificName ? (
          <SpeciesPhoto scientificName={record.scientificName} alt={record.name} fallbackIcon={recordIcon(record)} className="size-14" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
            <RecordIcon record={record} className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" color={KIND_COLOR[record.kind]}>
              {KIND_LABEL[record.kind]}
            </Badge>
            <span className="text-xs font-medium text-secondary">{record.type}</span>
          </div>
          <h2 className="text-lg font-semibold text-balance text-primary">{record.name}</h2>
          {record.scientificName && <p className="text-sm text-tertiary italic">{record.scientificName}</p>}
          <p className="text-xs text-tertiary">
            {record.code} · {formatDate(record.date)}
          </p>
        </div>
      </div>

      {store.canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <AddChildMenu parent={record} onPick={(o) => add.start(record, o)} />
          <Button color="tertiary" size="sm" iconLeading={Trash01} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      )}

      <p className="text-sm text-balance text-tertiary">{typeDescription(record)}.</p>
      {photo && (
        <p className="-mt-2 text-xs text-tertiary">
          Photo:{" "}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-tertiary">
            {photo.creator}, {photo.licence}, via ALA
          </a>
        </p>
      )}

      {record.locationNote && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-25 p-3 text-sm text-secondary">
          <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
          {record.locationNote}
        </div>
      )}

      {children.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Within this record ({children.length})</p>
          {children.map((c) => (
            <RecordLink key={c.id} record={c} onSelect={onSelect} />
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Attachments ({attachments.length})</p>
          {attachments.map((a) => (
            <button key={a.id} type="button" onClick={() => onOpenArtefact(a)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-secondary">
              {createElement(artefactTypeMeta[a.type].icon, { className: "size-4 shrink-0 text-fg-quaternary" })}
              <span className="min-w-0 flex-1 truncate text-sm text-primary">{a.title}</span>
              <span className="shrink-0 text-xs text-tertiary">{a.size}</span>
            </button>
          ))}
        </div>
      )}

      <Accordion
        key={`sections-${record.id}`}
        variant="compact"
        className="border-t border-secondary"
        defaultOpenKeys={record.sections.map((sec) => sec.id)}
        items={record.sections.map((section) => ({
          id: section.id,
          title: section.title,
          content: <SectionBody record={record} section={section} />,
          action: store.canEdit ? (
            <Button color="secondary" size="sm" iconLeading={Edit02} onClick={() => setEditing(section.id)} aria-label={`Edit ${section.title}`}>
              Edit
            </Button>
          ) : undefined,
        }))}
      />

      {editing && <RecordDrawer key={`edit-${record.id}`} record={record} mode="edit" focusSection={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />}
      {add.drawer}
      <DestructiveModal confirmIcon={Trash01}
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${record.name}?`}
        description={
          innerCount > 0 || innerFiles > 0
            ? `This also deletes ${innerCount} record${innerCount === 1 ? "" : "s"} inside it and ${innerFiles} attachment${innerFiles === 1 ? "" : "s"}. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        onConfirm={() => {
          const parentId = record.parentId;
          store.deleteRecord(record.id);
          setConfirmDelete(false);
          toast.success(`${record.name} deleted`, { description: "Changes are kept for this session only. This preview has no backend." });
          onSelect(parentId);
        }}
      />
    </div>
  );
}

// Shown when the project itself is selected: what the survey holds, one click from each part.
function ProjectSummary({ onSelect, onAdd, addDrawer, fullscreenButton }: { onSelect: (id: string | null) => void; onAdd: (o: ChildOption) => void; addDrawer: ReactNode; fullscreenButton: ReactNode }) {
  const { records, canEdit, project, meta } = useEditStore();
  const kinds: RecordKind[] = ["event", "occurrence", "observation"];
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
          <Folder className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <Badge size="sm" color="gray">
            Project
          </Badge>
          <h2 className="text-lg font-semibold text-primary">{project.details.shortTitle}</h2>
          <p className="text-xs text-tertiary">{meta.code} · {records.length} records</p>
        </div>
        <div className="ml-auto">{fullscreenButton}</div>
      </div>
      {canEdit && <AddChildMenu parent={null} onPick={onAdd} label="Add a site" />}
      <p className="text-sm text-balance text-tertiary">Pick a record in the tree or the table to see its metadata here.</p>
      {kinds.map((kind) => {
        const recs = records.filter((r) => r.kind === kind);
        const types = Array.from(new Set(recs.map((r) => r.type)));
        return (
          <div key={kind} className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
              {KIND_PLURAL[kind]} ({recs.length})
            </p>
            {types.map((t) => {
              const first = recs.find((r) => r.type === t)!;
              const count = recs.filter((r) => r.type === t).length;
              return (
                <button key={t} type="button" onClick={() => onSelect(first.id)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-secondary">
                  <RecordIcon record={first} className="size-4 shrink-0 text-fg-quaternary" />
                  <span className="min-w-0 flex-1 text-sm text-primary">{t}</span>
                  <span className="text-xs text-tertiary tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        );
      })}
      <p className="flex items-center gap-1.5 text-xs text-tertiary">
        <File06 className="size-3.5" />
        Attachments are listed on the record they belong to.
      </p>
      {addDrawer}
    </div>
  );
}
