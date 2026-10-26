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
// in edit mode its header has a "Manage concepts" checklist of that section's concepts (visibility-panel.tsx), "Add section"
// under the cards puts back a section that isn't on screen, the right column keeps the Record card with where the
// record sits, and Cancel and Save changes sit in a footer across the bottom.
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
import { ArrowLeft, ChevronDown, EyeOff, InfoCircle, Plus, Save01, Trash01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { cx } from "@/utils/cx";
import { useEditStore } from "./edit-store";
import { fromDraft, missingFor, toDraft, type Draft } from "./record-form";
import { RecordIcon, recordIcon } from "./record-inspector";
import { typeLabel } from "@/app/pages/_shared/record-shapes";
import { RecordQuickActions } from "./record-quick-actions";
import { type ChildOption } from "./record-rules";
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
  sectionFieldEntries,
  sectionKey,
  sectionRemovable,
  sectionShownInEdit,
  setHiddenFields,
  useHiddenFields,
} from "./field-visibility-store";
import {
  ExpandAllToggle,
  FullscreenToggle,
  Path,
  SectionEditIcon,
  SectionFields,
  SectionTitle,
  shownPosition,
  useDeleteRecord,
} from "./record-panel";
import { SectionFieldsMenu } from "./visibility-panel";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { kindShape } from "@/app/pages/_shared/record-shapes";
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

/**
 * Where the record sits, from the project down to this record: each step with its shape, full name and ID, indented
 * a level at a time like the records tree, the record itself marked. Shown in view and while editing, so an edit
 * always says which record it is in (designer, 23 Oct 2026: "not just IDs"). Steps open their record, except while
 * editing, when leaving would lose the edit.
 */
function Hierarchy({
  ancestors,
  current,
  onSelect,
}: {
  ancestors: SurveyRecord[];
  current: SurveyRecord;
  onSelect?: (id: string | null) => void;
}) {
  const { project, meta } = useEditStore();
  const steps = [
    { id: null, kind: "event" as const, name: project.details.shortTitle, code: meta.code, type: "Project" },
    ...ancestors.map((a) => ({ id: a.id, kind: a.kind, name: a.name, code: a.code, type: typeLabel(a) })),
    { id: current.id, kind: current.kind, name: current.name || "New record", code: current.code, type: typeLabel(current) },
  ];
  return (
    <div className="flex flex-col gap-2 border-t border-secondary pt-3">
      <p className="text-sm text-tertiary">Location in hierarchy</p>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {steps.map((step, i) => {
          const Shape = kindShape(step.kind);
          const isCurrent = i === steps.length - 1;
          const body = (
            <>
              <Shape className="mt-0.5 size-4" />
              <span className="flex min-w-0 flex-col">
                <span className={cx("truncate text-sm", isCurrent ? "font-semibold text-primary" : "text-secondary")}>
                  {step.name}
                </span>
                <span className="truncate text-xs text-tertiary">
                  {step.type}, {step.code}
                </span>
              </span>
            </>
          );
          return (
            <li key={step.id ?? "project"} style={{ paddingLeft: i * 12 }}>
              {onSelect && !isCurrent ? (
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  className="-mx-1.5 flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                >
                  {body}
                </button>
              ) : (
                <div aria-current={isCurrent ? "page" : undefined} className="-mx-1.5 flex items-start gap-2 rounded-md px-1.5 py-1">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * While editing, Add section puts back a section of this record that is not on screen (removed, hidden or empty). It is
 * always there while editing, so adding a section can be found; with every section on screen it is disabled and says so.
 */
function AddSectionMenu({ sections, onAdd }: { sections: MetaSection[]; onAdd: (id: string) => void }) {
  if (sections.length === 0)
    return (
      <div className="flex items-center gap-3">
        <Button color="secondary" size="sm" iconLeading={Plus} isDisabled>
          Add section
        </Button>
        <p className="text-sm text-tertiary">Every section is on this record.</p>
      </div>
    );
  return (
    <Dropdown.Root>
      <Button color="secondary" size="sm" iconLeading={Plus} iconTrailing={ChevronDown} className="self-start">
        Add section
      </Button>
      <Dropdown.Popover placement="bottom start" className="w-60">
        <Dropdown.Menu aria-label="Add a section" onAction={(key) => onAdd(String(key))}>
          {sections.map((section) => (
            <Dropdown.Item key={section.id} id={section.id} label={section.title} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/**
 * Remove section, in the header of a card being edited. A section holding a field that must stay (an ID, a name, a
 * start date) can't be removed: the control stays, disabled, and its tooltip says why.
 */
function RemoveSectionButton({ title, removable, onPress }: { title: string; removable: boolean; onPress: () => void }) {
  return (
    <Tooltip title={removable ? `Remove ${title.toLowerCase()}` : `${title} holds required fields, so it can't be removed`}>
      <TooltipTrigger
        aria-label={`Remove ${title}`}
        // Not isDisabled: a disabled button shows no tooltip, and the tooltip is what says why.
        aria-disabled={!removable || undefined}
        onPress={removable ? onPress : undefined}
        className={cx(
          "flex size-9 items-center justify-center rounded-lg text-fg-quaternary outline-focus-ring focus-visible:outline-2",
          removable ? "cursor-pointer hover:bg-primary_hover hover:text-fg-error-secondary" : "cursor-not-allowed opacity-40",
        )}
      >
        <Trash01 className="size-4" />
      </TooltipTrigger>
    </Tooltip>
  );
}

export interface EditTarget {
  /** A section id, or "*" for every card at once (Edit record). */
  sectionId: string;
  fieldKey?: string;
  /** The section is being added from the "+" menu: it is put back on the record (every field shown) as the edit opens. */
  addSection?: boolean;
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
  variant = "full",
}: {
  /** "panel": the same record and edit, laid out to fit the details panel beside the list (one column, no right-hand
   *  column, no full-screen control), so Edit happens where it was started (designer, 23 Oct 2026). */
  variant?: "full" | "panel";
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
  const panel = variant === "panel";
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

  const begin = (target: EditTarget): Session => {
    // Empty concepts start hidden: they are added by ticking them in the section's Manage concepts checklist.
    const hidden = new Set([
      ...savedHidden,
      ...[...emptyFieldKeys(record)].filter(
        (k) => !REQUIRED_FIELD.test(k.slice(k.indexOf(":") + 1)),
      ),
    ]);
    const added = target.addSection ? record.sections.find((x) => x.id === target.sectionId) : undefined;
    if (added) {
      hidden.delete(sectionKey(added.id));
      for (const f of sectionFieldEntries(added)) hidden.delete(f.key);
    }
    return {
      sectionIds: [target.sectionId],
      focusField: target.fieldKey,
      draft: toDraft(record, store.artefactsFor(record.id)),
      notes: { ...(notes[record.id] ?? {}) },
      hidden,
      dirty: !!added,
      attempted: false,
    };
  };
  const [session, setSession] = useState<Session | null>(() =>
    isNew
      ? begin({ sectionId: ALL })
      : initialEdit && store.canEdit
        ? begin(initialEdit)
        : null,
  );
  const [confirm, setConfirm] = useState<null | "cancel" | "exit">(null);
  // A section added from "+" may sit far down the record: once it is drawn, take the eye to it.
  const [reveal, setReveal] = useState<string | null>(initialEdit?.addSection ? initialEdit.sectionId : null);
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(`[id="full-card-${reveal}"]`);
      el?.scrollIntoView({ block: "start", behavior: "smooth" });
      flashElement(el);
      setReveal(null);
    }, 400);
    return () => clearTimeout(t);
  }, [reveal]);
  // The panel's box, for the fixed save bar to line up with it.
  const [panelBox, setPanelBox] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const el = rootRef.current?.parentElement;
    if (!panel || !el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setPanelBox({ left: r.left, width: r.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [panel]);
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
  // Sections not on the record when viewed (removed, hidden or empty): what "+" > Add section offers.
  const offRecord = record.sections.filter((x) => !isSectionShown(x, savedHidden) || !hasContent(x));
  const update = (p: Partial<Session>) =>
    setSession((s) => (s ? { ...s, ...p, dirty: true } : s));
  // Remove section: the whole card comes off the record (its values are kept, and Add section puts it back).
  const removeSection = (sectionId: string) => {
    const title = record.sections.find((x) => x.id === sectionId)?.title ?? "Section";
    update({ hidden: new Set([...(session?.hidden ?? []), sectionKey(sectionId)]) });
    toast.success(`${title} removed`, { description: "Add section puts it back. Nothing changes until you save." });
  };
  // Add section: show every field of it, put it in edit mode with the rest, and take the eye to it.
  const addSection = (sectionId: string) => {
    const section = record.sections.find((x) => x.id === sectionId);
    if (!section) return;
    setSession((s) => {
      if (!s) return s;
      const next = new Set(s.hidden);
      next.delete(sectionKey(sectionId));
      for (const f of sectionFieldEntries(section)) next.delete(f.key);
      return {
        ...s,
        hidden: next,
        sectionIds: s.sectionIds.includes(ALL) || s.sectionIds.includes(sectionId) ? s.sectionIds : [...s.sectionIds, sectionId],
        dirty: true,
      };
    });
    setTimeout(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(`[id="full-card-${sectionId}"]`);
      el?.scrollIntoView({ block: "start", behavior: "smooth" });
      flashElement(el);
    }, 60);
  };
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
      <div className={cx("sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-secondary bg-primary", panel ? "px-4 py-2" : "px-8 py-2.5")}>
        <Path
          ancestors={store.ancestorsOf(record)}
          current={record}
          onSelect={onSelect}
          fold={panel}
        />
        {!panel && <FullscreenToggle isFullscreen onToggle={exit} />}
      </div>

      <div
        className={cx(
          "grid w-full flex-1 grid-cols-1",
          panel ? cx("gap-6 p-5", editing && "pb-24") : "mx-auto max-w-6xl gap-10 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start gap-4">
            {record.scientificName && (
              <SpeciesPhoto
                scientificName={record.scientificName}
                alt={record.name}
                fallbackIcon={recordIcon(record)}
                className="size-14"
              />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              {/* The kind's shape at the size the tree draws it, not a large tile (designer, 23 Oct 2026). */}
              <p className="flex items-center gap-1 text-xs font-semibold tracking-wide text-quaternary uppercase">
                <RecordIcon record={record} className="size-4" />
                {typeLabel(record)}
              </p>
              <h1 className={cx("font-semibold text-balance text-primary", panel ? "text-xl" : "text-2xl")}>
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

          {!editing && !isNew && (
            <RecordQuickActions
              record={record}
              onAdd={(o) => onAdd(record, o)}
              onEdit={() => startEdit(ALL)}
              onDelete={del.ask}
              sections={offRecord}
              onAddSection={(id) => {
                setSession(begin({ sectionId: id, addSection: true }));
                setReveal(id);
              }}
            />
          )}

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
                    {isEditing && session ? (
                      <>
                        <SectionFieldsMenu
                          section={section}
                          hidden={session.hidden}
                          onChange={(next) => update({ hidden: next })}
                        />
                        <RemoveSectionButton
                          title={section.title}
                          removable={sectionRemovable(section)}
                          onPress={() => removeSection(section.id)}
                        />
                      </>
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

          {session && store.canEdit && (
            <AddSectionMenu
              sections={record.sections.filter((section) =>
                allEditing || session.sectionIds.includes(section.id)
                  ? !sectionShownInEdit(section, session.hidden)
                  : !isSectionShown(section, hidden) || !hasContent(section),
              )}
              onAdd={addSection}
            />
          )}
        </div>

        <aside className={cx("flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start", panel && "hidden")}>
          <SideCard title="Record">
            <SummaryRow label="Type">{typeLabel(record)}</SummaryRow>
            <SummaryRow label="ID">{record.code}</SummaryRow>
            {hasDateField(record) && (
              <SummaryRow label="Date">{formatDate(record.date)}</SummaryRow>
            )}
            {!session && observerNames(record).length > 0 && (
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
            <Hierarchy
              ancestors={store.ancestorsOf(record)}
              current={record}
              onSelect={editing ? undefined : onSelect}
            />
          </SideCard>
          {!session && (
            <>
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
                      : `${lat.toFixed(3)}, ${lon.toFixed(3)} (GDA2020)`}
                  </p>
                </SideCard>
              )}

              <SideCard title="Notes on this record">
                {noted.length === 0 ? (
                  <p className="text-sm text-tertiary">
                    No flags, comments or files yet.
                    {store.canEdit ? " Edit a concept to add one." : ""}
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
        <div
          // In the panel the bar is fixed to the bottom of the window across the panel's width, as the full view's is
          // across the screen (designer, 23 Oct 2026), so Save is in reach however far down the page is scrolled.
          style={panel && panelBox ? { left: panelBox.left, width: panelBox.width } : undefined}
          className={cx(
            "z-20 border-t border-secondary bg-primary",
            panel ? "fixed bottom-0 rounded-b-xl border-x shadow-lg" : "sticky bottom-0 mt-auto",
          )}
        >
          <div className={cx("flex w-full items-center justify-between gap-3", panel ? "px-5 py-3" : "mx-auto max-w-6xl px-8 py-4")}>
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
                <span className="text-quaternary">, unsaved changes</span>
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
