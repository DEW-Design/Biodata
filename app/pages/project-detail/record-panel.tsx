"use client";

// VERSION 3: the record details panel (beside the list).
//
// - A quiet toolbar: the record's path on the left (the middle folds into "..." so it never runs
//   under the icons), and two icons on the right: one Actions menu with everything you can do to the
//   record (Edit, Add inside by type, Delete), and full screen. Linear's and Notion's "..." pattern.
// - The header reads like the tree: icon (or species photo), name, then the type in muted text.
// - Metadata sections are accordions, all closed. A header shows what notes its fields carry, and on
//   hover (or keyboard focus) a small edit icon appears before the chevron: it opens full-screen
//   edit at that section.
// - Fields carry notes (flags, comments, files), read here; on hover an edit icon opens that field in
//   the full view's edit mode, where notes are added (field-notes.tsx).

import { useEffect, useRef, useState, type Key as ReactKey } from "react";
import { SubmenuTrigger, type Key } from "react-aria-components";
import { Activity, ChevronDownDouble, ChevronRight, ChevronUpDouble, DotsVertical, Edit02, Eye, Flag01, Folder, InfoCircle, Maximize02, MessageSquare01, Minimize02, Paperclip, Target05, Trash01 } from "@untitledui/icons";
import { Accordion } from "@/components/base/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { useEditStore } from "./edit-store";
import { ProjectCrumb, RecordIcon, recordIcon } from "./record-inspector";
import {
  EMPTY_VALUES,
  displayValue,
  fieldTypeOf,
  hasDateField,
  isLockedRow,
  locationSummary,
  rowHasValue,
  trapLabels,
} from "./field-schema";
import { RecordMap } from "./record-map";
import { flashElement } from "./flash";
import { childOptions, type ChildOption } from "./record-rules";
import {
  formatDate,
  type MetaSection,
  type RecordKind,
  type SurveyRecord,
} from "./survey-data";
import { FieldRow, NOTE_MARK, NOTE_TONE } from "./field-notes";
import { TrapEntryView } from "./trap-effort";
import {
  FactorValue,
  LandscapeTotal,
  OverstoreyStats,
  ReadingsTable,
  factorLabel,
  foliageCoverText,
} from "./landscape-view";
import { boundaryAreaKm2, scoreLandscape } from "./landscape";
import { hasNotes, sectionSummary, useFieldNotes } from "./field-notes-store";
import {
  isSectionShown,
  sectionHasContent,
  useHiddenFields,
} from "./field-visibility-store";

export function shownPosition(record: SurveyRecord): [number, number] {
  if (!record.locationNote) return [record.lat, record.lon];
  return [Math.round(record.lat * 10) / 10, Math.round(record.lon * 10) / 10];
}

const iconButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2";

/**
 * A section's fields (and its map, for location), each with its notes. Hidden fields (the edit view's
 * "Fields shown" checklist) are left out. `onEditField` gives every field an edit icon on hover.
 */
export function SectionFields({
  record,
  section,
  showMap = true,
  labelWidth,
  onEditField,
  hiddenOverride,
}: {
  record: SurveyRecord;
  section: MetaSection;
  showMap?: boolean;
  labelWidth?: string;
  onEditField?: (sectionId: string, fieldKey: string) => void;
  /** The edit session's hidden fields, used instead of the saved ones while editing. */
  hiddenOverride?: Set<string>;
}) {
  const { canEdit } = useEditStore();
  const notes = useFieldNotes();
  const saved = useHiddenFields(record.id);
  const hidden = hiddenOverride ?? saved;
  const forRecord = notes[record.id] ?? {};
  const onEdit =
    canEdit && onEditField
      ? (key: string) => onEditField(section.id, key)
      : undefined;
  const measurements = (section.measurements ?? []).filter(
    (m) => !hidden.has(`${section.id}:${m.type}`),
  );
  const noted = (label: string) =>
    hasNotes(forRecord[`${section.id}:${label}`]);
  // Fields with no value are left out of the view (they show in edit mode); a field with notes stays.
  const rows = (section.rows ?? []).filter(
    (r) =>
      !hidden.has(`${section.id}:${r.label}`) &&
      (r.type === "measurements"
        ? measurements.length > 0
        : rowHasValue(r, section.rows) || noted(r.label)),
  );
  const [lat, lon] = shownPosition(record);
  const landscapeScore = section.landscape
    ? scoreLandscape(section.landscape.factors, section.landscape.inputs, {
        lat: record.lat,
        lon: record.lon,
        areaKm2: boundaryAreaKm2(record.location?.boundary),
      })
    : null;
  const measurementRows = measurements.map((m) => (
    <FieldRow
      key={`m-${m.type}`}
      recordId={record.id}
      fieldKey={`${section.id}:${m.type}`}
      label={m.type}
      notes={forRecord[`${section.id}:${m.type}`]}
      onEdit={onEdit}
      labelWidth={labelWidth}
      value={
        <>
          {m.value}
          {m.unit && m.unit !== "No unit" && (
            <span className="ml-1 text-tertiary">{m.unit}</span>
          )}
          {m.method && (
            <span className="block text-xs text-tertiary">{m.method}</span>
          )}
        </>
      }
    />
  ));
  return (
    <div className="flex flex-col gap-3">
      {section.withMap && (
        <>
          {showMap && (
            <RecordMap record={record} lat={lat} lon={lon} className="h-40" />
          )}
          {/* In the expanded view the map sits in the side column; the card shows what was entered. */}
          {/* The table belongs to Location details, so the row's divider sits under the table. */}
          <div className="flex flex-col gap-2 border-b border-secondary pb-3">
            <FieldRow
              recordId={record.id}
              fieldKey={`${section.id}:Location details`}
              label="Location details"
              value={
                record.locationNote
                  ? "Generalised for a restricted species"
                  : locationSummary(
                      record.location ?? {
                        method: "coordinates",
                        boundary: {
                          id: "pt",
                          kind: "circle",
                          center: [record.lat, record.lon],
                          radiusKm: 0.1,
                        },
                      },
                    )
              }
              notes={forRecord[`${section.id}:Location details`]}
              onEdit={onEdit}
              labelWidth={labelWidth}
              divider={false}
            />
            {/* A restricted record shows no coordinates, rounded or not: only its block on the map. */}
            {!record.locationNote && <LocationDetailsTable lat={lat} lon={lon} />}
          </div>
        </>
      )}
      <div className="flex flex-col">
        {section.trapEffort ? (
          (() => {
            const names = trapLabels(section.trapEffort);
            const shown = section.trapEffort
              .map((e, i) => ({ e, name: names[i] }))
              .filter(({ name }) => !hidden.has(`${section.id}:${name}`));
            return shown.length === 0 ? (
              <p className="px-3 text-sm text-quaternary">
                No trap types recorded
              </p>
            ) : (
              shown.map(({ e, name }) => (
                <FieldRow
                  key={name}
                  recordId={record.id}
                  fieldKey={`${section.id}:${name}`}
                  label={name}
                  notes={forRecord[`${section.id}:${name}`]}
                  onEdit={onEdit}
                  labelWidth={labelWidth}
                  value={<TrapEntryView entry={e} />}
                />
              ))
            );
          })()
        ) : (
          <>
            {section.landscape &&
              landscapeScore &&
              landscapeScore.results.some(
                (r) => r.entered && r.id !== "remaining",
              ) && (
                <>
                  <div className="pb-3">
                    <LandscapeTotal score={landscapeScore} />
                  </div>
                  {landscapeScore.results
                    .filter(
                      (r) =>
                        !hidden.has(`${section.id}:${factorLabel(r.id)}`) &&
                        (r.entered || noted(factorLabel(r.id))),
                    )
                    .map((r) => (
                      <FieldRow
                        key={r.id}
                        recordId={record.id}
                        fieldKey={`${section.id}:${factorLabel(r.id)}`}
                        label={factorLabel(r.id)}
                        notes={forRecord[`${section.id}:${factorLabel(r.id)}`]}
                        onEdit={onEdit}
                        labelWidth={labelWidth}
                        value={<FactorValue result={r} />}
                      />
                    ))}
                </>
              )}
            {section.overstorey && (
              <>
                {overstoreyRows(section.overstorey)
                  .filter(
                    (r) =>
                      !hidden.has(`${section.id}:${r.label}`) &&
                      (rowHasValue({ label: r.label, value: r.value }) ||
                        noted(r.label)),
                  )
                  .map((r) => (
                    <FieldRow
                      key={r.label}
                      recordId={record.id}
                      fieldKey={`${section.id}:${r.label}`}
                      label={r.label}
                      notes={forRecord[`${section.id}:${r.label}`]}
                      onEdit={onEdit}
                      labelWidth={labelWidth}
                      value={r.value}
                    />
                  ))}
                {section.overstorey.readings.length > 0 && (
                  <div className="py-3">
                    <OverstoreyStats data={section.overstorey} />
                  </div>
                )}
                {!hidden.has(`${section.id}:Readings`) &&
                  (section.overstorey.readings.length > 0 ||
                    noted("Readings")) && (
                    <FieldRow
                      recordId={record.id}
                      fieldKey={`${section.id}:Readings`}
                      label="Readings"
                      notes={forRecord[`${section.id}:Readings`]}
                      onEdit={onEdit}
                      labelWidth={labelWidth}
                      value={<ReadingsTable data={section.overstorey} />}
                    />
                  )}
              </>
            )}
            {rows.length === 0 &&
            !section.landscape &&
            !section.overstorey &&
            measurements.length === 0 &&
            !(section.measurements && !section.rows) ? (
              <p className="px-3 text-sm text-quaternary">
                {section.measurements ? "No measurements yet" : "None recorded"}
              </p>
            ) : (
              <>
                {rows.map((row) =>
                  row.type === "measurements" ? (
                    measurementRows
                  ) : (
                    <FieldRow
                      key={row.label}
                      recordId={record.id}
                      fieldKey={`${section.id}:${row.label}`}
                      label={row.label}
                      value={
                        fieldTypeOf(row) === "codes" &&
                        !EMPTY_VALUES.has(row.value) ? (
                          <span className="whitespace-pre-line">
                            {displayValue(row, section.rows)}
                          </span>
                        ) : (
                          displayValue(row, section.rows)
                        )
                      }
                      notes={forRecord[`${section.id}:${row.label}`]}
                      onEdit={onEdit}
                      editable={!isLockedRow(row)}
                      labelWidth={labelWidth}
                    />
                  ),
                )}
                {!section.rows && measurementRows}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Canopy type and projected foliage cover, as field rows. */
export function overstoreyRows(o: NonNullable<MetaSection["overstorey"]>) {
  return [
    { label: "Canopy type", value: o.canopyType },
    {
      label: "Projected foliage cover",
      value: foliageCoverText(o.foliageCover),
    },
  ];
}

export function SectionTitle({
  record,
  section,
}: {
  record: SurveyRecord;
  section: MetaSection;
}) {
  const s = sectionSummary(useFieldNotes(), record, section.id);
  return (
    <span className="inline-flex items-center gap-2">
      {section.title}
      {s.flags > 0 && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.flag)}
          title={`${s.flags} flagged field${s.flags === 1 ? "" : "s"}`}
        >
          <Flag01 className="size-3" />
          {s.flags}
        </span>
      )}
      {s.comments > 0 && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.comment)}
          title={`${s.comments} comment${s.comments === 1 ? "" : "s"}`}
        >
          <MessageSquare01 className="size-3" />
          {s.comments}
        </span>
      )}
      {s.files > 0 && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.file)}
          title={`${s.files} file${s.files === 1 ? "" : "s"}`}
        >
          <Paperclip className="size-3" />
          {s.files}
        </span>
      )}
    </span>
  );
}

/** The record's path: in compact views the project and the current record, with every step between folded into "...". */
export function Path({
  ancestors,
  current,
  onSelect,
  fold = true,
}: {
  ancestors: SurveyRecord[];
  current?: SurveyRecord;
  onSelect: (id: string | null) => void;
  fold?: boolean;
}) {
  const { project } = useEditStore();
  const crumb = (label: string, onPress: () => void, title?: string) => (
    <button
      type="button"
      onClick={onPress}
      title={title}
      className="shrink-0 rounded px-1 py-0.5 hover:bg-secondary hover:text-primary"
    >
      {label}
    </button>
  );
  // Compact views show only the first step (the project) and the current record; every step in
  // between folds into one "..." menu. Full screen (fold={false}) shows the whole path.
  const folded = fold && ancestors.length > 0;
  const hidden = folded ? ancestors : [];
  const shown = folded ? [] : ancestors;
  return (
    <nav
      aria-label="Record path"
      className="flex min-w-0 items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-tertiary"
    >
      <ProjectCrumb
        title={project.details.shortTitle}
        onPress={() => onSelect(null)}
      />
      {hidden.length > 0 && (
        <span className="flex shrink-0 items-center gap-1">
          <ChevronRight className="size-3 text-fg-quaternary" />
          <Dropdown.Root>
            <Button
              color="tertiary"
              size="sm"
              aria-label="Show the full path"
              className="h-6 px-1"
            >
              ...
            </Button>
            <Dropdown.Popover placement="bottom start">
              <Dropdown.Menu
                aria-label="Path"
                onAction={(key) => onSelect(String(key))}
              >
                {hidden.map((a) => (
                  <Dropdown.Item
                    key={a.id}
                    id={a.id}
                    label={`${a.code} · ${a.name}`}
                    icon={recordIcon(a)}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </span>
      )}
      {shown.map((a) => (
        <span key={a.id} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3 shrink-0 text-fg-quaternary" />
          {crumb(a.code, () => onSelect(a.id), a.name)}
        </span>
      ))}
      {current && (
        <span className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3 shrink-0 text-fg-quaternary" />
          <span
            aria-current="page"
            title={current.name}
            className="truncate px-1 py-0.5 font-medium text-primary"
          >
            {current.code} · {current.name}
          </span>
        </span>
      )}
    </nav>
  );
}

const KIND_MENU: { kind: RecordKind; label: string; icon: typeof Activity }[] =
  [
    { kind: "event", label: "Events", icon: Activity },
    { kind: "occurrence", label: "Occurrences", icon: Target05 },
    { kind: "observation", label: "Observations", icon: Eye },
  ];

/**
 * Every action on the record, in one menu: Edit record; Add inside, as Events, Occurrences and
 * Observations, each opening its types (the same grouping as the Record type filter); and Delete,
 * set apart below a divider and shown in the error colour, because it can't be undone.
 */
export function ActionsMenu({
  options,
  onEdit,
  onAdd,
  onDelete,
}: {
  options: ChildOption[];
  onEdit?: () => void;
  onAdd: (o: ChildOption) => void;
  onDelete?: () => void;
}) {
  const pick = (key: Key) => {
    const o = options.find((x) => `${x.kind}:${x.type}` === key);
    if (o) onAdd(o);
  };
  const kinds = KIND_MENU.filter((k) => options.some((o) => o.kind === k.kind));
  return (
    <Dropdown.Root>
      <Tooltip title="Actions">
        <TooltipTrigger aria-label="Record actions" className={iconButton}>
          <DotsVertical className="size-5" />
        </TooltipTrigger>
      </Tooltip>
      <Dropdown.Popover placement="bottom end" className="w-60">
        <Dropdown.Menu
          aria-label="Record actions"
          onAction={(key) => {
            if (key === "edit") onEdit?.();
            else if (key === "delete") onDelete?.();
          }}
        >
          {onEdit ? (
            <Dropdown.Section>
              <Dropdown.Item id="edit" label="Edit record" icon={Edit02} />
            </Dropdown.Section>
          ) : null}
          {onEdit && kinds.length > 0 ? <Dropdown.Separator /> : null}
          {kinds.length > 0 ? (
            <Dropdown.Section>
              <Dropdown.SectionHeader className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-quaternary">
                Add inside
              </Dropdown.SectionHeader>
              {kinds.map((k) => (
                <SubmenuTrigger key={k.kind}>
                  <Dropdown.Item
                    id={`kind:${k.kind}`}
                    label={k.label}
                    icon={k.icon}
                  />
                  <Dropdown.Popover placement="end top" className="w-52">
                    <Dropdown.Menu
                      aria-label={`Add ${k.label.toLowerCase()}`}
                      onAction={pick}
                    >
                      {options
                        .filter((o) => o.kind === k.kind)
                        .map((o) => (
                          <Dropdown.Item
                            key={`${o.kind}:${o.type}`}
                            id={`${o.kind}:${o.type}`}
                            label={o.type}
                            icon={recordIcon({
                              kind: o.kind,
                              type: o.type as SurveyRecord["type"],
                            })}
                          />
                        ))}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </SubmenuTrigger>
              ))}
            </Dropdown.Section>
          ) : null}
          {onDelete ? <Dropdown.Separator /> : null}
          {onDelete ? (
            <Dropdown.Section>
              <Dropdown.Item
                id="delete"
                label="Delete record"
                icon={Trash01}
                destructive
              />
            </Dropdown.Section>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

export function FullscreenToggle({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip title={isFullscreen ? "Exit full screen" : "Full screen"}>
      <TooltipTrigger
        aria-label={isFullscreen ? "Exit full screen" : "Open full screen"}
        onPress={onToggle}
        className={iconButton}
      >
        {isFullscreen ? (
          <Minimize02 className="size-4" />
        ) : (
          <Maximize02 className="size-4" />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
}

/**
 * Expand all / Collapse all, as one icon: collapses when everything is open, expands otherwise. The
 * same control on the tree, the details panel's sections and the full view's cards.
 */
export function ExpandAllToggle({
  allOpen,
  onToggle,
}: {
  allOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip title={allOpen ? "Collapse all" : "Expand all"}>
      <TooltipTrigger
        aria-label={allOpen ? "Collapse all" : "Expand all"}
        onPress={onToggle}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2"
      >
        {allOpen ? (
          <ChevronUpDouble className="size-4" />
        ) : (
          <ChevronDownDouble className="size-4" />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
}

/** A small edit icon for a section header, shown on hover or focus. */
export function SectionEditIcon({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Tooltip title={`Edit ${title.toLowerCase()}`}>
      <TooltipTrigger
        aria-label={`Edit ${title}`}
        onPress={onPress}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary opacity-0 outline-focus-ring transition-opacity group-hover/accordion-item:opacity-100 group-hover/section:opacity-100 hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:opacity-100 focus-visible:outline-2"
      >
        <Edit02 className="size-3.5" />
      </TooltipTrigger>
    </Tooltip>
  );
}

/** Delete, confirmed, saying what goes with the record. */
export function useDeleteRecord(
  record: SurveyRecord | undefined,
  onDeleted: (parentId: string | null) => void,
) {
  const store = useEditStore();
  const [open, setOpen] = useState(false);
  const subtree = record ? store.subtreeOf(record.id) : [];
  const inner = subtree.length - 1;
  const modal = record ? (
    <DestructiveModal confirmIcon={Trash01}
      isOpen={open}
      onOpenChange={setOpen}
      title={`Delete ${record.name}?`}
      description={
        inner > 0
          ? `This also deletes ${inner} record${inner === 1 ? "" : "s"} inside it. This can't be undone.`
          : "This can't be undone."
      }
      confirmLabel="Delete record"
      cancelLabel="Keep record"
      onConfirm={() => {
        store.deleteRecord(record.id);
        setOpen(false);
        toast.success(`${record.name} deleted`, {
          description:
            "Changes are kept for this session only. This preview has no backend.",
        });
        onDeleted(record.parentId);
      }}
    />
  ) : null;
  return { ask: () => setOpen(true), modal };
}

export function RecordPanel({
  record,
  onSelect,
  onEdit,
  onAdd,
  onFullscreen,
  focusField,
}: {
  record: SurveyRecord | undefined;
  onSelect: (id: string | null) => void;
  /** Opens the record full screen with a card in edit mode (the first, or a section and field). */
  onEdit: (sectionId?: string, fieldKey?: string) => void;
  onAdd: (parent: SurveyRecord | null, option: ChildOption) => void;
  onFullscreen: () => void;
  /** A field to scroll to and briefly highlight (from an artefact's "Open record"). */
  focusField?: { key: string; nonce: number } | null;
}) {
  const store = useEditStore();
  const del = useDeleteRecord(record, onSelect);
  const hidden = useHiddenFields(record?.id);
  const notesAll = useFieldNotes();
  const [openSections, setOpenSections] = useState<Set<ReactKey>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);

  // Go to a field: open its section, scroll it into the middle of the panel, and flash it once in
  // the brand tint so the eye lands on it (a Web Animation, so there is nothing to clean up).
  const [focusedNonce, setFocusedNonce] = useState<number | null>(null);
  if (focusField && focusField.nonce !== focusedNonce) {
    setFocusedNonce(focusField.nonce);
    const sectionId = focusField.key.slice(0, focusField.key.indexOf(":"));
    setOpenSections((o) => new Set([...o, sectionId]));
  }
  useEffect(() => {
    if (!focusField || !record) return;
    const t = setTimeout(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(
        `[id="field-${record.id}-${focusField.key}"]`,
      );
      if (!el) return;
      flashElement(el);
    }, 350);
    return () => clearTimeout(t);
  }, [focusField, record]);

  if (!record) {
    const sites = store.childrenOf(null);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary bg-primary px-4 py-2">
          <nav aria-label="Record path" className="flex text-xs">
            <ProjectCrumb
              title={store.project.details.shortTitle}
              onPress={() => onSelect(null)}
            />
          </nav>
          <div className="flex shrink-0 items-center gap-0.5">
            {store.canEdit && (
              <ActionsMenu
                options={childOptions(null, sites)}
                onAdd={(o) => onAdd(null, o)}
              />
            )}
            <FullscreenToggle isFullscreen={false} onToggle={onFullscreen} />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5">
          <div className="flex items-center gap-2.5">
            <Folder className="size-5 shrink-0 text-fg-quaternary" />
            <h2 className="text-lg font-semibold text-primary">
              {store.project.details.shortTitle}
            </h2>
            <span className="text-sm text-tertiary">Project</span>
          </div>
          <p className="text-sm text-tertiary">
            {store.meta.code} · {store.records.length} records. Pick a record in the tree
            or the table to see its details.
          </p>
        </div>
      </div>
    );
  }

  const recordNotes = notesAll[record.id] ?? {};
  const shownSections = record.sections.filter(
    (section) =>
      isSectionShown(section, hidden) &&
      sectionHasContent(section, (k) => hasNotes(recordNotes[k])),
  );
  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary bg-primary px-4 py-2">
        <Path
          ancestors={store.ancestorsOf(record)}
          current={record}
          onSelect={onSelect}
        />
        <div className="flex shrink-0 items-center gap-0.5">
          {store.canEdit && (
            <ActionsMenu
              options={childOptions(record, store.childrenOf(record.id))}
              onEdit={() => onEdit()}
              onAdd={(o) => onAdd(record, o)}
              onDelete={del.ask}
            />
          )}
          <FullscreenToggle isFullscreen={false} onToggle={onFullscreen} />
        </div>
      </div>

      {/* Only the body scrolls, so the scrollbar starts under the header, as in the list beside it. */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
        <div className="flex items-start gap-3">
          {record.scientificName ? (
            <SpeciesPhoto
              scientificName={record.scientificName}
              alt={record.name}
              fallbackIcon={recordIcon(record)}
              className="size-10"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
              <RecordIcon record={record} className="size-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold text-balance text-primary">
              {record.name}
              <span className="text-sm font-normal text-tertiary">
                {record.type}
              </span>
            </h2>
            {record.scientificName && (
              <p className="text-sm text-tertiary italic">
                {record.scientificName}
              </p>
            )}
            <p className="text-xs text-tertiary">
              {record.code}
              {hasDateField(record) && ` · ${formatDate(record.date)}`}
            </p>
          </div>
        </div>

        {record.locationNote && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-25 px-3 py-2 text-sm text-secondary">
            <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
            {record.locationNote}
          </p>
        )}

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-t border-secondary py-1.5 pl-0.5">
            <p className="text-xs font-medium text-tertiary">
              {shownSections.length} sections
            </p>
            <ExpandAllToggle
              allOpen={
                shownSections.length > 0 &&
                shownSections.every((sec) => openSections.has(sec.id))
              }
              onToggle={() =>
                setOpenSections(
                  shownSections.every((sec) => openSections.has(sec.id))
                    ? new Set()
                    : new Set(shownSections.map((sec) => sec.id)),
                )
              }
            />
          </div>
          <Accordion
            key={`sections-${record.id}`}
            variant="compact"
            actionPlacement="beforeChevron"
            className="border-t border-secondary"
            openKeys={openSections}
            onOpenKeysChange={(keys) => setOpenSections(new Set(keys))}
            items={shownSections.map((section) => ({
              id: section.id,
              title: <SectionTitle record={record} section={section} />,
              content: (
                <SectionFields
                  record={record}
                  section={section}
                  onEditField={(sectionId, fieldKey) =>
                    onEdit(sectionId, fieldKey)
                  }
                />
              ),
              action: store.canEdit ? (
                <SectionEditIcon
                  title={section.title}
                  onPress={() => onEdit(section.id)}
                />
              ) : undefined,
            }))}
          />
        </div>
      </div>
      {del.modal}
    </div>
  );
}
