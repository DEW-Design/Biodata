"use client";

// Reviewing flagged concepts: the admin's management screen for this project (29 Sept 2026).
// A flagged concept is a value on a survey record that has been marked questionable. It is
// management work, not a view of the records, so it is not a tab: Survey records shows a banner
// ("N flagged concepts need review across this project · Review") that opens this screen, and the
// admin's Home lists the oldest ones across projects.
//
// The screen follows the DSA and DLA forms (CONTRACTS 4.1): column 2 is the queue, the way a form's
// column 2 lists its sections (a progress bar, then every flagged concept with its state), and main
// is a `FormPage` for the one in focus: what was flagged, the value now, the field's comment and
// files, and "Why is it resolved?". Resolve moves to the next one; Undo is on the toast.
//
// Patterns (no Mobbin tool was available this session): Linear Triage and GitHub review
// conversations (a queue beside the item in focus, one decision each, the next opens), Figma and
// Google Docs comments (Open / Resolved, resolved kept with its reason), Sentry (count and age).
//
// Reads the persisted field-notes store, so it always agrees with the markers on the records.

import { useMemo, useState } from "react";
import {
  Focusable,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  ToggleButton,
  ToggleButtonGroup,
} from "react-aria-components";
import { ArrowNarrowLeft, CheckCircle, Edit05, Flag01, MessageSquare01, Paperclip, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { toast } from "@/components/application/toast/toast";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { cx } from "@/utils/cx";
import { useEditStore } from "./edit-store";
import {
  EMPTY_NOTES_VALUE,
  fieldNotesActions,
  noteDate,
  recordFieldKeys,
  useFieldNotes,
  type FieldNotes,
} from "./field-notes-store";
import { useCurrentUserName } from "./field-notes";
import { displayValue } from "./field-schema";
import { KIND_LABEL, RecordIcon } from "./record-inspector";
import { RecordFullView, type EditTarget } from "./record-full-view";
import { RecordFullscreenV3 } from "./record-fullscreen";
import type { SurveyRecord } from "./survey-data";
import { segmentClass, segmentTrayClass } from "./segmented";
import {
  LIVE_PROJECT,
  portfolioActions,
  portfolioSeedId,
  type ReviewEntry,
} from "./flagged-portfolio";

export type ReviewStatus = "open" | "resolved";

export interface ReviewItem {
  id: string;
  record: SurveyRecord;
  key: string;
  sectionId: string;
  sectionTitle: string;
  field: string;
  value: string;
  notes: FieldNotes;
  /** The flag (open) or the resolution (resolved): who, when and why. */
  by: string;
  date: string;
  reason: string;
  daysWaiting: number | null;
}

type NotesMap = ReturnType<typeof useFieldNotes>;

const daysSince = (date: string): number | null => {
  const t = new Date(date).getTime();
  return Number.isNaN(t)
    ? null
    : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
};

/** "Today", "3 days", "5 weeks", "11 months". */
export function waited(days: number | null): string {
  if (days == null) return "";
  if (days === 0) return "Today";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

/** The field's value as read on the record. */
function valueOf(
  record: SurveyRecord,
  sectionId: string,
  field: string,
): string {
  const section = record.sections.find((s) => s.id === sectionId);
  if (!section) return "";
  const row = section.rows?.find((r) => r.label === field);
  if (row) return displayValue(row, section.rows);
  const m = section.measurements?.find((x) => x.type === field);
  if (m) return `${m.value} ${m.unit}`.trim();
  return "See the record";
}

/** Every flagged concept (open) and every resolved one, across the given records. */
export function collectReviewItems(
  notes: NotesMap,
  records: SurveyRecord[],
): { open: ReviewItem[]; resolved: ReviewItem[] } {
  const open: ReviewItem[] = [];
  const resolved: ReviewItem[] = [];
  for (const record of records) {
    const keys = recordFieldKeys(record);
    for (const [key, n] of Object.entries(notes[record.id] ?? {})) {
      if (!keys.has(key) || (!n.flag && !n.resolved)) continue;
      const sectionId = key.slice(0, key.indexOf(":"));
      const field = key.slice(key.indexOf(":") + 1);
      const base = {
        id: `${record.id}|${key}`,
        record,
        key,
        sectionId,
        sectionTitle:
          record.sections.find((s) => s.id === sectionId)?.title ?? "",
        field,
        value: valueOf(record, sectionId, field),
        notes: n,
      };
      if (n.flag)
        open.push({
          ...base,
          by: n.flag.by,
          date: n.flag.date,
          reason: n.flag.reason,
          daysWaiting: daysSince(n.flag.date),
        });
      else if (n.resolved)
        resolved.push({
          ...base,
          by: n.resolved.by,
          date: n.resolved.date,
          reason: n.resolved.reason,
          daysWaiting: daysSince(n.resolved.date),
        });
    }
  }
  // Open: the longest waiting first. Resolved: the most recent first.
  open.sort((a, b) => (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0));
  resolved.sort((a, b) => (a.daysWaiting ?? 0) - (b.daysWaiting ?? 0));
  return { open, resolved };
}

export function useReviewItems() {
  const notes = useFieldNotes();
  const { records } = useEditStore();
  return useMemo(() => collectReviewItems(notes, records), [notes, records]);
}

/** Open flagged concepts per record, for the markers and the filter in Survey records. */
export function useFlagCounts(): Map<string, number> {
  const { open } = useReviewItems();
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const i of open) m.set(i.record.id, (m.get(i.record.id) ?? 0) + 1);
    return m;
  }, [open]);
}

/** A BD-5039 review item as a review entry (the shape the screen works with, for any project). */
export function toEntry(item: ReviewItem, status: ReviewStatus): ReviewEntry {
  const c = item.notes.comments[item.notes.comments.length - 1];
  return {
    id: item.id,
    status,
    projectCode: LIVE_PROJECT.code,
    projectName: LIVE_PROJECT.name,
    recordCode: item.record.code,
    recordName: item.record.name,
    recordKind: item.record.kind,
    recordType: item.record.type,
    sectionTitle: item.sectionTitle,
    field: item.field,
    value: item.value,
    reason: item.reason,
    by: item.by,
    date: item.date,
    daysWaiting: item.daysWaiting,
    flagReason: item.notes.resolved?.flagReason,
    comment: c ? { text: c.text, author: c.author, date: c.date } : undefined,
    files: item.notes.files.map((f) => f.name),
    live: {
      recordId: item.record.id,
      sectionId: item.sectionId,
      key: item.key,
    },
  };
}

/** BD-5039's flagged concepts as review entries (open and resolved). */
export function useLiveEntries(): ReviewEntry[] {
  const { open, resolved } = useReviewItems();
  return useMemo(
    () => [
      ...open.map((i) => toEntry(i, "open")),
      ...resolved.map((i) => toEntry(i, "resolved")),
    ],
    [open, resolved],
  );
}

const QUICK_REASONS = ["Value confirmed", "Value corrected", "Not an issue"];

const byWaiting = (status: ReviewStatus) => (a: ReviewEntry, b: ReviewEntry) =>
  status === "open"
    ? (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0)
    : (a.daysWaiting ?? 0) - (b.daysWaiting ?? 0);

/**
 * The review screen: column 2 is the queue, main is a `FormPage` for the flagged concept in focus.
 * Used by one project (project detail, `?view=review`) and by the admin's all-projects page
 * (`/pages/flagged-concepts`), where `showProjects` adds the project filter, groups the queue by
 * project and names the project on the form. Must sit inside an `EditStoreProvider` (Fix value edits
 * BD-5039's records there).
 */
export function ReviewScreen({
  entries,
  initialItem,
  showProjects = false,
  projectFilter,
  onProjectFilterChange,
  exitLabel,
  onExit,
  onGoToRecord,
}: {
  entries: ReviewEntry[];
  initialItem?: string | null;
  showProjects?: boolean;
  /** Project codes to show; empty = every project. */
  projectFilter?: string[];
  onProjectFilterChange?: (codes: string[]) => void;
  exitLabel: string;
  onExit: () => void;
  /** Where "Go to record" goes; omitted for an entry means it has no record page yet. */
  onGoToRecord: (entry: ReviewEntry) => void;
}) {
  const me = useCurrentUserName();
  const notes = useFieldNotes();
  const { recordById } = useEditStore();
  const [status, setStatus] = useState<ReviewStatus>(
    () => entries.find((e) => e.id === initialItem)?.status ?? "open",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItem ?? null,
  );
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [fixing, setFixing] = useState<{
    record: SurveyRecord;
    target: EditTarget;
  } | null>(null);
  const [fixEditing, setFixEditing] = useState(false);

  const projectOptions = useMemo(() => {
    const m = new Map<string, { name: string; open: number }>();
    for (const e of entries) {
      const p = m.get(e.projectCode) ?? { name: e.projectName, open: 0 };
      if (e.status === "open") p.open += 1;
      m.set(e.projectCode, p);
    }
    return [...m.entries()]
      .sort(
        (a, b) => b[1].open - a[1].open || a[1].name.localeCompare(b[1].name),
      )
      .map(([code, p]) => ({ code, ...p }));
  }, [entries]);

  const inScope = entries.filter(
    (e) => !projectFilter?.length || projectFilter.includes(e.projectCode),
  );
  const open = inScope.filter((e) => e.status === "open");
  const resolved = inScope.filter((e) => e.status === "resolved");
  // Grouped by project (projects with the most open first), oldest first inside each.
  const groups = projectOptions
    .map((p) => ({
      ...p,
      items: (status === "open" ? open : resolved)
        .filter((e) => e.projectCode === p.code)
        .sort(byWaiting(status)),
    }))
    .filter((g) => g.items.length > 0);
  const items = groups.flatMap((g) => g.items);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const index = selected ? items.indexOf(selected) : -1;
  const last = index >= items.length - 1;
  const total = open.length + resolved.length;
  const recordsAffected = new Set(
    open.map((i) => `${i.projectCode}|${i.recordCode}`),
  ).size;
  const projectsAffected = new Set(open.map((i) => i.projectCode)).size;
  const grouped = showProjects && groups.length > 1;

  const select = (id: string | undefined) => {
    setSelectedId(id ?? null);
    setReason("");
    setTried(false);
  };

  const resolve = () => {
    if (!selected) return;
    const text = reason.trim();
    if (!text) {
      setTried(true);
      return;
    }
    const entry = selected;
    let undo: () => void;
    if (entry.live) {
      const { recordId, key } = entry.live;
      const before = notes[recordId]?.[key] ?? EMPTY_NOTES_VALUE;
      fieldNotesActions.resolveFlag(recordId, key, text, me);
      undo = () => fieldNotesActions.setFieldNotes(recordId, key, before);
    } else {
      const seed = portfolioActions.get(portfolioSeedId(entry.id));
      portfolioActions.resolve(portfolioSeedId(entry.id), text, me, noteDate());
      undo = () => seed && portfolioActions.restore(seed);
    }
    const next = items[index + 1] ?? items[index - 1];
    select(next?.id);
    toast.success(`${entry.field} resolved`, {
      description: `${entry.recordCode} · ${entry.recordName}, ${entry.projectName}. The reason is kept with the field.`,
      actionLabel: "Undo",
      onAction: () => {
        undo();
        setStatus("open");
        select(entry.id);
      },
    });
  };

  const fixRecord = selected?.live
    ? recordById(selected.live.recordId)
    : undefined;

  const itemRow = (item: ReviewEntry) => (
    <ListBoxItem
      key={item.id}
      id={item.id}
      textValue={`${item.field}, ${item.recordName}`}
      className={({ isSelected, isFocusVisible }) =>
        cx(
          "flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 outline-hidden transition-colors",
          isSelected ? "bg-brand-secondary" : "hover:bg-tertiary",
          isFocusVisible && "ring-2 ring-focus-ring ring-inset",
        )
      }
    >
      {({ isSelected }) => (
        <>
          <div className="flex items-center gap-2">
            {status === "open" ? (
              <Flag01 className="size-3.5 shrink-0 text-fg-warning-primary" />
            ) : (
              <CheckCircle className="size-3.5 shrink-0 text-fg-success-primary" />
            )}
            <span
              className={cx(
                "min-w-0 flex-1 truncate text-sm font-semibold",
                isSelected ? "text-brand-secondary" : "text-secondary",
              )}
            >
              {item.field}
            </span>
            <span className="shrink-0 text-xs text-tertiary">
              {waited(item.daysWaiting)}
            </span>
          </div>
          <span className="truncate pl-[22px] text-xs text-tertiary">
            {item.recordCode} · {item.recordName}
          </span>
        </>
      )}
    </ListBoxItem>
  );

  return (
    <>
      {/* ── Column 2: the queue ── */}
      <aside
        aria-label="Flagged concepts"
        className="hidden w-[300px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex"
      >
        <div className="flex min-h-0 flex-col gap-4">
          <button
            type="button"
            onClick={onExit}
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2"
          >
            <ArrowNarrowLeft className="size-4" />
            {exitLabel}
          </button>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">
              Flagged concepts
            </p>
            <ProgressBarBase
              value={total ? (resolved.length / total) * 100 : 100}
            />
            <p className="text-xs text-balance text-tertiary">
              {open.length === 0
                ? "All resolved"
                : `${open.length} open across ${recordsAffected} record${recordsAffected === 1 ? "" : "s"}${showProjects ? ` in ${projectsAffected} project${projectsAffected === 1 ? "" : "s"}` : ""} · ${resolved.length} resolved`}
            </p>
          </div>
          {showProjects && onProjectFilterChange && (
            <MultiSelect
              aria-label="Projects"
              placeholder="All projects"
              size="sm"
              items={projectOptions.map((p) => ({
                id: p.code,
                label: p.name,
                supportingText: `${p.code} · ${p.open} open`,
              }))}
              selectedKeys={new Set(projectFilter ?? [])}
              onSelectionChange={(keys) => {
                onProjectFilterChange(
                  keys === "all"
                    ? projectOptions.map((p) => p.code)
                    : [...(keys as Set<string>)],
                );
                select(undefined);
              }}
              selectedCountFormatter={(n) =>
                `${n} project${n === 1 ? "" : "s"}`
              }
            >
              {(item) => <MultiSelect.Item {...item} />}
            </MultiSelect>
          )}
          <ToggleButtonGroup
            aria-label="Open or resolved"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[status]}
            onSelectionChange={(keys) => {
              setStatus([...keys][0] as ReviewStatus);
              select(undefined);
            }}
            className={cx(segmentTrayClass, "w-full")}
          >
            <ToggleButton
              id="open"
              className={(s) => cx(segmentClass(s), "flex-1 justify-center")}
            >
              Open <CountBadge count={open.length} />
            </ToggleButton>
            <ToggleButton
              id="resolved"
              className={(s) => cx(segmentClass(s), "flex-1 justify-center")}
            >
              Resolved <CountBadge count={resolved.length} />
            </ToggleButton>
          </ToggleButtonGroup>
          {items.length > 0 ? (
            <ListBox
              aria-label={
                status === "open"
                  ? "Open flagged concepts"
                  : "Resolved flagged concepts"
              }
              selectionMode="single"
              selectionBehavior="replace"
              disallowEmptySelection
              selectedKeys={selected ? [selected.id] : []}
              onSelectionChange={(keys) => select([...keys][0] as string)}
              className="-mx-1 flex flex-col gap-1 outline-hidden"
            >
              {grouped
                ? groups.map((g) => (
                    <ListBoxSection
                      key={g.code}
                      id={g.code}
                      className="flex flex-col gap-1 pb-2"
                    >
                      <Header className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-tertiary">
                          {g.name}
                        </span>
                        <CountBadge count={g.items.length} />
                      </Header>
                      {g.items.map(itemRow)}
                    </ListBoxSection>
                  ))
                : items.map(itemRow)}
            </ListBox>
          ) : (
            <p className="text-sm text-tertiary">
              {status === "open"
                ? "Nothing waiting for review."
                : "Nothing resolved yet."}
            </p>
          )}
        </div>
      </aside>

      {/* ── Main: the flagged concept in focus ── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
            <CheckCircle className="size-8 text-fg-success-primary" />
            <h1 className="text-lg font-semibold text-primary">
              {status === "open" ? "All clear" : "Nothing resolved yet"}
            </h1>
            <p className="max-w-sm text-sm text-balance text-tertiary">
              {status === "open"
                ? "Nothing here is flagged. New flagged concepts show up here."
                : "Resolved concepts show here with the reason they were resolved."}
            </p>
            <Button
              color="secondary"
              iconLeading={ArrowNarrowLeft}
              onClick={onExit}
              className="mt-2"
            >
              {exitLabel}
            </Button>
          </div>
        ) : (
          <FormPage
            key={selected.id}
            eyebrow={`Flagged concept - ${index + 1} of ${items.length} ${status}`}
            title={selected.field}
            badge={
              <Badge size="sm" color={status === "open" ? "warning" : "success"}>
                {status === "open" ? "Questionable" : "Resolved"}
              </Badge>
            }
            subtitle={`${selected.sectionTitle} on ${selected.recordType} ${KIND_LABEL[selected.recordKind].toLowerCase()} ${selected.recordCode}, ${selected.recordName}${showProjects ? `, in ${selected.projectName}` : ""}.`}
            onBack={index > 0 ? () => select(items[index - 1].id) : undefined}
            problems={
              tried && !reason.trim()
                ? { items: ["a reason for resolving"] }
                : undefined
            }
            primaryLabel={
              status === "open" ? "Resolve" : last ? exitLabel : "Next"
            }
            primaryIsContinue={status === "resolved" && !last}
            onPrimary={
              status === "open"
                ? resolve
                : last
                  ? onExit
                  : () => select(items[index + 1].id)
            }
          >
            {showProjects && (
              <FormRow
                title="Project"
                description="The project the record belongs to."
              >
                <p className="text-sm text-primary">
                  {selected.projectName}
                  <span className="text-tertiary">
                    {" "}
                    · {selected.projectCode}
                  </span>
                </p>
              </FormRow>
            )}
            <FormRow title="Record" description="Where the value is.">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
                  <RecordIcon
                    record={{
                      kind: selected.recordKind,
                      type: selected.recordType as SurveyRecord["type"],
                    }}
                    className="size-4 shrink-0 text-fg-quaternary"
                  />
                  <span className="truncate">
                    {selected.recordCode} · {selected.recordName}
                  </span>
                  <span className="text-xs text-tertiary">
                    {selected.recordType}
                  </span>
                </span>
                {selected.live ? (
                  <Button
                    size="sm"
                    color="link-color"
                    onClick={() => onGoToRecord(selected)}
                  >
                    Go to record
                  </Button>
                ) : (
                  <Tooltip title="This project has no record pages in this preview yet">
                    <Focusable>
                      <span className="inline-flex">
                        <Button size="sm" color="link-color" isDisabled>
                          Go to record
                        </Button>
                      </span>
                    </Focusable>
                  </Tooltip>
                )}
              </div>
            </FormRow>

            <FormRow
              title="Current value"
              description="As it reads on the record now."
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary">
                  {selected.value || "Not provided"}
                </p>
                {status === "open" &&
                  (fixRecord && selected.live ? (
                    <Button
                      color="secondary"
                      iconLeading={Edit05}
                      onClick={() => {
                        setFixEditing(false);
                        setFixing({
                          record: fixRecord,
                          target: {
                            sectionId: selected.live!.sectionId,
                            fieldKey: selected.live!.key,
                          },
                        });
                      }}
                    >
                      Fix value
                    </Button>
                  ) : (
                    <Tooltip title="Fixing a value needs the record page, which this project doesn't have in this preview">
                      <Focusable>
                        <span className="inline-flex">
                          <Button
                            color="secondary"
                            iconLeading={Edit05}
                            isDisabled
                          >
                            Fix value
                          </Button>
                        </span>
                      </Focusable>
                    </Tooltip>
                  ))}
              </div>
            </FormRow>

            <FormRow
              title={status === "open" ? "Why it was flagged" : "Resolution"}
              description={
                status === "open"
                  ? `Waiting ${waited(selected.daysWaiting).toLowerCase()}.`
                  : undefined
              }
            >
              <div
                className={cx(
                  "flex flex-col gap-1 rounded-lg border px-3 py-2.5",
                  status === "open"
                    ? "border-warning-200 bg-warning-25"
                    : "border-secondary bg-secondary",
                )}
              >
                <p className="text-sm text-balance text-primary">
                  {selected.reason}
                </p>
                <p className="text-xs text-tertiary">
                  {selected.by} · {selected.date}
                </p>
                {status === "resolved" && selected.flagReason && (
                  <p className="text-xs text-tertiary">
                    Had been flagged as: {selected.flagReason}
                  </p>
                )}
              </div>
            </FormRow>

            {(selected.comment || selected.files.length > 0) && (
              <FormRow
                title="Notes on this field"
                description="The field's comment and attachments."
              >
                {selected.comment && (
                  <div className="flex gap-2 text-sm">
                    <MessageSquare01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-balance text-secondary">
                        {selected.comment.text}
                      </p>
                      <p className="text-xs text-tertiary">
                        {selected.comment.author} · {selected.comment.date}
                      </p>
                    </div>
                  </div>
                )}
                {selected.files.length > 0 && (
                  <p className="flex items-center gap-2 text-sm text-secondary">
                    <Paperclip className="size-4 shrink-0 text-fg-quaternary" />
                    {selected.files.join(", ")}
                  </p>
                )}
              </FormRow>
            )}

            {status === "open" && (
              <FormRow
                title="Why is it resolved?"
                required
                description="Kept with the field, so anyone can see why it stands or what changed."
              >
                <TextArea
                  aria-label="Why is it resolved?"
                  isRequired
                  isInvalid={tried && !reason.trim()}
                  rows={3}
                  value={reason}
                  onChange={setReason}
                  placeholder="For example: checked against the field sheet, the value stands."
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_REASONS.map((r) => (
                    <Button iconLeading={Plus}
                      key={r}
                      size="sm"
                      color="secondary"
                      onClick={() => setReason(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </FormRow>
            )}
          </FormPage>
        )}
      </main>

      {/* Fix value: the record full screen with this field's card in edit mode; back here when done. */}
      <RecordFullscreenV3
        isOpen={fixing !== null}
        isEditing={fixEditing}
        onClose={() => setFixing(null)}
        label={`${fixing?.record.name ?? "Record"}, full screen`}
      >
        {fixing && (
          <RecordFullView
            key={`${fixing.record.id}-${fixing.target.fieldKey}`}
            record={fixing.record}
            onSelect={() => {}}
            onAdd={() => {}}
            onExit={() => setFixing(null)}
            initialEdit={fixing.target}
            onEditingChange={(editing) => {
              if (fixEditing && !editing) setFixing(null);
              setFixEditing(editing);
            }}
          />
        )}
      </RecordFullscreenV3>
    </>
  );
}
