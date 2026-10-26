"use client";

// A record's quick actions, a row of small square buttons under its title (designer, 23 Oct 2026, from Jira's issue
// view: "+" with a searchable menu, then the other actions as icons). Its menu discloses progressively, like the "..."
// menu: Events, Occurrences and Observations each open their types; typing in its search lists every match at once.
// "+" adds inside the record: an event,
// occurrence or observation of the types allowed there (record-rules.ts), an attachment or a web link. A file or
// link belongs to one of the record's fields (field-notes-store.ts), so adding one asks which field it documents.
// Edit edits the record. The "..." holds Delete alone, kept out of reach of a stray click. Each action is here once:
// the header above keeps only the path and full screen (designer, 25 Oct 2026: no two controls for one action, and
// icon-only "+" and pencil were not clear, so both are labelled).

import { useMemo, useRef, useState } from "react";
import { Autocomplete, Input as AriaInput, SearchField, SubmenuTrigger } from "react-aria-components";
import { ChevronDown, DotsVertical, Edit05, LayoutAlt04, Link01, Paperclip, Plus, SearchLg, Trash01, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { FormModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { kindShape } from "@/app/pages/_shared/record-shapes";
import { useUserRole } from "@/lib/use-user-role";
import { useEditStore } from "./edit-store";
import { childOptions, type ChildOption } from "./record-rules";
import { KIND_PLURAL } from "./record-inspector";
import { takesNotes, useCurrentUserName } from "./field-notes";
import { fieldNotesActions, kindForFile, reviewForNewFile } from "./field-notes-store";
import { sectionFieldEntries } from "./field-visibility-store";
import type { MetaSection, RecordKind, SurveyRecord } from "./survey-data";

const KIND_ORDER: RecordKind[] = ["event", "occurrence", "observation"];

const squareButton =
  // The secondary button's own surface (button.tsx), as a square icon button.
  "flex size-9 cursor-pointer items-center justify-center rounded-lg bg-primary text-fg-quaternary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 aria-expanded:bg-primary_hover";

/** The record's actions, under its title: Add (inside, attach, link, section), Edit, and "..." for Delete. Editors only. */
export function RecordQuickActions({
  record,
  onAdd,
  onEdit,
  onDelete,
  sections = [],
  onAddSection,
}: {
  record: SurveyRecord | null;
  onAdd: (option: ChildOption) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** The record's sections that are not on it now (removed, hidden or empty), offered as Add section. */
  sections?: MetaSection[];
  /** Adds a section: the edit opens with it on the record, ready to fill in. */
  onAddSection?: (sectionId: string) => void;
}) {
  const store = useEditStore();
  const [attach, setAttach] = useState<null | "file" | "link">(null);
  if (!store.canEdit) return null;
  const options = childOptions(record, store.childrenOf(record?.id ?? null));
  return (
    <div className="flex items-center gap-2">
      <AddMenu
        options={options}
        canAttach={!!record}
        onAdd={onAdd}
        onAttach={setAttach}
        sections={onAddSection ? sections : []}
        onAddSection={onAddSection}
      />
      {onEdit && (
        <Button color="secondary" size="sm" iconLeading={Edit05} onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Dropdown.Root>
          <Tooltip title="More actions">
            <TooltipTrigger aria-label="More actions" className={squareButton}>
              <DotsVertical className="size-4" />
            </TooltipTrigger>
          </Tooltip>
          <Dropdown.Popover placement="bottom start" className="w-48">
            <Dropdown.Menu aria-label="More actions" onAction={(key) => key === "delete" && onDelete()}>
              <Dropdown.Item id="delete" label="Delete record" icon={Trash01} destructive />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      )}
      {record && attach && (
        <AttachModal record={record} mode={attach} onClose={() => setAttach(null)} />
      )}
    </div>
  );
}

type Entry = { id: string; label: string; group: string };

function AddMenu({
  options,
  canAttach,
  onAdd,
  onAttach,
  sections,
  onAddSection,
}: {
  options: ChildOption[];
  canAttach: boolean;
  onAdd: (option: ChildOption) => void;
  onAttach: (mode: "file" | "link") => void;
  sections: MetaSection[];
  onAddSection?: (sectionId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const kinds = KIND_ORDER.filter((k) => options.some((o) => o.kind === k));
  // The menu is filtered here; the autocomplete only carries the keyboard between the box and the menu.
  const groups = [
    ...KIND_ORDER.map((kind) => ({
      id: kind,
      label: KIND_PLURAL[kind],
      kind,
      entries: options
        .filter((o) => o.kind === kind)
        .map((o): Entry => ({ id: `${o.kind}:${o.type}`, label: o.type, group: KIND_PLURAL[kind] })),
    })),
    ...(canAttach
      ? [
          {
            id: "files",
            label: "Artefacts and attachments",
            kind: null,
            entries: [
              { id: "file", label: "Add attachment", group: "Artefacts and attachments" },
              { id: "link", label: "Add web link", group: "Artefacts and attachments" },
            ] as Entry[],
          },
        ]
      : []),
    {
      id: "sections",
      label: "Sections",
      kind: null,
      entries: sections.map((x): Entry => ({ id: `section:${x.id}`, label: x.title, group: "Sections" })),
    },
  ]
    .map((g) => ({ ...g, entries: g.entries.filter((e) => !q || `${e.label} ${e.group}`.toLowerCase().includes(q)) }))
    .filter((g) => g.entries.length > 0);
  return (
    <Dropdown.Root onOpenChange={(open) => !open && setQuery("")}>
      <Button color="secondary" size="sm" iconLeading={Plus} iconTrailing={ChevronDown}>
        Add
      </Button>
      <Dropdown.Popover placement="bottom start" className="w-64">
        {/* Letters stay in the search box: the menu's type-to-select would otherwise take the first one (as in FilterMenu). */}
        <div onKeyDown={(e) => e.key.length === 1 && e.stopPropagation()} className="flex flex-col">
        <Autocomplete inputValue={query} onInputChange={setQuery} filter={() => true}>
          <SearchField aria-label="Find what to add" autoFocus className="border-b border-secondary">
            <div className="flex items-center gap-2 px-3 py-2">
              <SearchLg aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
              <AriaInput
                placeholder="Find what to add"
                className="w-full appearance-none bg-transparent text-sm text-primary outline-hidden placeholder:text-placeholder"
              />
            </div>
          </SearchField>
          <Dropdown.Menu
            aria-label="Add"
            className="max-h-80"
            onAction={(key) => {
              if (key === "file" || key === "link") return onAttach(key);
              if (String(key).startsWith("section:")) return onAddSection?.(String(key).slice(8));
              const o = options.find((x) => `${x.kind}:${x.type}` === key);
              if (o) onAdd(o);
            }}
            renderEmptyState={() => <p className="m-0 px-3 py-2 text-sm text-tertiary">No matches</p>}
          >
            {q ? (
              // Searching: every match at once, under its group, so a typed name is one step away.
              groups.map((g, i) => {
                const Shape = g.kind ? kindShape(g.kind) : null;
                return (
                  <Dropdown.Section key={g.id}>
                    <Dropdown.SectionHeader
                      className={
                        i > 0
                          ? "mt-1 flex items-center gap-1.5 border-t border-secondary px-2.5 pt-2 pb-1 text-xs font-semibold text-quaternary"
                          : "flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 text-xs font-semibold text-quaternary"
                      }
                    >
                      {Shape && <Shape className="size-4" />}
                      {g.label}
                    </Dropdown.SectionHeader>
                    {g.entries.map((e) => (
                      <Dropdown.Item
                        key={e.id}
                        id={e.id}
                        label={e.label}
                        icon={e.id === "file" ? Paperclip : e.id === "link" ? Link01 : undefined}
                      />
                    ))}
                  </Dropdown.Section>
                );
              })
            ) : (
              // Not searching: progressive disclosure, as the "..." menu (designer, 23 Oct 2026): the three kinds, each
              // opening its types, then the files.
              <>
                {kinds.length > 0 ? (
                  <Dropdown.Section>
                    <Dropdown.SectionHeader className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-quaternary">
                      Add inside
                    </Dropdown.SectionHeader>
                    {kinds.map((kind) => (
                      <SubmenuTrigger key={kind}>
                        <Dropdown.Item id={`kind:${kind}`} label={KIND_PLURAL[kind]} icon={kindShape(kind)} />
                        <Dropdown.Popover placement="end top" className="w-52">
                          <Dropdown.Menu
                            aria-label={`Add ${KIND_PLURAL[kind].toLowerCase()}`}
                            onAction={(key) => {
                              const o = options.find((x) => `${x.kind}:${x.type}` === key);
                              if (o) onAdd(o);
                            }}
                          >
                            {options
                              .filter((o) => o.kind === kind)
                              .map((o) => (
                                <Dropdown.Item key={`${o.kind}:${o.type}`} id={`${o.kind}:${o.type}`} label={o.type} />
                              ))}
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </SubmenuTrigger>
                    ))}
                  </Dropdown.Section>
                ) : null}
                {kinds.length > 0 && canAttach ? <Dropdown.Separator /> : null}
                {canAttach ? (
                  <Dropdown.Section>
                    <Dropdown.Item id="file" label="Add attachment" icon={Paperclip} />
                    <Dropdown.Item id="link" label="Add web link" icon={Link01} />
                  </Dropdown.Section>
                ) : null}
                {sections.length > 0 ? <Dropdown.Separator /> : null}
                {sections.length > 0 ? (
                  <Dropdown.Section>
                    <SubmenuTrigger>
                      <Dropdown.Item id="sections" label="Add section" icon={LayoutAlt04} />
                      <Dropdown.Popover placement="end top" className="w-56">
                        <Dropdown.Menu aria-label="Add a section" onAction={(key) => onAddSection?.(String(key))}>
                          {sections.map((x) => (
                            <Dropdown.Item key={x.id} id={x.id} label={x.title} />
                          ))}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </SubmenuTrigger>
                  </Dropdown.Section>
                ) : null}
              </>
            )}
          </Dropdown.Menu>
        </Autocomplete>
        </div>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

/** Add an attachment or a web link to one of the record's fields: which field it documents, then the file or link. */
function AttachModal({ record, mode, onClose }: { record: SurveyRecord; mode: "file" | "link"; onClose: () => void }) {
  const me = useCurrentUserName();
  const role = useUserRole();
  const fields = useMemo(
    () =>
      record.sections.flatMap((s) =>
        sectionFieldEntries(s)
          .filter((f) => takesNotes(f.label))
          .map((f) => ({ id: f.key, label: f.label, supportingText: s.title })),
      ),
    [record],
  );
  // No field chosen to start: which one a file documents is the person's call, not the first in the list.
  const [fieldKey, setFieldKey] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tried, setTried] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const urlOk = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const fieldLabel = fields.find((f) => f.id === fieldKey)?.label ?? "the concept";

  const submit = () => {
    setTried(true);
    if (!fieldKey) return;
    if (mode === "file") {
      if (!file) return;
      const kind = kindForFile(file.name);
      if (!kind) {
        toast.error("That file type isn't supported", { description: "Use an image, PDF, spreadsheet, audio or video file." });
        return;
      }
      fieldNotesActions.attach(record.id, fieldKey, { name: file.name, sizeBytes: file.size, kind }, me, reviewForNewFile(kind, role));
      toast.success(`${file.name} attached to ${fieldLabel}`, { description: "Changes are kept in this browser. This preview has no backend." });
    } else {
      if (!urlOk) return;
      fieldNotesActions.addLink(record.id, fieldKey, { url: url.trim(), name: title.trim() || url.trim().replace(/^https?:\/\//, "") }, me);
      toast.success(`Link added to ${fieldLabel}`, { description: "Changes are kept in this browser. This preview has no backend." });
    }
    onClose();
  };

  return (
    <FormModal
      isOpen
      onOpenChange={(open) => !open && onClose()}
      title={mode === "file" ? "Add attachment" : "Add web link"}
      description={`Files and links belong to a concept of ${record.name}. Choose the one it documents.`}
      submitLabel={mode === "file" ? "Add attachment" : "Add link"}
      submitIcon={mode === "file" ? Upload01 : Link01}
      onSubmit={submit}
    >
      <MultiSelect
        label="Attach to"
        isRequired
        selectionMode="single"
        placeholder="Choose a concept"
        isInvalid={tried && !fieldKey}
        hint={tried && !fieldKey ? "Choose the concept this documents." : undefined}
        items={fields}
        selectedKeys={new Set(fieldKey ? [fieldKey] : [])}
        onSelectionChange={(keys) => {
          const next = keys === "all" ? undefined : Array.from(keys)[0];
          if (next) setFieldKey(String(next));
        }}
      >
        {(item) => <MultiSelect.Item {...item} />}
      </MultiSelect>
      {mode === "file" ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-secondary">
            File <span className="text-brand-tertiary">*</span>
          </p>
          <div className="flex items-center gap-3">
            <Button color="secondary" size="sm" iconLeading={Upload01} onClick={() => fileInput.current?.click()}>
              {file ? "Choose another file" : "Choose file"}
            </Button>
            <span className="min-w-0 truncate text-sm text-tertiary">{file ? file.name : "No file chosen"}</span>
          </div>
          {tried && !file && <p className="text-sm text-error-primary">Choose a file to attach.</p>}
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a file to attach"
            accept="image/*,.pdf,.xls,.xlsx,.csv,audio/*,video/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <>
          <Input
            label="Link address"
            isRequired
            placeholder="https://"
            value={url}
            onChange={setUrl}
            isInvalid={tried && !urlOk}
            hint={tried && !urlOk ? "Enter a full address, starting with https://" : undefined}
          />
          <Input label="Title" placeholder="Optional" value={title} onChange={setTitle} />
        </>
      )}
    </FormModal>
  );
}
