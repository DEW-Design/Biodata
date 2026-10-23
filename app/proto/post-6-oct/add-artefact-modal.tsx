"use client";

// Add an attachment (the menu and this form say "attachment" alone, the designer, 19 Oct 2026; the tab it lands in is still "Artefacts and attachments"), from the project bar's "+" menu
// (the designer, 19 Oct 2026: "one more option to add an artefact and attachment ... a way to assign it back to an event, occurrence or observation"). An artefact or attachment belongs
// to one field of one record, never to the project as a whole (field-notes-store.ts), and the product adds one from that field's own menu ("Attach a file", "Add a link"). From the bar
// there is no field to start from, so this asks for it: the event, occurrence or observation, then the field of it that the attachments document, then the attachments.
// The attachments are a list, built up before anything is saved (the designer, 19 Oct 2026, on the first version, which held one file and named it beside a "Choose another file" button:
// "needs to have an attachment subgrid with the ability to remove attachments. This looks like an anti-pattern"). "Add files" takes any number at once and "Add a link" opens a small
// address-and-title form; each lands as a row of a table (its icon and name, its type, its size, and a button that removes it), the same columns the Artefacts and attachments tab
// shows for what is saved, and nothing is saved until Add. It then saves as the field menu does (`fieldNotesActions`: the same file kinds, the same link check), so every row is on that
// record's field and in the tab at once; the tab is then opened. Built from parts (`FormModal`, `Select.ComboBox`, `TableCard` and `Table`, `ButtonUtility`, `Input`), no new component.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, useRef, useState } from "react";
import { Link01, Paperclip, Plus, Trash01, UploadCloud02, XClose } from "@untitledui/icons";
import { FormModal } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { artefactTypeMeta } from "@/app/pages/_shared/artefact-lightbox";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { takesNotes, useCurrentUserName } from "@/app/pages/project-detail/field-notes";
import { useUserRole } from "@/lib/use-user-role";
import { EMPTY_NOTES_VALUE, fieldNotesActions, kindForFile, noteDate, noteId, recordFieldKeys, reviewForNewFile, useFieldNotes, type FieldFileKind } from "@/app/pages/project-detail/field-notes-store";
import type { SurveyRecord } from "@/app/pages/project-detail/survey-data";

const ACCEPT = "image/*,.pdf,.xls,.xlsx,.csv,audio/*,video/*";

/** What a record is called, as the Add menu names its types: "Transect", "Individual occurrence". */
const recordLabel = (r: SurveyRecord) => (r.kind === "event" ? r.type : `${r.type} ${r.kind}`);

/** The Artefacts and attachments tab's wording for a type. */
const typeLabel = (t: string) => (t === "pdf" ? "PDF" : t.charAt(0).toUpperCase() + t.slice(1));

/** The size the tab shows: kilobytes, or megabytes from a million bytes (as `fieldNotesActions.attach` writes it). */
const sizeLabel = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

/** One attachment waiting to be added: a file chosen, or a link written. */
interface Pending {
  id: string;
  kind: FieldFileKind;
  name: string;
  size: string;
  file?: File;
  url?: string;
}

/** The fields of a record that take notes, in the order the record shows them, each with the section it is in. */
function fieldItems(record: SurveyRecord) {
  const titleOf = new Map(record.sections.map((s) => [s.id, s.title]));
  return [...recordFieldKeys(record)]
    .map((key) => ({ key, section: key.slice(0, key.indexOf(":")), label: key.slice(key.indexOf(":") + 1) }))
    .filter((f) => takesNotes(f.label))
    .map((f) => ({ id: f.key, label: f.label, supportingText: titleOf.get(f.section) }));
}

export function AddArtefactModal({ isOpen, onOpenChange, onAdded }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onAdded: () => void }) {
  const { records } = useEditStore();
  const notes = useFieldNotes();
  const me = useCurrentUserName();
  const role = useUserRole();
  const fileInput = useRef<HTMLInputElement>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [fieldKey, setFieldKey] = useState<string | null>(null);
  const [items, setItems] = useState<Pending[]>([]);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkTried, setLinkTried] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const recordItems = useMemo(() => records.map((r) => ({ id: r.id, label: r.name, supportingText: `${recordLabel(r)} · ${r.code}` })), [records]);
  const record = records.find((r) => r.id === recordId);
  const fields = useMemo(() => (record ? fieldItems(record) : []), [record]);

  // Audio and video from anyone but a BioData Admin or Super Admin wait for review (the designer, 20 Oct 2026).
  const reviewCount = items.filter((i) => i.file && reviewForNewFile(i.kind, role)).length;
  const linkOk = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const problem = {
    record: !recordId ? "Choose an event, occurrence or observation" : undefined,
    field: recordId && !fieldKey ? "Choose the concept this documents" : undefined,
    items: items.length === 0 ? "Add at least one file or link" : undefined,
  };

  const reset = () => {
    setRecordId(null);
    setFieldKey(null);
    setItems([]);
    setLinking(false);
    setUrl("");
    setTitle("");
    setLinkTried(false);
    setAttempted(false);
  };

  const addFiles = (list: FileList | null) => {
    const chosen = [...(list ?? [])];
    const taken = chosen.flatMap((file): Pending[] => {
      const kind = kindForFile(file.name);
      return kind ? [{ id: noteId("p"), kind, name: file.name, size: sizeLabel(file.size), file }] : [];
    });
    if (taken.length < chosen.length) {
      toast.error("That file type isn't supported", { description: "Use an image, PDF, spreadsheet, audio or video file." });
    }
    if (taken.length > 0) setItems((current) => [...current, ...taken]);
  };

  const addLink = () => {
    if (!linkOk) {
      setLinkTried(true);
      return;
    }
    const address = url.trim();
    setItems((current) => [...current, { id: noteId("p"), kind: "link", name: title.trim() || address.replace(/^https?:\/\//, ""), size: "", url: address }]);
    setLinking(false);
    setUrl("");
    setTitle("");
    setLinkTried(false);
  };

  const submit = () => {
    if (problem.record || problem.field || problem.items || !recordId || !fieldKey) {
      setAttempted(true);
      return;
    }
    // Links are written first, on the field's notes as they are now; the files are then attached through the store, which reads what is there, so neither drops the other.
    const links = items.filter((i) => i.kind === "link");
    if (links.length > 0) {
      const current = notes[recordId]?.[fieldKey] ?? EMPTY_NOTES_VALUE;
      fieldNotesActions.setFieldNotes(recordId, fieldKey, {
        ...current,
        files: [...current.files, ...links.map((l) => ({ id: noteId("l"), name: l.name, size: "", kind: "link" as const, url: l.url, addedBy: me, date: noteDate() }))],
      });
    }
    for (const i of items) {
      if (i.file) fieldNotesActions.attach(recordId, fieldKey, { name: i.file.name, sizeBytes: i.file.size, kind: i.kind }, me, reviewForNewFile(i.kind, role));
    }
    const count = items.length;
    toast.success(count === 1 ? "Attachment added" : `${count} attachments added`, {
      description: `${count === 1 ? "It is" : "They are"} attached to ${fields.find((f) => f.id === fieldKey)?.label} on ${record?.name}.${reviewCount > 0 ? ` ${reviewCount === 1 ? "The audio or video file shows" : `${reviewCount} audio or video files show`} as pending review until a BioData Admin approves.` : ""}`,
    });
    onOpenChange(false);
    reset();
    onAdded();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) reset();
      }}
      icon={Paperclip}
      title="Add an attachment"
      description="An attachment belongs to one concept of an event, occurrence or observation."
      submitLabel={items.length > 1 ? `Add ${items.length} attachments` : "Add"}
      submitIcon={Plus}
      onSubmit={submit}
    >
      <Select.ComboBox
        label="Attach to"
        isRequired
        validationBehavior="aria"
        placeholder="Search events, occurrences and observations"
        items={recordItems}
        selectedKey={recordId}
        onSelectionChange={(key) => {
          setRecordId(key as string | null);
          setFieldKey(null);
        }}
        isInvalid={attempted && !!problem.record}
        hint={attempted ? problem.record : undefined}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select.ComboBox>
      <Select.ComboBox
        label="Concept"
        isRequired
        validationBehavior="aria"
        placeholder={record ? "Search concepts" : "Choose what to attach to first"}
        isDisabled={!record}
        items={fields}
        selectedKey={fieldKey}
        onSelectionChange={(key) => setFieldKey(key as string | null)}
        isInvalid={attempted && !!problem.field}
        hint={attempted ? problem.field : undefined}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select.ComboBox>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-sm font-medium text-secondary">
            Attachments
            {items.length > 0 && <span className="font-normal text-tertiary tabular-nums"> ({items.length})</span>}
          </p>
          <div className="flex items-center gap-2">
            <Button color="secondary" size="sm" iconLeading={UploadCloud02} onPress={() => fileInput.current?.click()}>
              Add files
            </Button>
            <Button color="secondary" size="sm" iconLeading={Link01} onPress={() => setLinking(true)} isDisabled={linking}>
              Add a link
            </Button>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose files to attach"
          accept={ACCEPT}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {linking && (
          <div className="flex flex-col gap-3 rounded-lg border border-secondary p-3">
            <Input
              label="Link address"
              isRequired
              validationBehavior="aria"
              placeholder="https://"
              value={url}
              onChange={setUrl}
              autoFocus
              isInvalid={linkTried && !linkOk}
              hint={linkTried && !linkOk ? "Enter an address that starts with https://" : undefined}
            />
            <Input label="Title" placeholder="Optional" value={title} onChange={setTitle} />
            <div className="flex justify-end gap-2">
              <Button
                color="tertiary"
                size="sm"
                iconLeading={XClose}
                onPress={() => {
                  setLinking(false);
                  setUrl("");
                  setTitle("");
                  setLinkTried(false);
                }}
              >
                Cancel
              </Button>
              <Button color="secondary" size="sm" iconLeading={Link01} onPress={addLink}>
                Add link
              </Button>
            </div>
          </div>
        )}

        {items.length > 0 ? (
          <TableCard.Root size="xs" className="max-h-56 overflow-y-auto">
            <Table size="xs" layout="fixed" aria-label="Attachments to add">
              <Table.Header>
                <Table.Head id="name" label="File" isRowHeader className="w-[52%]" />
                <Table.Head id="type" label="Type" className="w-[22%]" />
                <Table.Head id="size" label="Size" className="w-[16%]" />
                <Table.Head id="remove" label="" className="w-[10%]" />
              </Table.Header>
              <Table.Body items={items}>
                {(a) => {
                  const meta = artefactTypeMeta[a.kind];
                  const Icon = meta.icon;
                  return (
                    <Table.Row id={a.id} textValue={a.name}>
                      <Table.Cell>
                        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
                          <Icon className="size-4 shrink-0 text-fg-quaternary" />
                          <span className="truncate" title={a.name}>
                            {a.name}
                          </span>
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge size="sm" color={meta.badgeColor}>
                          {typeLabel(a.kind)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{a.size || "Not provided"}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <ButtonUtility size="xs" color="tertiary" icon={Trash01} tooltip="Remove" aria-label={`Remove ${a.name}`} onPress={() => setItems((current) => current.filter((x) => x.id !== a.id))} />
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              </Table.Body>
            </Table>
          </TableCard.Root>
        ) : (
          <p className="m-0 rounded-lg border border-dashed border-secondary px-4 py-6 text-center text-sm text-balance text-tertiary">Files and links you add are listed here, and can be removed before you add them.</p>
        )}
        {reviewCount > 0 && (
          <p className="m-0 text-sm text-balance text-tertiary">
            {reviewCount === 1 ? "Audio and video files are" : `${reviewCount} of these are audio or video, which are`} reviewed by a BioData Admin before they are approved. {reviewCount === 1 ? "It shows" : "They show"} on the record as pending review until then.
          </p>
        )}
        {attempted && problem.items && <p className="m-0 text-sm text-error-primary">{problem.items}</p>}
      </div>
    </FormModal>
  );
}
