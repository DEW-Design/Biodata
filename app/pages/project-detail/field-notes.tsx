"use client";

// VERSION 3: a record field (property) row, and the notes attached to it.
//
// A field carries three kinds of note, always shown in the same three tabs (styled like the
// Tree / Table switch), whether the record is being viewed or edited:
//   - Comment: one comment per field. It is added once and after that only edited (never a growing
//     thread), the "single note" pattern of Airtable's field description and a spreadsheet cell note.
//   - Questionable: an admin (BioData or Privileged) marks the value questionable, with the reason,
//     and resolves it later, again with a reason. The last resolution is kept with the field.
//   - Attachments: files and reference links. Artefacts and attachments belong to a property.
//
// Viewing: a field with notes is one button: clicking anywhere on it opens its notes, clicking again
// closes them. Everything is read only there, except that an admin can resolve a questionable value
// in place. For anyone who can edit, hovering the field shows an edit icon, which opens the field in
// edit mode.
// Editing: under each field, "Notes" opens the same tabs, now editable. Changes belong to the edit
// session and are saved with Save changes. A field that is itself a comment (a "Site comment") is
// edited as a value only: it takes no notes.

import { createElement, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  DotsVertical,
  Edit02,
  FileAttachment02,
  FileCheck02,
  Flag01,
  Image01,
  Link01,
  MessageSquare01,
  Paperclip,
  Trash01,
  UploadCloud02,
  VideoRecorder,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { toast } from "@/components/application/toast/toast";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";
import {
  fieldNotesActions,
  hasNotes,
  kindForFile,
  noteDate,
  noteId,
  type FieldFileKind,
  type FieldNotes,
} from "./field-notes-store";

const EMPTY = new Set(["", "Not provided", "None recorded"]);
export const FILE_ICON: Record<FieldFileKind, typeof Image01> = {
  image: Image01,
  pdf: FileAttachment02,
  spreadsheet: FileCheck02,
  video: VideoRecorder,
  link: Link01,
};
export const EMPTY_FIELD_NOTES: FieldNotes = { comments: [], files: [] };

/** A field that is itself a comment takes no notes: it is edited as a value only. */
export const takesNotes = (label: string) => !/comment$/i.test(label.trim());

/** The person adding notes: the persona's placeholder name. */
export function useCurrentUserName(): string {
  const role = useUserRole();
  return role === "biodata-admin" ? "Jane Harlow" : "Olivia Wyatt";
}

/**
 * Marking a value questionable, and resolving it, is an admin's review task: a BioData Admin or a
 * Privileged Admin (decided by the designer, 28 Sept 2026). Everyone else who can edit adds the
 * comment and attachments, and sees questionable values read only.
 */
export function useCanReview(): boolean {
  const role = useUserRole();
  return role === "biodata-admin" || role === "privileged-admin";
}

/** The field's one comment (older data may hold more; the latest is the one shown and edited). */
const commentOf = (n: FieldNotes) => n.comments[n.comments.length - 1];

/**
 * Note markers stay quiet: plain small icons, no backgrounds. Comments and attachments use the same
 * grey as other secondary icons; only questionable is coloured (the warning icon colour), because
 * it is the one that asks a reviewer to act.
 */
export const NOTE_TONE = {
  flag: "text-fg-warning-primary",
  comment: "text-fg-quaternary",
  file: "text-fg-quaternary",
} as const;
export const NOTE_MARK =
  "inline-flex items-center gap-0.5 text-xs text-tertiary";

export function NoteIndicators({
  notes,
  className,
}: {
  notes: FieldNotes;
  className?: string;
}) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      {notes.flag && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.flag)}
          title="Marked questionable"
        >
          <Flag01 className="size-3" />
        </span>
      )}
      {notes.comments.length > 0 && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.comment)}
          title="Has a comment"
        >
          <MessageSquare01 className="size-3" />
        </span>
      )}
      {notes.files.length > 0 && (
        <span
          className={cx(NOTE_MARK, NOTE_TONE.file)}
          title={`${notes.files.length} attachment${notes.files.length === 1 ? "" : "s"}`}
        >
          <Paperclip className="size-3" />
          {notes.files.length}
        </span>
      )}
    </span>
  );
}

function FileChip({
  file,
  onRemove,
}: {
  file: FieldNotes["files"][number];
  onRemove?: () => void;
}) {
  const icon = createElement(FILE_ICON[file.kind], {
    className: "size-3.5 shrink-0 text-fg-quaternary",
  });
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-secondary bg-primary px-2 py-1 text-xs text-secondary">
      {icon}
      {file.kind === "link" && file.url ? (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-brand-secondary hover:underline"
          title={file.url}
        >
          {file.name}
        </a>
      ) : (
        <span className="truncate">{file.name}</span>
      )}
      {file.kind !== "link" && (
        <span className="shrink-0 text-quaternary">{file.size}</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          className="-mr-1 shrink-0 rounded p-0.5 text-fg-quaternary hover:bg-primary_hover"
        >
          <Trash01 className="size-3" />
        </button>
      )}
    </span>
  );
}

const Meta = ({ children }: { children: ReactNode }) => (
  <p className="text-xs text-quaternary">{children}</p>
);

// ── Notes on a field: cards, one small editor, one menu ──
//
// Patterns (no Mobbin tool this session): comment cards with a resolve button and a "..." menu for
// edit and remove, as in Google Docs and Figma comments; field actions behind a "..." that appears
// on hover, as in Notion and Airtable. The same cards and menu are used when viewing a record (the
// change is saved at once) and in edit mode (the change goes into the draft, saved with the record).

type NoteKind = "comment" | "flag" | "link";

function CardShell({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning" | "muted";
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "group/note flex flex-col gap-2 rounded-lg border px-3 py-2.5",
        tone === "warning"
          ? "border-warning-200 bg-warning-25"
          : tone === "muted"
            ? "border-secondary bg-secondary"
            : "border-secondary bg-primary",
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  icon: Icon,
  title,
  iconClass,
  actions,
}: {
  icon: typeof Flag01;
  title: string;
  iconClass?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cx("size-3.5 shrink-0", iconClass ?? "text-fg-quaternary")}
      />
      <p className="text-xs font-semibold text-secondary">{title}</p>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}

/** A "..." menu on a note card: Edit and Remove (Remove in the destructive style). */
function CardMenu({
  label,
  onEdit,
  onRemove,
}: {
  label: string;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <Dropdown.Root>
      <Button
        color="tertiary"
        size="sm"
        iconLeading={DotsVertical}
        aria-label={`${label} options`}
        className="size-7 p-0 opacity-0 transition-opacity group-hover/note:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
      />
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={`${label} options`}
          onAction={(k) => (k === "edit" ? onEdit?.() : onRemove?.())}
        >
          {onEdit ? (
            <Dropdown.Item id="edit" label="Edit" icon={Edit02} />
          ) : null}
          {onRemove ? (
            <Dropdown.Item
              id="remove"
              label="Remove"
              icon={Trash01}
              destructive
            />
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/** Text in, a named action out. Used to add, edit, mark and resolve. */
function TextComposer({
  label,
  placeholder,
  initial = "",
  action,
  hint,
  onSave,
  onCancel,
}: {
  label: string;
  placeholder: string;
  initial?: string;
  action: string;
  hint?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const ok = !!text.trim() && text.trim() !== initial.trim();
  return (
    <div className="flex flex-col gap-2">
      <TextArea
        aria-label={label}
        placeholder={placeholder}
        rows={2}
        value={text}
        onChange={setText}
        autoFocus
        hint={hint}
      />
      <div className="flex justify-end gap-2">
        <Button color="tertiary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          color="secondary"
          size="sm"
          isDisabled={!ok}
          onClick={() => onSave(text.trim())}
        >
          {action}
        </Button>
      </div>
    </div>
  );
}

function ConfirmRemove({
  what,
  onRemove,
  onCancel,
}: {
  what: string;
  onRemove: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-secondary">
        Remove this {what}? It can&apos;t be undone.
      </p>
      <div className="flex gap-2">
        <Button color="tertiary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="primary-destructive" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

function CommentCard({
  notes,
  onChange,
}: {
  notes: FieldNotes;
  onChange?: (next: FieldNotes) => void;
}) {
  const me = useCurrentUserName();
  const comment = commentOf(notes);
  const [mode, setMode] = useState<"view" | "edit" | "remove">("view");
  if (!comment) return null;
  return (
    <CardShell>
      <CardHeader
        icon={MessageSquare01}
        title="Comment"
        actions={
          onChange && mode === "view" ? (
            <CardMenu
              label="Comment"
              onEdit={() => setMode("edit")}
              onRemove={() => setMode("remove")}
            />
          ) : undefined
        }
      />
      {mode === "edit" && onChange ? (
        <TextComposer
          label="Edit the comment"
          placeholder="What should people know about this value?"
          initial={comment.text}
          action="Save comment"
          onCancel={() => setMode("view")}
          onSave={(text) => {
            onChange({
              ...notes,
              comments: [
                { id: comment.id, author: me, date: noteDate(), text },
              ],
            });
            setMode("view");
          }}
        />
      ) : (
        <>
          <p className="text-sm text-balance text-primary">{comment.text}</p>
          <Meta>
            {comment.author} · {comment.date}
          </Meta>
        </>
      )}
      {mode === "remove" && onChange && (
        <ConfirmRemove
          what="comment"
          onCancel={() => setMode("view")}
          onRemove={() => onChange({ ...notes, comments: [] })}
        />
      )}
    </CardShell>
  );
}

function QuestionableCard({
  notes,
  onChange,
  onResolved,
}: {
  notes: FieldNotes;
  onChange?: (next: FieldNotes) => void;
  onResolved?: () => void;
}) {
  const me = useCurrentUserName();
  const canReview = useCanReview();
  const [mode, setMode] = useState<"view" | "edit" | "remove" | "resolve">(
    "view",
  );
  const flag = notes.flag;
  if (!flag) return null;
  const canAct = canReview && !!onChange;
  return (
    <CardShell tone="warning">
      <CardHeader
        icon={Flag01}
        iconClass="text-fg-warning-primary"
        title="Questionable"
        actions={
          canAct && mode === "view" ? (
            <>
              <Button
                color="secondary"
                size="sm"
                iconLeading={Check}
                onClick={() => setMode("resolve")}
              >
                Resolve
              </Button>
              <CardMenu
                label="Questionable"
                onEdit={() => setMode("edit")}
                onRemove={() => setMode("remove")}
              />
            </>
          ) : undefined
        }
      />
      {mode === "edit" && onChange ? (
        <TextComposer
          label="Why is this value questionable?"
          placeholder="Why is this value questionable?"
          initial={flag.reason}
          action="Save"
          onCancel={() => setMode("view")}
          onSave={(reason) => {
            onChange({ ...notes, flag: { ...flag, reason } });
            setMode("view");
          }}
        />
      ) : (
        <>
          <p className="text-sm text-balance text-primary">{flag.reason}</p>
          <Meta>
            {flag.by} · {flag.date}
          </Meta>
        </>
      )}
      {mode === "resolve" && onChange && (
        <TextComposer
          label="Why is it resolved?"
          placeholder="Why is it resolved?"
          action="Resolve"
          hint="The reason is kept with the field."
          onCancel={() => setMode("view")}
          onSave={(reason) => {
            onChange({
              ...notes,
              flag: undefined,
              resolved: {
                reason,
                by: me,
                date: noteDate(),
                flagReason: flag.reason,
              },
            });
            onResolved?.();
          }}
        />
      )}
      {mode === "remove" && onChange && (
        <ConfirmRemove
          what="flag"
          onCancel={() => setMode("view")}
          onRemove={() => onChange({ ...notes, flag: undefined })}
        />
      )}
    </CardShell>
  );
}

function ResolvedCard({ notes }: { notes: FieldNotes }) {
  if (notes.flag || !notes.resolved) return null;
  const r = notes.resolved;
  return (
    <CardShell tone="muted">
      <CardHeader icon={Check} title="Resolved" />
      <p className="text-sm text-balance text-secondary">{r.reason}</p>
      <Meta>
        {r.by} · {r.date} · it had been questioned as: &ldquo;{r.flagReason}
        &rdquo;
      </Meta>
    </CardShell>
  );
}

function AttachmentsCard({
  notes,
  onChange,
}: {
  notes: FieldNotes;
  onChange?: (next: FieldNotes) => void;
}) {
  if (notes.files.length === 0) return null;
  return (
    <CardShell>
      <CardHeader
        icon={Paperclip}
        title={`Attachments (${notes.files.length})`}
      />
      <div className="flex flex-wrap gap-1.5">
        {notes.files.map((f) => (
          <FileChip
            key={f.id}
            file={f}
            onRemove={
              onChange
                ? () =>
                    onChange({
                      ...notes,
                      files: notes.files.filter((x) => x.id !== f.id),
                    })
                : undefined
            }
          />
        ))}
      </div>
    </CardShell>
  );
}

function LinkComposer({
  onSave,
  onCancel,
}: {
  onSave: (url: string, title: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const ok = /^https?:\/\/\S+\.\S+/.test(url.trim());
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
        <Input
          aria-label="Link address"
          placeholder="https://"
          value={url}
          onChange={setUrl}
          autoFocus
        />
        <Input
          aria-label="Link title (optional)"
          placeholder="Title (optional)"
          value={title}
          onChange={setTitle}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button color="tertiary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          color="secondary"
          size="sm"
          isDisabled={!ok}
          onClick={() => onSave(url.trim(), title.trim())}
        >
          Add link
        </Button>
      </div>
    </div>
  );
}

/**
 * A field's notes as cards: comment, questionable (or its last resolution) and attachments, plus the
 * one editor opened from the field's menu. Without `onChange` it is read only.
 */
export function FieldNotesArea({
  label,
  notes,
  onChange,
  composer,
  onComposerDone,
  onResolved,
  className,
}: {
  label: string;
  notes: FieldNotes;
  onChange?: (next: FieldNotes) => void;
  composer?: NoteKind | null;
  onComposerDone?: () => void;
  onResolved?: () => void;
  className?: string;
}) {
  const me = useCurrentUserName();
  const done = () => onComposerDone?.();
  if (!hasNotes(notes) && !composer) return null;
  return (
    <div
      role="group"
      aria-label={`Notes on ${label}`}
      className={cx("@container flex flex-col gap-2", className)}
    >
      {composer === "comment" && onChange && (
        <CardShell>
          <CardHeader icon={MessageSquare01} title="New comment" />
          <TextComposer
            label="Add a comment"
            placeholder="What should people know about this value?"
            action="Add comment"
            hint="A field has one comment. Once added, it can be edited."
            onCancel={done}
            onSave={(text) => {
              onChange({
                ...notes,
                comments: [
                  { id: noteId("c"), author: me, date: noteDate(), text },
                ],
              });
              done();
            }}
          />
        </CardShell>
      )}
      {composer === "flag" && onChange && (
        <CardShell tone="warning">
          <CardHeader
            icon={Flag01}
            iconClass="text-fg-warning-primary"
            title="Mark questionable"
          />
          <TextComposer
            label="Why is this value questionable?"
            placeholder="Why is this value questionable?"
            action="Mark questionable"
            onCancel={done}
            onSave={(reason) => {
              onChange({
                ...notes,
                flag: { reason, by: me, date: noteDate() },
              });
              done();
            }}
          />
        </CardShell>
      )}
      {composer === "link" && onChange && (
        <CardShell>
          <CardHeader icon={Link01} title="Add a link" />
          <LinkComposer
            onCancel={done}
            onSave={(url, title) => {
              onChange({
                ...notes,
                files: [
                  ...notes.files,
                  {
                    id: noteId("l"),
                    name: title || url.replace(/^https?:\/\//, ""),
                    size: "",
                    kind: "link",
                    url,
                    addedBy: me,
                    date: noteDate(),
                  },
                ],
              });
              done();
            }}
          />
        </CardShell>
      )}
      <CommentCard notes={notes} onChange={onChange} />
      <QuestionableCard
        notes={notes}
        onChange={onChange}
        onResolved={onResolved}
      />
      <ResolvedCard notes={notes} />
      <AttachmentsCard notes={notes} onChange={onChange} />
    </div>
  );
}

/**
 * The field's menu (vertical dots), shown on hover or focus: the note actions that apply now (a comment is
 * added once, then edited on its card; questionable is for admins). "Attach a file" opens the file
 * picker straight away. `leading` items (e.g. Edit field) come first.
 */
export function FieldNoteMenu({
  label,
  notes,
  onPick,
  onFile,
  leading = [],
  className,
}: {
  label: string;
  notes: FieldNotes;
  onPick: (kind: NoteKind) => void;
  onFile: (note: FieldNotes["files"][number]) => void;
  leading?: {
    id: string;
    label: string;
    icon: typeof Flag01;
    onAction: () => void;
  }[];
  className?: string;
}) {
  const me = useCurrentUserName();
  const canReview = useCanReview();
  const fileInput = useRef<HTMLInputElement>(null);
  const items: { id: string; label: string; icon: typeof Flag01 }[] = [
    ...(commentOf(notes)
      ? []
      : [{ id: "comment", label: "Add comment", icon: MessageSquare01 }]),
    ...(canReview && !notes.flag
      ? [{ id: "flag", label: "Mark questionable", icon: Flag01 }]
      : []),
    { id: "file", label: "Attach a file", icon: UploadCloud02 },
    { id: "link", label: "Add a link", icon: Link01 },
  ];
  return (
    <>
      <Dropdown.Root>
        <Button
          color="tertiary"
          size="sm"
          iconLeading={DotsVertical}
          aria-label={`${label} options`}
          className={cx("size-7 p-0", className)}
        />
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label={`${label} actions`}
            onAction={(k) => {
              const lead = leading.find((l) => l.id === k);
              if (lead) return lead.onAction();
              if (k === "file") return fileInput.current?.click();
              onPick(k as NoteKind);
            }}
          >
            {leading.map((l) => (
              <Dropdown.Item
                key={l.id}
                id={l.id}
                label={l.label}
                icon={l.icon}
              />
            ))}
            {leading.length > 0 ? <Dropdown.Separator /> : null}
            {items.map((it) => (
              <Dropdown.Item
                key={it.id}
                id={it.id}
                label={it.label}
                icon={it.icon}
              />
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Attach a file to ${label}`}
        accept="image/*,.pdf,.xls,.xlsx,.csv,audio/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const kind = kindForFile(file.name);
          if (!kind) {
            toast.error("That file type isn't supported", {
              description:
                "Use an image, PDF, spreadsheet, audio or video file.",
            });
            return;
          }
          const size =
            file.size >= 1_000_000
              ? `${(file.size / 1_000_000).toFixed(1)} MB`
              : `${Math.max(1, Math.round(file.size / 1000))} KB`;
          onFile({
            id: noteId("f"),
            name: file.name,
            size,
            kind,
            addedBy: me,
            date: noteDate(),
          });
        }}
      />
    </>
  );
}

/**
 * One field, when viewing: label, value and note indicators. A field with notes is one button: click
 * it to show or hide its notes. On hover, an editor sees the edit icon and the "..." menu, so notes can
 * be added, edited, resolved or removed without editing the record (saved at once).
 */
export function FieldRow({
  recordId,
  fieldKey,
  label,
  value,
  notes,
  onEdit,
  labelWidth = "9rem",
  divider = true,
  editable = true,
}: {
  recordId: string;
  fieldKey: string;
  label: string;
  value: ReactNode;
  notes: FieldNotes | undefined;
  /** Opens this field in edit mode. Omitted for people who can't edit (and then notes are read only). */
  onEdit?: (fieldKey: string) => void;
  labelWidth?: string;
  /** The line under the row. Off when something belonging to the field follows it (the location table). */
  divider?: boolean;
  /** False for a field the system sets or works out: no edit icon (notes can still be added). */
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [composer, setComposer] = useState<NoteKind | null>(null);
  const current = notes ?? EMPTY_FIELD_NOTES;
  const empty = typeof value === "string" && EMPTY.has(value);
  const noted = hasNotes(notes);
  const annotate = !!onEdit && takesNotes(label);
  const save = (next: FieldNotes) =>
    fieldNotesActions.setFieldNotes(recordId, fieldKey, next);
  const grid = { gridTemplateColumns: `minmax(0,${labelWidth}) minmax(0,1fr)` };
  const body = (
    <>
      {/* The note markers sit with the field name, so they read as belonging to the field, not the value. */}
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="text-sm text-tertiary">{label}</span>
        {noted && (
          <span className="flex shrink-0 items-center gap-1">
            <NoteIndicators notes={current} />
            <ChevronDown
              className={cx(
                "size-3.5 text-fg-quaternary transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </span>
        )}
      </span>
      <span
        className={cx(
          "min-w-0 text-sm text-balance",
          empty ? "text-quaternary" : "text-primary",
        )}
      >
        {empty ? "Not provided" : value}
      </span>
    </>
  );
  const reveal =
    "opacity-0 transition-opacity group-hover/field:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100";

  return (
    <div
      id={`field-${recordId}-${fieldKey}`}
      className={cx(
        "relative scroll-mt-20 transition-colors",
        divider && "border-b border-secondary last:border-b-0",
        // Open: one tinted band with no lines above or below it (it covers the row above's line).
        (open || composer) && "-mt-px border-transparent bg-secondary",
      )}
    >
      <div
        className={cx(
          "group/field flex items-start gap-1 rounded-md transition-colors",
          (noted || onEdit) && !(open || composer) && "hover:bg-primary_hover",
        )}
      >
        {noted ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${label}: ${open ? "hide" : "show"} notes`}
            onClick={() => setOpen((o) => !o)}
            style={grid}
            className="grid min-w-0 flex-1 cursor-pointer gap-x-4 rounded-md py-2.5 pl-3 text-left outline-focus-ring focus-visible:outline-2"
          >
            {body}
          </button>
        ) : (
          <div style={grid} className="grid min-w-0 flex-1 gap-x-4 py-2.5 pl-3">
            {body}
          </div>
        )}
        <span
          className={cx(
            "flex shrink-0 items-center gap-0.5 py-1.5 pr-2",
            !onEdit && "w-1",
          )}
        >
          {onEdit && editable && (
            <Tooltip title={`Edit ${label.toLowerCase()}`}>
              <TooltipTrigger
                aria-label={`Edit ${label}`}
                onPress={() => onEdit(fieldKey)}
                className={cx(
                  "flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-secondary hover:text-fg-quaternary_hover focus-visible:outline-2",
                  reveal,
                )}
              >
                <Edit02 className="size-3.5" />
              </TooltipTrigger>
            </Tooltip>
          )}
          {annotate && (
            <FieldNoteMenu
              label={label}
              notes={current}
              className={reveal}
              onPick={(kind) => {
                setComposer(kind);
                setOpen(true);
              }}
              onFile={(file) => {
                save({ ...current, files: [...current.files, file] });
                setOpen(true);
                toast.success("File attached", {
                  description: `${file.name} is attached to ${label.toLowerCase()}.`,
                });
              }}
            />
          )}
        </span>
      </div>
      {(open || composer) && (
        <FieldNotesArea
          className="mx-3 mt-1 mb-3"
          label={label}
          notes={current}
          onChange={annotate ? save : undefined}
          composer={composer}
          onComposerDone={() => setComposer(null)}
          onResolved={() =>
            toast.success(`${label} resolved`, {
              description:
                "It is no longer marked questionable. The reason is kept with the field.",
            })
          }
        />
      )}
    </div>
  );
}
