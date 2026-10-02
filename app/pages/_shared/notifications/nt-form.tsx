"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Key, Selection } from "react-aria-components";
import type { Editor } from "@tiptap/react";
import { parseDate } from "@internationalized/date";
import { Attachment01, Clock, Plus, Send01, Trash01, Zap, ArrowLeft } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Accordion } from "@/components/base/accordion/accordion";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { RadioGroupIconCard } from "@/components/base/radio-groups/radio-group-icon-card";
import { ComboBox } from "@/components/base/select/combobox";
import { MultiSelect } from "@/components/base/select/multi-select";
import { SelectItem } from "@/components/base/select/select-item";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { TextEditor, useEditorContext } from "@/components/base/text-editor/text-editor";
import { Toggle } from "@/components/base/toggle/toggle";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { cx } from "@/utils/cx";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import {
  DELAYS,
  FREQUENCIES,
  bodyHtml,
  MONTH_DAYS,
  NT_EVENTS,
  NT_TEMPLATES,
  RETENTIONS,
  SENSITIVITY,
  TIMES,
  TIME_ZONES,
  WEEKDAYS,
  draftOf,
  effectiveTo,
  emptyNtDraft,
  formatBytes,
  logSummary,
  newAttachmentId,
  todayIso,
  errorSection,
  eventTrigger,
  ntEvent,
  ntStateMeta,
  overlapping,
  scheduleTrigger,
  triggerSummary,
  validateNt,
  variablesFor,
  type Delay,
  type Frequency,
  type Notification,
  type NtDraft,
  type RecipientLabel,
  type NtErrors,
  type NtSection,
  type NtTrigger,
} from "@/app/pages/_shared/notifications/nt-data";
import { EmailPreview } from "@/app/pages/_shared/notifications/nt-email";
import { useRecipientDirectory } from "@/app/pages/_shared/notifications/nt-directory";
import { RecipientField } from "@/app/pages/_shared/notifications/nt-recipients";
import { useCategories, useNotifications } from "@/app/pages/_shared/notifications/nt-store";

// Add or edit a notification (Figma "Add Notification - Message / Templates / Settings / Sender and
// Recipients", nodes 1584:22842, 1584:23207, 1584:23376, 1584:23575), re-fitted to the form pattern
// (CONTRACTS 4.1): the Figma's four tabs become three sections in column 2, label-left rows, every
// action in the footer, "Details missing" when something mandatory is left out.
//
// Ordered for speed and accuracy, the way Controlled Vocabulary's three steps are:
//   Trigger     when it is sent, first, because everything after depends on it: picking the event
//               fills in the name and category (until the admin types their own), decides who "the
//               person it's about" is, and decides which variables the message can use. A second
//               live notification on the same event to the same person is flagged as it is picked.
//   Recipients  who receives it (that person, roles, people), CC and BCC, the sender's name and
//               reply-to, and whether sent emails are logged.
//   Message     template, classification, subject, heading, message and sign-off, with the email
//               previewed beside them as it is typed. Each of the four text fields has its own
//               "Insert variable" at the right of its label, which writes into that field at the
//               cursor, so it is in reach wherever the admin is writing. One the trigger doesn't provide is marked in the preview straight away
//               and refused on Add.
//
// The message is written in the design system's rich text editor (advanced toolbar) and kept as HTML;
// the preview draws the same formatting.
//
// The Message section is a working surface, like Controlled Vocabulary's Entries grid: its fields
// stack beside the live preview instead of sitting in label-left FormRows, which would leave the
// preview no room.
//
// Editing an active or disabled notification: no Save draft (4.1.5), and Save changes stays disabled
// until something changes. A draft, or a new notification, can be saved with only a name.

type Attempt = null | "draft" | "publish";
type TextField = "subject" | "heading" | "body" | "signOff";

const SECTIONS: NtSection[] = ["trigger", "recipients", "message"];
const sectionMeta: Record<NtSection, { title: string; description: string }> = {
  trigger: { title: "Trigger", description: "When it is sent, and what it is called." },
  recipients: { title: "Recipients", description: "Who receives it, and how it is sent." },
  message: { title: "Message", description: "What it says. The template sets the look, and the preview shows the email as it lands." },
};
const fieldLabel: Record<TextField, string> = { subject: "Subject", heading: "Heading", body: "Message", signOff: "Sign-off" };

/** The event's label as a name, numbered when another notification already has it: a name filled in for the admin is never invalid. */
function freeName(label: string, all: Notification[], selfId?: string): string {
  const taken = new Set(all.filter((n) => n.id !== selfId).map((n) => n.name.trim().toLowerCase()));
  let name = label;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${label} ${i}`;
  return name;
}

/** Hands the message editor to the form, so Insert variable can write into it at the cursor. */
function EditorHandle({ editorRef }: { editorRef: { current: Editor | null } }) {
  const { editor } = useEditorContext();
  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);
  return null;
}

/** One field's Insert variable: the variables the trigger provides, at the right of that field's label. */
function VariableMenu({ field, groups, onInsert, className }: { field: string; groups: ReturnType<typeof variablesFor>; onInsert: (key: string) => void; className?: string }) {
  return (
    <div className={cx("z-10 shrink-0", className)}>
      <Dropdown.Root>
        <Button iconLeading={Plus} color="link-color" size="sm" aria-label={`Insert variable into ${field}`}>
          Insert variable
        </Button>
        <Dropdown.Popover placement="bottom right" className="w-80">
          <Dropdown.Menu aria-label={`Variables for ${field}`} onAction={(key) => onInsert(String(key))}>
            {groups.map((group) => (
              <Dropdown.Section key={group.group} id={group.group}>
                <Dropdown.SectionHeader className="px-4 pt-2.5 pb-1 text-xs font-semibold text-quaternary">{group.group}</Dropdown.SectionHeader>
                {group.items.map((item) => (
                  <Dropdown.Item key={item.key} id={item.key} label={item.label} addon={`{{${item.key}}}`} />
                ))}
              </Dropdown.Section>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </div>
  );
}

const keysOf = (keys: Selection, all: { id: string }[]) => (keys === "all" ? all.map((o) => o.id) : ([...keys] as string[]));
const firstKey = (keys: Selection) => (keys === "all" ? undefined : ([...keys][0] as string | undefined));

export function NtForm({
  initial,
  start,
  flow = "sections",
  duplicatedFrom,
  onClose,
  onSaveDraft,
  onPublish,
}: {
  /** The notification being edited; omit for a new one. */
  initial?: Notification;
  /** A new notification's starting values: a duplicate, or a category picked in column 2. */
  start?: NtDraft;
  /** The ID a new notification was duplicated from, for its history. */
  duplicatedFrom?: string;
  /** "guided" (Option 2): the email is previewed beside every section, not only Message, and the trigger is picked from two cards. */
  flow?: "sections" | "guided";
  onClose: () => void;
  /** `label` names recipients in the history the save writes. */
  onSaveDraft: (draft: NtDraft, label: RecipientLabel) => void;
  onPublish: (draft: NtDraft, label: RecipientLabel) => void;
}) {
  const live = useNotifications();
  // Once saved, the store already holds this notification, so checking again would find its own name
  // "already used" and flash an error before the page moves on. Validation keeps the list as it was.
  const [savedPool, setSavedPool] = useState<Notification[] | null>(null);
  const all = savedPool ?? live;

  const [draft, setDraft] = useState<NtDraft>(() => (initial ? draftOf(initial) : (start ?? emptyNtDraft())));
  // A new notification's name and category follow the event until the admin sets their own.
  const [autoName, setAutoName] = useState(!initial && !start?.name);
  const [autoCategory, setAutoCategory] = useState(!initial && !start?.category);
  const [section, setSection] = useState<NtSection>("trigger");
  const [visited, setVisited] = useState<Set<NtSection>>(new Set());
  const [blocked, setBlocked] = useState<Set<NtSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [dirty, setDirty] = useState(!!start && !initial);
  const [confirmClose, setConfirmClose] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const categories = useCategories();
  const directory = useRecipientDirectory(draft.trigger);
  // CC and BCC are offered on request, as an email client does; one already in use shows.
  const [showCc, setShowCc] = useState(draft.cc.length > 0);
  const [showBcc, setShowBcc] = useState(draft.bcc.length > 0);
  const fileInput = useRef<HTMLInputElement>(null);

  // Each field's Insert variable writes into that field, at the cursor.
  const subjectRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);
  const bodyEditor = useRef<Editor | null>(null);
  const signOffRef = useRef<HTMLTextAreaElement>(null);

  const isLive = !!initial && initial.state !== "draft";
  const index = SECTIONS.indexOf(section);
  const isLast = index === SECTIONS.length - 1;
  const event = draft.trigger.kind === "event" ? ntEvent(draft.trigger.event) : undefined;
  const clash = overlapping(draft, all, initial?.id);

  const rawErrors: NtErrors = attempt ? validateNt(draft, attempt, all, initial?.id) : {};
  const errors: NtErrors = attempt === "draft" || submitPressed ? rawErrors : Object.fromEntries(Object.entries(rawErrors).filter(([path]) => blocked.has(errorSection(path))));
  // An error's hint, unless it only repeats the field's own name.
  const hintFor = (path: string, label: string) => (errors[path] && errors[path] !== label ? errors[path] : undefined);

  const update = (patch: Partial<NtDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const updateTrigger = (patch: Partial<NtTrigger>) => update({ trigger: { ...draft.trigger, ...patch } as NtTrigger });

  const pickEvent = (id: string) => {
    const next = ntEvent(id);
    if (!next) return;
    update({
      trigger: { kind: "event", event: id, statuses: [], delay: draft.trigger.kind === "event" ? draft.trigger.delay : "none" },
      ...(autoName ? { name: freeName(next.label, all, initial?.id) } : {}),
      ...(autoCategory ? { category: next.category } : {}),
      ...(!draft.subject.trim() ? { subject: next.label } : {}),
    });
  };

  const insertVariable = (field: TextField, key: string) => {
    const token = `{{${key}}}`;
    if (field === "body") {
      // The editor keeps its own selection, so the variable lands where the cursor was; onUpdate saves it.
      bodyEditor.current?.chain().focus().insertContent(token).run();
      return;
    }
    const el = { subject: subjectRef, heading: headingRef, signOff: signOffRef }[field].current;
    const value = draft[field];
    const at = el?.selectionStart ?? value.length;
    const to = el?.selectionEnd ?? at;
    update({ [field]: value.slice(0, at) + token + value.slice(to) } as Partial<NtDraft>);
    // After React has written the new value: put the cursor straight after the variable.
    window.setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    }, 0);
  };

  const goTo = (next: NtSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };

  const allProblems = Object.entries(validateNt(draft, "publish", all, initial?.id));
  const currentProblems = [...new Set(allProblems.filter(([path]) => errorSection(path) === section).map(([, m]) => m!))];
  const otherProblemCount = allProblems.length - allProblems.filter(([path]) => errorSection(path) === section).length;
  const proceed = (next: NtSection) => {
    if (SECTIONS.indexOf(next) > index && currentProblems.length > 0) {
      setAttempt("publish");
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };

  const sectionProblems: Record<NtSection, number> = { trigger: 0, recipients: 0, message: 0 };
  for (const [path] of allProblems) sectionProblems[errorSection(path)] += 1;
  const sectionItems = SECTIONS.map((id) => ({
    id,
    title: sectionMeta[id].title,
    status: deriveSectionStatus({ isCurrent: id === section, isValid: sectionProblems[id] === 0, visited: visited.has(id), attempted: submitPressed || blocked.has(id) }),
    detail: (submitPressed || blocked.has(id)) && sectionProblems[id] > 0 && id !== section ? `${sectionProblems[id]} to fix` : undefined,
  }));

  const publish = () => {
    setAttempt("publish");
    setSubmitPressed(true);
    const first = Object.keys(validateNt(draft, "publish", all, initial?.id))[0];
    if (first) return setSection(errorSection(first));
    setSavedPool(all);
    onPublish(draft, directory.label);
  };
  const saveDraft = () => {
    setAttempt("draft");
    if (Object.keys(validateNt(draft, "draft", all, initial?.id)).length) return setSection("trigger");
    setSavedPool(all);
    onSaveDraft(draft, directory.label);
  };

  const variables = variablesFor(draft.trigger);
  const title = !initial ? (duplicatedFrom ? `New notification, from ${duplicatedFrom}` : "New notification") : isLive ? `Edit ${initial.name}` : `Edit draft ${initial.name || initial.id}`;
  const textField = (field: TextField) => ({
    value: draft[field],
    onChange: (value: string) => update({ [field]: value } as Partial<NtDraft>),
    isInvalid: !!errors[field],
    hint: hintFor(field, fieldLabel[field]),
  });

  const previewPanel = (
    <div className="sticky top-0 flex flex-col gap-4 rounded-xl bg-secondary p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm font-semibold text-primary">Preview</p>
        <div className="flex items-center gap-4">
          <Toggle size="sm" label="Show variables" isSelected={showVariables} onChange={setShowVariables} />
          <Button
            color="secondary"
            size="sm"
            iconLeading={Send01}
            onPress={() => toast.brand("Test emails aren't wired up yet", { description: "In the live service this sends the email, with sample values, to your own address." })}
          >
            Send me a test
          </Button>
        </div>
      </div>
      {flow === "guided" && <p className="m-0 text-sm text-balance text-tertiary">{draft.trigger.kind === "event" && !ntEvent(draft.trigger.event) ? "Sent when the event you choose happens." : `Sent ${triggerSummary(draft.trigger).charAt(0).toLowerCase()}${triggerSummary(draft.trigger).slice(1)}.`}</p>}
      <EmailPreview draft={draft} labelOf={directory.label} showVariables={showVariables} onRemoveAttachment={(id) => update({ attachments: draft.attachments.filter((x) => x.id !== id) })} />
    </div>
  );
  // Option 2: Trigger and Recipients sit beside the email they shape, so it builds as the form is filled.
  const besidePreview = (content: ReactNode) =>
    flow === "guided" ? (
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">{content}</div>
        <div className="min-w-0">{previewPanel}</div>
      </div>
    ) : (
      content
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading={initial ? initial.id : "Notification"}
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: SECTIONS.length }}
          onSelect={(id) => proceed(id as NtSection)}
        />
      </FormSidebar>

      <FormPage
        eyebrow={`${title} - Step ${index + 1} of ${SECTIONS.length}`}
        title={sectionMeta[section].title}
        badge={
          initial && (
            <Badge size="md" color={ntStateMeta[initial.state].badgeColor}>
              {ntStateMeta[initial.state].label}
            </Badge>
          )
        }
        subtitle={`${sectionMeta[section].description} Fields marked * are required; a draft only needs a name.`}
        onCancel={() => (dirty ? setConfirmClose(true) : onClose())}
        onSaveDraft={isLive ? undefined : saveDraft}
        onBack={index > 0 ? () => goTo(SECTIONS[index - 1]) : undefined}
        problems={attempt === "publish" && (submitPressed || blocked.has(section)) && currentProblems.length > 0 ? { items: currentProblems, extra: submitPressed && otherProblemCount > 0 ? `${otherProblemCount} more to fix in other sections.` : undefined } : undefined}
        primaryLabel={isLast ? (isLive ? "Save changes" : "Add notification") : "Continue"}
        primaryIsContinue={!isLast}
        primaryIsDisabled={isLast && isLive && !dirty}
        onPrimary={isLast ? publish : () => proceed(SECTIONS[index + 1])}
      >
        {section === "trigger" &&
          besidePreview(
          <>
            <FormRow title="Sent" required description="Straight after something happens in BioData SA, or on a regular schedule.">
              {flow === "guided" ? (
                <RadioGroupIconCard
                  aria-label="Sent"
                  className="grid gap-3 sm:grid-cols-2"
                  value={draft.trigger.kind}
                  onChange={(kind) => kind !== draft.trigger.kind && update({ trigger: kind === "event" ? eventTrigger() : scheduleTrigger() })}
                  items={[
                    { value: "event", title: "When something happens", description: "For example, when an observation is approved.", icon: Zap },
                    { value: "schedule", title: "On a schedule", description: "Every day, week, month or year.", icon: Clock },
                  ]}
                />
              ) : (
                <RadioGroup aria-label="Sent" value={draft.trigger.kind} onChange={(kind) => kind !== draft.trigger.kind && update({ trigger: kind === "event" ? eventTrigger() : scheduleTrigger() })}>
                  <RadioButton value="event" label="When something happens" hint="For example, when an observation is approved." />
                  <RadioButton value="schedule" label="On a schedule" hint="Every day, week, month or year." />
                </RadioGroup>
              )}
            </FormRow>

            {draft.trigger.kind === "event" && (
              <FormRow title="Trigger" required description="The event that sends it. Picking one fills in the name and category below.">
                <MultiSelect
                  label="Event"
                  isRequired
                  selectionMode="single"
                  placeholder="Search events"
                  items={NT_EVENTS.map((e) => ({ id: e.id, label: e.label, supportingText: e.group }))}
                  selectedKeys={new Set<Key>(event ? [event.id] : [])}
                  onSelectionChange={(keys) => {
                    const id = firstKey(keys);
                    if (id) pickEvent(id);
                  }}
                  isInvalid={!!errors.event}
                >
                  {(item) => <MultiSelect.Item {...item} />}
                </MultiSelect>
                {event?.statuses && (
                  <MultiSelect
                    label="Only when the status becomes"
                    placeholder="Any status"
                    items={event.statuses}
                    selectedKeys={new Set<Key>(draft.trigger.statuses)}
                    onSelectionChange={(keys) => updateTrigger({ statuses: keysOf(keys, event.statuses!) })}
                    onReset={() => updateTrigger({ statuses: [] })}
                    showSearch={false}
                    hint="Leave empty to send on every status change."
                  >
                    {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
                  </MultiSelect>
                )}
                <Select label="Send it" items={DELAYS} selectedKey={draft.trigger.delay} onSelectionChange={(k) => k && updateTrigger({ delay: String(k) as Delay })}>
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
                {clash && (
                  <AlertFullWidth
                    contained
                    wrap
                    color="warning"
                    title={`${clash.name} (${clash.id}) already emails ${event?.about ?? "this person"} when this happens`}
                    description="With both on, they get two emails. Limit one of them to different statuses, or send this one to other people."
                    confirmLabel=""
                  />
                )}
              </FormRow>
            )}

            {draft.trigger.kind === "schedule" && (
              <>
                <FormRow title="Schedule" required description={`${triggerSummary(draft.trigger)}.`}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select label="Repeats" items={FREQUENCIES} selectedKey={draft.trigger.frequency} onSelectionChange={(k) => k && updateTrigger({ frequency: String(k) as Frequency })}>
                      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                    </Select>
                    {draft.trigger.frequency === "weekly" && (
                      <Select label="On" items={WEEKDAYS} selectedKey={draft.trigger.weekday} onSelectionChange={(k) => k && updateTrigger({ weekday: String(k) })}>
                        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                      </Select>
                    )}
                    {draft.trigger.frequency === "monthly" && (
                      <MultiSelect
                        label="On the"
                        selectionMode="single"
                        placeholder="Search days"
                        items={MONTH_DAYS}
                        selectedKeys={new Set<Key>([draft.trigger.monthDay])}
                        onSelectionChange={(keys) => {
                          const id = firstKey(keys);
                          if (id) updateTrigger({ monthDay: id });
                        }}
                      >
                        {(item) => <MultiSelect.Item {...item} />}
                      </MultiSelect>
                    )}
                    <MultiSelect
                      label="At"
                      selectionMode="single"
                      placeholder="Search times"
                      items={TIMES}
                      selectedKeys={new Set<Key>([draft.trigger.time])}
                      onSelectionChange={(keys) => {
                        const id = firstKey(keys);
                        if (id) updateTrigger({ time: id });
                      }}
                    >
                      {(item) => <MultiSelect.Item {...item} />}
                    </MultiSelect>
                    <Select label="Time zone" items={TIME_ZONES} selectedKey={draft.trigger.timeZone} onSelectionChange={(k) => k && updateTrigger({ timeZone: String(k) })}>
                      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                    </Select>
                  </div>
                </FormRow>
                <FormRow title="Runs" required description={draft.trigger.frequency === "yearly" ? "It is sent each year on the start date." : undefined}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputDatePicker
                      label="Start date"
                      isRequired
                      value={draft.trigger.startDate ? parseDate(draft.trigger.startDate) : null}
                      onChange={(value) => updateTrigger({ startDate: value ? value.toString() : "" })}
                      isInvalid={!!errors.startDate}
                    />
                    <InputDatePicker
                      label="End date"
                      value={draft.trigger.endDate ? parseDate(draft.trigger.endDate) : null}
                      onChange={(value) => updateTrigger({ endDate: value ? value.toString() : "" })}
                      isInvalid={!!errors.endDate}
                      hint={errors.endDate ?? "Optional. Leave empty to keep sending."}
                    />
                  </div>
                </FormRow>
              </>
            )}

            <FormRow title="Notification" required>
              <Input
                label="Name"
                isRequired
                placeholder="Enter a name"
                value={draft.name}
                onChange={(value) => {
                  setAutoName(false);
                  update({ name: value });
                }}
                isInvalid={!!errors.name}
                hint={hintFor("name", "Notification name") ?? (autoName && draft.name ? "From the event. Change it if you like." : undefined)}
              />
              <ComboBox
                label="Category"
                isRequired
                placeholder="Choose or type a category"
                allowsCustomValue
                shortcut={false}
                hideIcon
                items={categories.map((c) => ({ id: c, label: c }))}
                inputValue={draft.category}
                onInputChange={(value) => {
                  setAutoCategory(false);
                  update({ category: value });
                }}
                onSelectionChange={(k) => {
                  if (k == null) return;
                  setAutoCategory(false);
                  update({ category: String(k) });
                }}
                isInvalid={!!errors.category}
                hint={categories.some((c) => c.toLowerCase() === draft.category.trim().toLowerCase()) || !draft.category.trim() ? "Choose one, or type a new category to add it." : `"${draft.category.trim()}" is a new category. It is added when you save.`}
              >
                {(item) => <SelectItem id={item.id} label={item.label} />}
              </ComboBox>
              <TextArea label="Short description" placeholder="What it is for, in a sentence" rows={2} value={draft.description} onChange={(value) => update({ description: value })} />
            </FormRow>
          </>,
          )}

        {section === "recipients" &&
          besidePreview(
          <>
            <FormRow title="Send to" required description="Each person gets their own email.">
              <RecipientField
                label="To"
                isRequired
                value={effectiveTo(draft)}
                onChange={(to) => update({ to })}
                roles={directory.roles}
                people={directory.people}
                about={directory.about}
                labelOf={directory.label}
                isInvalid={!!errors.to}
              />
              {showCc && (
                <RecipientField label="CC" value={draft.cc} onChange={(cc) => update({ cc })} roles={directory.roles} people={directory.people} labelOf={directory.label} hint="Everyone who gets the email can see who is in CC." />
              )}
              {showBcc && (
                <RecipientField label="BCC" value={draft.bcc} onChange={(bcc) => update({ bcc })} roles={directory.roles} people={directory.people} labelOf={directory.label} hint="No one sees who is in BCC." />
              )}
              {(!showCc || !showBcc) && (
                <div className="flex flex-wrap gap-4">
                  {!showCc && (
                    <Button color="link-color" size="sm" iconLeading={Plus} onPress={() => setShowCc(true)}>
                      Add CC
                    </Button>
                  )}
                  {!showBcc && (
                    <Button color="link-color" size="sm" iconLeading={Plus} onPress={() => setShowBcc(true)}>
                      Add BCC
                    </Button>
                  )}
                </div>
              )}
            </FormRow>
            <FormRow title="Sending options" description="Most notifications keep these as they are.">
              <Accordion
                variant="boxed"
                defaultOpenKeys={errors.replyTo || errors.retainUntil ? ["sending"] : []}
                items={[
                  {
                    id: "sending",
                    title: (
                      <span className="text-sm text-secondary">
                        From {draft.fromName.trim() || "BioData SA"}
                        {draft.replyTo.trim() ? `, replies to ${draft.replyTo.trim()}` : ""} · Sent emails {logSummary(draft).charAt(0).toLowerCase() + logSummary(draft).slice(1)}
                      </span>
                    ),
                    content: (
                      <div className="flex flex-col gap-4">
                        <Input label="Sender name" placeholder="BioData SA" value={draft.fromName} onChange={(value) => update({ fromName: value })} hint="How the email appears in the inbox. It is always sent by BioData SA." />
                        <Input
                          label="Reply-to address"
                          type="email"
                          placeholder="name@example.com"
                          value={draft.replyTo}
                          onChange={(value) => update({ replyTo: value })}
                          isInvalid={!!errors.replyTo}
                          hint={errors.replyTo ?? "Optional. Where replies go; leave empty if replies aren't read."}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Select
                            label="Keep a copy of each sent email"
                            items={RETENTIONS}
                            selectedKey={draft.retention}
                            onSelectionChange={(k) => k && update({ retention: String(k) as NtDraft["retention"] })}
                            hint={draft.retention === "none" ? "Nothing is kept once an email is sent." : draft.retention === "until" ? undefined : "Each copy is deleted when its time is up."}
                          >
                            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                          </Select>
                          {draft.retention === "until" && (
                            <InputDatePicker
                              label="Keep until"
                              isRequired
                              minValue={parseDate(todayIso()).add({ days: 1 })}
                              value={draft.retainUntil ? parseDate(draft.retainUntil) : null}
                              onChange={(value) => update({ retainUntil: value ? value.toString() : "" })}
                              isInvalid={!!errors.retainUntil}
                              hint={errors.retainUntil === "Keep until" ? "Choose the date to keep sent emails until." : (errors.retainUntil ?? "Every copy is deleted after this date.")}
                            />
                          )}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </FormRow>
          </>,
          )}

        {section === "message" && (
          <div className="grid gap-8 xl:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Template"
                  items={NT_TEMPLATES.map((t) => ({ id: t.id, label: t.name, supportingText: t.brand }))}
                  selectedKey={draft.template}
                  onSelectionChange={(k) => k && update({ template: String(k) as NtDraft["template"] })}
                  hint={NT_TEMPLATES.find((t) => t.id === draft.template)?.description}
                >
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
                <Select
                  label="Classification"
                  items={Object.entries(SENSITIVITY).map(([id, s]) => ({ id, label: s.label }))}
                  selectedKey={draft.sensitivity}
                  onSelectionChange={(k) => k && update({ sensitivity: String(k) as NtDraft["sensitivity"] })}
                  hint="Marked at the top and bottom of the email."
                >
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
              </div>


              <div className="relative border-t border-secondary pt-5">
                <VariableMenu field="Subject" className="absolute top-5 right-0" groups={variables} onInsert={(key) => insertVariable("subject", key)} />
                <Input label="Subject" isRequired placeholder="What the email is about" ref={subjectRef} {...textField("subject")} />
              </div>
              <div className="relative">
                <VariableMenu field="Heading" className="absolute top-0 right-0" groups={variables} onInsert={(key) => insertVariable("heading", key)} />
                <Input label="Heading" placeholder="Leave empty to repeat the subject" ref={headingRef} {...textField("heading")} hint={hintFor("heading", "Heading") ?? "The large line at the top of the email."} />
              </div>
              <TextEditor.Root
                content={bodyHtml(draft.body)}
                placeholder="What the email says"
                isInvalid={!!errors.body}
                inputClassName="min-h-60 [&>*+*]:mt-2"
                onUpdate={({ editor }) => update({ body: editor.getHTML() })}
              >
                <EditorHandle editorRef={bodyEditor} />
                <div className="flex items-center justify-between gap-3">
                  <TextEditor.Label isRequired>Message</TextEditor.Label>
                  <VariableMenu field="Message" groups={variables} onInsert={(key) => insertVariable("body", key)} />
                </div>
                <TextEditor.Toolbar type="advanced" />
                <TextEditor.Content />
                <TextEditor.HintText>{hintFor("body", "Message")}</TextEditor.HintText>
              </TextEditor.Root>
              <div className="relative">
                <VariableMenu field="Sign-off" className="absolute top-0 right-0" groups={variables} onInsert={(key) => insertVariable("signOff", key)} />
                <TextArea label="Sign-off" rows={2} textAreaRef={signOffRef} {...textField("signOff")} />
              </div>

              <div className="flex flex-col gap-3 border-t border-secondary pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="m-0 text-sm font-medium text-secondary">Attachments</p>
                    <p className="m-0 text-sm text-tertiary">Sent with every email, to every recipient.</p>
                  </div>
                  <Button color="secondary" size="sm" iconLeading={Attachment01} onPress={() => fileInput.current?.click()}>
                    Attach files
                  </Button>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) update({ attachments: [...draft.attachments, ...files.map((f) => ({ id: newAttachmentId(), name: f.name, size: f.size }))] });
                      e.target.value = "";
                    }}
                  />
                </div>
                {draft.attachments.length > 0 && (
                  <ul className="m-0 flex list-none flex-col rounded-lg border border-secondary p-0">
                    {draft.attachments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-2 last:border-b-0">
                        <span className="min-w-0 truncate text-sm text-primary">{a.name}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-sm text-tertiary tabular-nums">{formatBytes(a.size)}</span>
                          <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${a.name}`} onPress={() => update({ attachments: draft.attachments.filter((x) => x.id !== a.id) })} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="min-w-0">
              {previewPanel}
            </div>
          </div>
        )}
      </FormPage>

      <DestructiveModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
        isOpen={confirmClose}
        onOpenChange={setConfirmClose}
        title="Discard your changes?"
        description={isLive ? "You have unsaved changes to this notification. Leaving now will lose them." : "You have unsaved changes to this notification. Save a draft to keep them, or discard them."}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        secondaryLabel={isLive ? undefined : "Save draft"}
        onSecondary={() => {
          setConfirmClose(false);
          saveDraft();
        }}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
      />
    </div>
  );
}
