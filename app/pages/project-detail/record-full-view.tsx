"use client";

// VERSION 3: a record, full screen. Laid out the way full record pages read in Linear (an issue's
// full view: title and content on the left, properties on the right) and GBIF (an occurrence
// page: the record's data in sections, a summary and map beside it):
//
//   top bar      the full path on the left; Actions (the same menu as the panel) and Exit on the right
//   main column  a large header (photo or icon, name, type, scientific name), then every section as a
//                card; a card's edit icon (on hover), or a field's, puts that card in edit mode
//   right column a Record summary, the location map, and "Notes on this record", listing every
//                flagged, commented or attached field with a link that jumps to it
//
// Editing happens here, one card at a time: only the card being edited turns into fields
// (card-editor.tsx), the rest stay as they are. Its notes are added under each field. While a card is
// in edit mode the right column becomes "Fields shown" (visibility-panel.tsx), a checklist of every
// category and field of the record, and Cancel and Save changes sit in a footer across the bottom.
// Save commits the record, its notes and the fields shown together; Cancel discards all three.
//
// Designer override of CONTRACTS 4.1, logged in CONTEXT.md: this edit form does not render FormPage,
// because the designer asked for inline editing on the record's own cards.

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, ChevronDown, Edit02, EyeOff, InfoCircle, Save01, Trash01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { cx } from "@/utils/cx";
import { useEditStore } from "./edit-store";
import { fromDraft, missingFor, toDraft, type Draft } from "./record-form";
import { RecordIcon, recordIcon } from "./record-inspector";
import { childOptions, type ChildOption } from "./record-rules";
import {
  formatDate,
  type MetaSection,
  type SurveyRecord,
} from "./survey-data";
import { CardEditor } from "./card-editor";
import { FILE_ICON, NoteIndicators } from "./field-notes";
import {
  fieldNotesActions,
  hasNotes,
  recordFieldKeys,
  useFieldNotes,
  type FieldNotes,
} from "./field-notes-store";
import {
  REQUIRED_FIELD,
  emptyFieldKeys,
  isSectionShown,
  sectionHasContent,
  sectionShownInEdit,
  setHiddenFields,
  useHiddenFields,
} from "./field-visibility-store";
import {
  ActionsMenu,
  ExpandAllToggle,
  FullscreenToggle,
  Path,
  SectionEditIcon,
  SectionFields,
  SectionTitle,
  shownPosition,
  useDeleteRecord,
} from "./record-panel";
import { VisibilityPanel } from "./visibility-panel";
import { RecordMap } from "./record-map";
import { hasDateField } from "./field-schema";
import { flashElement } from "./flash";

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4"
    >
      <h3 className="text-xs font-semibold tracking-wide text-quaternary uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-tertiary">{label}</span>
      <span className="min-w-0 text-right text-primary">{children}</span>
    </div>
  );
}

function observerNames(record: SurveyRecord): string[] {
  const row = record.sections
    .find((s) => s.id === "observers")
    ?.rows?.find((r) => r.label === "Recorded by");
  if (!row || !row.value || row.value === "Not provided") return [];
  return row.value
    .split("|")
    .map((n) => n.trim())
    .filter(Boolean);
}

export interface EditTarget {
  /** A section id, or "*" for every card at once (Edit record). */
  sectionId: string;
  fieldKey?: string;
}

const ALL = "*";

interface Session {
  /** The cards in edit mode, in the order they were opened ("*" = every card). More can join while editing. */
  sectionIds: string[];
  focusField?: string;
  draft: Draft;
  notes: Record<string, FieldNotes>;
  hidden: Set<string>;
  dirty: boolean;
  attempted: boolean;
}

export function RecordFullView({
  record,
  onSelect,
  onAdd,
  onExit,
  initialEdit,
  onEditingChange,
  isNew = false,
  onCreated,
  onDiscardNew,
}: {
  record: SurveyRecord;
  onSelect: (id: string | null) => void;
  onAdd: (parent: SurveyRecord | null, option: ChildOption) => void;
  onExit: () => void;
  /** Opens with this card (and field) in edit mode. */
  initialEdit?: EditTarget;
  /** Told when a card goes in or out of edit mode, so the full-screen view can block dismissal. */
  onEditingChange?: (editing: boolean) => void;
  /** A record being added: every card starts in edit mode, and it only joins the list on save. */
  isNew?: boolean;
  onCreated?: (record: SurveyRecord) => void;
  /** Cancelling a new record. */
  onDiscardNew?: () => void;
}) {
  const store = useEditStore();
  const notes = useFieldNotes();
  const savedHidden = useHiddenFields(record.id);
  // A section whose fields are all empty is left out of the view (it still shows in edit mode).
  const hasContent = (section: MetaSection) =>
    sectionHasContent(section, (k) => hasNotes((notes[record.id] ?? {})[k]));
  // Scoped to this view: the details panel behind it renders the same ids.
  const rootRef = useRef<HTMLDivElement>(null);
  const del = useDeleteRecord(record, (parentId) => {
    onSelect(parentId);
    onExit();
  });

  const begin = (target: EditTarget): Session => ({
    sectionIds: [target.sectionId],
    focusField: target.fieldKey,
    draft: toDraft(record, store.artefactsFor(record.id)),
    notes: { ...(notes[record.id] ?? {}) },
    // Empty fields start hidden: they are added by ticking them in "Fields shown".
    hidden: new Set([
      ...savedHidden,
      ...[...emptyFieldKeys(record)].filter(
        (k) => !REQUIRED_FIELD.test(k.slice(k.indexOf(":") + 1)),
      ),
    ]),
    dirty: false,
    attempted: false,
  });
  const [session, setSession] = useState<Session | null>(() =>
    isNew
      ? begin({ sectionId: ALL })
      : initialEdit && store.canEdit
        ? begin(initialEdit)
        : null,
  );
  const [confirm, setConfirm] = useState<null | "cancel" | "exit">(null);
  // Cards are accordions too: all open to start; a card in edit mode always stays open.
  const [closedCards, setClosedCards] = useState<Set<string>>(new Set());
  const editing = session !== null;

  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  // Other cards stay editable while one is being edited: their edit icon adds them to the same edit.
  const startEdit = (sectionId: string, fieldKey?: string) => {
    if (!store.canEdit) return;
    if (!session) {
      setSession(begin({ sectionId, fieldKey }));
      return;
    }
    setSession((s) =>
      s && !s.sectionIds.includes(ALL) && !s.sectionIds.includes(sectionId)
        ? {
            ...s,
            sectionIds: [...s.sectionIds, sectionId],
            focusField: fieldKey ?? s.focusField,
          }
        : s
          ? { ...s, focusField: fieldKey ?? s.focusField }
          : s,
    );
  };
  const allEditing = !!session?.sectionIds.includes(ALL);
  const firstEditing = session
    ? allEditing
      ? record.sections[0].id
      : session.sectionIds[0]
    : undefined;
  const lastEditing =
    session && !allEditing
      ? session.sectionIds[session.sectionIds.length - 1]
      : undefined;
  const update = (p: Partial<Session>) =>
    setSession((s) => (s ? { ...s, ...p, dirty: true } : s));
  const missing = session ? missingFor(session.draft) : [];

  const save = () => {
    if (!session) return;
    if (missing.length > 0) {
      setSession({ ...session, attempted: true });
      rootRef.current
        ?.querySelector(`[id="full-card-${firstEditing}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    const next = fromDraft(session.draft);
    if (isNew) store.addRecord(next);
    else store.saveRecord(next);
    fieldNotesActions.setRecordNotes(record.id, session.notes);
    // Only a choice to hide a field with a value is kept: an empty field is left out anyway.
    const empty = emptyFieldKeys(next);
    setHiddenFields(
      record.id,
      new Set([...session.hidden].filter((k) => !empty.has(k))),
    );
    const title = allEditing
      ? next.name
      : session.sectionIds.length > 1
        ? "Changes"
        : (record.sections.find((s) => s.id === session.sectionIds[0])?.title ??
          "Changes");
    toast.success(isNew ? `${next.name} added` : `${title} saved`, {
      description:
        "Changes are kept in this browser. This preview has no backend.",
    });
    if (isNew) onCreated?.(next);
    setSession(null);
  };
  const discard = () => {
    setSession(null);
    if (isNew) onDiscardNew?.();
  };
  const cancel = () => (session?.dirty ? setConfirm("cancel") : discard());
  const exit = () =>
    session?.dirty ? setConfirm("exit") : isNew ? discard() : onExit();

  const parent = store.recordById(record.parentId);
  const [lat, lon] = shownPosition(record);
  const hasLocation = record.sections.some((s) => s.withMap);
  const hidden = session ? session.hidden : savedHidden;
  const noted = Object.entries(notes[record.id] ?? {})
    .filter(([, n]) => hasNotes(n))
    .map(([key, n]) => {
      const [sectionId, label] = [
        key.slice(0, key.indexOf(":")),
        key.slice(key.indexOf(":") + 1),
      ];
      return {
        key,
        sectionId,
        label,
        section:
          record.sections.find((s) => s.id === sectionId)?.title ?? sectionId,
        n,
      };
    })
    .filter((x) => recordFieldKeys(record).has(x.key));

  const jumpTo = (key: string) => {
    const el = rootRef.current?.querySelector<HTMLElement>(
      `[id="field-${record.id}-${key}"]`,
    );
    if (!el) return;
    // Open its card first if it was folded, then show where the field is.
    const sectionId = key.slice(0, key.indexOf(":"));
    setClosedCards((c) => {
      if (!c.has(sectionId)) return c;
      const next = new Set(c);
      next.delete(sectionId);
      return next;
    });
    setTimeout(() => {
      flashElement(
        rootRef.current?.querySelector<HTMLElement>(
          `[id="field-${record.id}-${key}"]`,
        ),
      );
      rootRef.current
        ?.querySelector<HTMLElement>(`[id="field-${record.id}-${key}"] button`)
        ?.focus({ preventScroll: true });
    }, 60);
  };
  const editingTitle = session
    ? allEditing
      ? "every section"
      : session.sectionIds
          .map((id) => record.sections.find((s) => s.id === id)?.title)
          .filter(Boolean)
          .join(", ")
    : undefined;

  return (
    <div ref={rootRef} className="flex min-h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-secondary bg-primary px-8 py-2.5">
        <Path
          ancestors={store.ancestorsOf(record)}
          current={record}
          onSelect={onSelect}
          fold={false}
        />
        <div className="flex shrink-0 items-center gap-0.5">
          {store.canEdit && !editing && (
            <ActionsMenu
              options={childOptions(record, store.childrenOf(record.id))}
              onEdit={() => startEdit(ALL)}
              onAdd={(o) => onAdd(record, o)}
              onDelete={del.ask}
            />
          )}
          <FullscreenToggle isFullscreen onToggle={exit} />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start gap-4">
            {record.scientificName ? (
              <SpeciesPhoto
                scientificName={record.scientificName}
                alt={record.name}
                fallbackIcon={recordIcon(record)}
                className="size-14"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                <RecordIcon record={record} className="size-6" />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
                {record.type}
              </p>
              <h1 className="text-2xl font-semibold text-balance text-primary">
                {isNew
                  ? `New ${(record.kind === "event" ? record.type : `${record.type} ${record.kind}`).toLowerCase()}`
                  : record.name}
              </h1>
              {record.scientificName && (
                <p className="text-base text-tertiary italic">
                  {record.scientificName}
                </p>
              )}
            </div>
          </div>

          {record.locationNote && (
            <p className="flex items-start gap-2 rounded-lg bg-warning-25 px-3 py-2 text-sm text-secondary">
              <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
              {record.locationNote}
            </p>
          )}

          {(() => {
            const visible = record.sections.filter((sec) =>
              session && (allEditing || session.sectionIds.includes(sec.id))
                ? sectionShownInEdit(sec, session.hidden)
                : isSectionShown(sec, hidden) && hasContent(sec),
            );
            const allOpen = visible.every((sec) => !closedCards.has(sec.id));
            return (
              <div className="-mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-tertiary">
                  {visible.length} sections
                </p>
                {!allEditing && (
                  <ExpandAllToggle
                    allOpen={allOpen}
                    onToggle={() =>
                      setClosedCards(
                        allOpen
                          ? new Set(visible.map((sec) => sec.id))
                          : new Set(),
                      )
                    }
                  />
                )}
              </div>
            );
          })()}

          {record.sections.map((section, i) => {
            const isEditing =
              !!session &&
              (allEditing || session.sectionIds.includes(section.id));
            const sectionHidden = !isSectionShown(section, hidden);
            if (
              isEditing
                ? !sectionShownInEdit(section, session.hidden)
                : sectionHidden || !hasContent(section)
            )
              return null;
            const isOpen = isEditing || !closedCards.has(section.id);
            const toggle = () =>
              setClosedCards((c) => {
                const next = new Set(c);
                if (next.has(section.id)) next.delete(section.id);
                else next.add(section.id);
                return next;
              });
            return (
              <section
                key={section.id}
                id={`full-card-${section.id}`}
                aria-label={section.title}
                className={cx(
                  "group/section flex scroll-mt-20 flex-col gap-3 rounded-xl border bg-primary p-5 transition-shadow",
                  isEditing
                    ? "border-[var(--color-brand-500)] ring-4 ring-[var(--color-brand-50)]"
                    : "border-secondary",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-primary">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      disabled={isEditing}
                      onClick={toggle}
                      className="-my-1 -ml-1 flex min-w-0 flex-1 cursor-pointer items-center rounded-md px-1 py-1 text-left outline-focus-ring focus-visible:outline-2 disabled:cursor-default"
                    >
                      <SectionTitle record={record} section={section} />
                    </button>
                    {sectionHidden && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-tertiary">
                        <EyeOff className="size-3" />
                        Hidden
                      </span>
                    )}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1">
                    {isEditing ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-tertiary">
                        <Edit02 className="size-3.5" />
                        Editing
                      </span>
                    ) : (
                      store.canEdit && (
                        <SectionEditIcon
                          title={section.title}
                          onPress={() => startEdit(section.id)}
                        />
                      )
                    )}
                    {!isEditing && (
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden
                        onClick={toggle}
                        className="flex size-7 cursor-pointer items-center justify-center rounded-md"
                      >
                        <ChevronDown
                          className={cx(
                            "size-4 text-brand-600 transition-transform duration-150",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>
                </div>
                {!isOpen ? null : isEditing && session ? (
                  <>
                    {session.attempted &&
                      missing.length > 0 &&
                      section.id === firstEditing && (
                        <div role="alert">
                          <AlertFullWidth
                            contained
                            tintedBackground
                            wrap
                            color="error"
                            className="max-w-none rounded-lg border border-error-300 bg-error-50"
                            title="Details missing"
                            description={`Complete these to save: ${missing.join(", ")}.`}
                            confirmLabel="OK"
                          />
                        </div>
                      )}
                    <CardEditor
                      section={
                        session.draft.record.sections.find(
                          (s) => s.id === section.id,
                        ) ?? section
                      }
                      isFirst={i === 0}
                      state={{
                        draft: session.draft,
                        patch: (p) =>
                          update({ draft: { ...session.draft, ...p } }),
                        notes: session.notes,
                        setNotes: (key, next) =>
                          update({ notes: { ...session.notes, [key]: next } }),
                        hidden: session.hidden,
                        showErrors: session.attempted,
                        focusField: session.focusField,
                      }}
                    />
                  </>
                ) : (
                  <SectionFields
                    record={record}
                    section={section}
                    showMap={false}
                    labelWidth="12rem"
                    hiddenOverride={session?.hidden}
                    onEditField={startEdit}
                  />
                )}
              </section>
            );
          })}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {session ? (
            <VisibilityPanel
              record={record}
              hidden={session.hidden}
              onChange={(next) => update({ hidden: next })}
              activeSection={lastEditing}
            />
          ) : (
            <>
              <SideCard title="Record">
                <SummaryRow label="Type">{record.type}</SummaryRow>
                <SummaryRow label="ID">{record.code}</SummaryRow>
                {hasDateField(record) && (
                  <SummaryRow label="Date">
                    {formatDate(record.date)}
                  </SummaryRow>
                )}
                <SummaryRow label="Within">
                  {parent ? (
                    <button
                      type="button"
                      onClick={() => onSelect(parent.id)}
                      className="text-right text-brand-secondary hover:underline"
                    >
                      {parent.name}
                    </button>
                  ) : (
                    "Project"
                  )}
                </SummaryRow>
                {observerNames(record).length > 0 && (
                  <SummaryRow label="Observers">
                    {/* The first name and a count; the full list is one click away in Observers. */}
                    <button
                      type="button"
                      onClick={() => jumpTo("observers:Recorded by")}
                      className="rounded text-right text-brand-secondary outline-focus-ring hover:underline focus-visible:outline-2"
                    >
                      {observerNames(record)[0]}
                      {observerNames(record).length > 1 &&
                        ` +${observerNames(record).length - 1} more`}
                    </button>
                  </SummaryRow>
                )}
              </SideCard>

              {hasLocation && (
                <SideCard title="Location">
                  <RecordMap
                    record={record}
                    lat={lat}
                    lon={lon}
                    className="h-44"
                  />
                  <p className="text-xs text-tertiary">
                    {record.locationNote
                      ? "Shown only as a block: this is a restricted record."
                      : `${lat.toFixed(3)}, ${lon.toFixed(3)} · GDA2020`}
                  </p>
                </SideCard>
              )}

              <SideCard title="Notes on this record">
                {noted.length === 0 ? (
                  <p className="text-sm text-tertiary">
                    No flags, comments or files yet.
                    {store.canEdit ? " Edit a field to add one." : ""}
                  </p>
                ) : (
                  <ul className="-mx-2 flex flex-col">
                    {noted.map((x) => (
                      <li key={x.key}>
                        <button
                          type="button"
                          onClick={() => jumpTo(x.key)}
                          className="flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-primary">
                              {x.label}
                            </span>
                            <NoteIndicators notes={x.n} />
                          </span>
                          <span className="text-xs text-tertiary">
                            {x.section}
                          </span>
                          {x.n.files.slice(0, 2).map((f) => (
                            <span
                              key={f.id}
                              className="flex items-center gap-1.5 text-xs text-secondary"
                            >
                              {createElement(FILE_ICON[f.kind], {
                                className: "size-3.5 text-fg-quaternary",
                              })}
                              <span className="truncate">{f.name}</span>
                            </span>
                          ))}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SideCard>
            </>
          )}
        </aside>
      </div>

      {session && (
        <div className="sticky bottom-0 z-20 mt-auto border-t border-secondary bg-primary">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-4">
            <p className="text-sm text-tertiary">
              {isNew ? "Adding a new " : "Editing "}
              <span className="font-semibold text-primary">
                {isNew
                  ? (record.kind === "event"
                      ? record.type
                      : `${record.type} ${record.kind}`
                    ).toLowerCase()
                  : editingTitle}
              </span>
              {session.dirty && (
                <span className="text-quaternary"> · Unsaved changes</span>
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button iconLeading={XClose} color="secondary" onClick={cancel}>
                Cancel
              </Button>
              <Button iconLeading={Save01} color="primary" onClick={save}>
                {isNew
                  ? `Add ${(record.kind === "event" ? record.type : `${record.type} ${record.kind}`).toLowerCase()}`
                  : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Discard your changes?"
        description="You have changes that haven't been saved. Leaving now will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          const leave = confirm === "exit";
          setConfirm(null);
          if (isNew) discard();
          else {
            setSession(null);
            if (leave) onExit();
          }
        }}
      />
      {del.modal}
    </div>
  );
}
