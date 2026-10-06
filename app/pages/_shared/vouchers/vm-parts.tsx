"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getLocalTimeZone, parseDate, today, type CalendarDate } from "@internationalized/date";
import Link from "next/link";
import { ArrowNarrowRight, Edit05, UploadCloud02, XClose, Save01, Send01 } from "@untitledui/icons";
import { Dialog, Modal, ModalFooter, ModalHeader, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { MultiSelect } from "@/components/base/select/multi-select";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";
import { SOURCE_LABEL, decisionKey, diffParts, sameValue, fieldLabel, readDate, valueText, type FieldKey, type FieldValue, type VmBatch, type VmRecord } from "@/app/pages/_shared/vouchers/vm-data";
import { useEdits } from "@/app/pages/_shared/vouchers/vm-store";
import { cx } from "@/utils/cx";

// The pieces the batch and the record view share: a compared value with the part that differs
// marked, what BioData would be updated to, the Edit dialog, and the push confirmation.

/**
 * One side of a comparison. On BioData's side, the part that differs from the source is in the error
 * colour (the Figma marks it the same way); a value BioData doesn't have is a "Missing" badge.
 * The name is italic, as every scientific name in the product is; the note beside it (authorship, or
 * the NSX code) is muted and never compared.
 */
export function ValueView({ field, value, other, side, compact = false }: { field: FieldKey; value: FieldValue | null; other: FieldValue | null; side: "src" | "bio"; /** The review table: the note is left out, and the full value is the cell's title. */ compact?: boolean }) {
  const taxa = useTaxa();
  const d = diffParts(side === "src" ? value : other, side === "src" ? other : value);
  const mark = side === "bio";
  if (!value)
    return side === "bio" ? (
      <Badge size="sm" color="warning">
        Missing
      </Badge>
    ) : (
      <span className="text-sm text-quaternary">Not recorded</span>
    );
  // Two lines (the designer, 1 Oct 2026: "try Authorship and date in two lines"): the person over the
  // date; a scientific name with its NSX code beside it, as the taxon picker shows it ("in all places
  // where you show scientific name show NSX code and scientific name like this"), over the source's
  // authorship. A source's name shows the code of the BioData taxon of that name, when there is one.
  // Each part truncates on its own; the full value is the title.
  if (field === "name") {
    const code = value.taxonId ? value.note : taxa.find((t) => t.scientific === value.text)?.nsx;
    const authorship = value.taxonId ? undefined : value.note;
    return (
      <span className="flex min-w-0 flex-col" title={[value.text, code, authorship].filter(Boolean).join(" ")}>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={cx("truncate text-sm italic", mark && d.text ? "text-error-primary" : "text-primary")}>{value.text}</span>
          {code && <span className="shrink-0 text-sm text-tertiary">{code}</span>}
        </span>
        {/* The source's name has no BioData taxon: said where the name is (2 Oct 2026), so it is known
            before anything is opened; on the second line, so the name itself stays readable. */}
        {!code && side === "src" && !value.taxonId ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Badge size="sm" color="warning" className="shrink-0">
              Not in BioData
            </Badge>
            {authorship && !compact && <span className="truncate text-xs text-tertiary">{authorship}</span>}
          </span>
        ) : (
          authorship && !compact && <span className="truncate text-xs text-tertiary">{authorship}</span>
        )}
      </span>
    );
  }
  if (field === "rego") return <span className={cx("truncate text-sm tabular-nums", mark && d.text ? "text-error-primary" : "text-primary")}>{value.text}</span>;
  return (
    <span className="flex min-w-0 flex-col" title={valueText(value)}>
      <span className={cx("truncate text-sm", mark && d.text ? "text-error-primary" : "text-primary")}>{value.text}</span>
      <span className={cx("truncate text-xs tabular-nums", mark && d.date ? "text-error-primary" : "text-tertiary")}>{readDate(value.date)}</span>
    </span>
  );
}

/**
 * What BioData would be updated to, before anything is pushed: the value an admin chose, or else the
 * source's. A scientific name must point at a BioData taxon, so the source's name is used only when
 * Taxonomy Management has a current taxon of that name; otherwise null, and the admin picks one.
 */
export function useProposal() {
  const taxa = useTaxa();
  const edits = useEdits();
  return (batch: VmBatch, record: VmRecord, field: FieldKey): FieldValue | null => {
    const edit = edits[decisionKey(batch.id, record.id, field)];
    // A value equal to what BioData was scanned with is no update: the source's value (or its taxon,
    // once Taxonomy Management has it) stays the proposal.
    if (edit && !sameValue(edit, record.bio[field])) return edit;
    const src = record.src[field];
    if (!src) return null;
    if (field !== "name") return { text: src.text, date: src.date };
    const t = taxa.find((x) => x.current && x.scientific === src.text);
    return t ? { text: t.scientific, note: t.nsx ?? undefined, taxonId: t.id } : null;
  };
}

/**
 * These dialogs open from state, not a DialogTrigger, so they hand focus back to whatever opened them
 * (the row's Edit icon, the footer's push button) when they close (CONTRACTS 1.9, item 3).
 */
function useReturnFocus() {
  const [opener] = useState(() => (typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null)));
  useEffect(() => () => opener?.focus(), [opener]);
}

// ── Edit ──

function Reference({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 py-1.5">
      <p className="m-0 w-28 shrink-0 text-sm text-secondary">{label}</p>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Change what one field is updated to. The source's value and BioData's are shown for reference; the
 * control fits the field: a BioData taxon (searchable, CONTRACTS memory "long lists are searchable"),
 * a Rego ID, or a person and a date with a calendar (2.11).
 */
export function EditValueModal({
  record,
  field,
  current,
  now,
  onClose,
  onSave,
}: {
  record: VmRecord;
  field: FieldKey;
  current: FieldValue | null;
  /** What BioData holds now: the scanned value, or one already pushed. */
  now: FieldValue | null;
  onClose: () => void;
  onSave: (value: FieldValue | null) => void;
}) {
  useReturnFocus();
  const taxa = useTaxa();
  const [text, setText] = useState(current?.text ?? "");
  const [taxonId, setTaxonId] = useState<string | null>(current?.taxonId ?? null);
  const [date, setDate] = useState<CalendarDate | null>(current?.date ? parseDate(current.date) : today(getLocalTimeZone()));
  const [tried, setTried] = useState(false);
  const source = SOURCE_LABEL[record.source];

  const taxon = taxa.find((t) => t.id === taxonId);
  const next: FieldValue | null =
    field === "name" ? (taxon ? { text: taxon.scientific, note: taxon.nsx ?? undefined, taxonId: taxon.id } : null) : text.trim() ? { text: text.trim(), ...(field === "rego" ? {} : { date: date?.toString() }) } : null;
  const missing = field === "name" ? !taxon : !text.trim() || (field !== "rego" && !date);

  return (
    <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full sm:max-w-136">
        <Dialog>
          <ModalHeader icon={Edit05} iconColor="gray" layout="horizontal" title={`Your update: ${fieldLabel(field)}`} description={`${record.id}. The value BioData is updated to when you push.`} />
          <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6">
            <div className="rounded-lg border border-secondary px-4 py-2">
              <Reference label={source}>
                <ValueView field={field} value={record.src[field]} other={record.bio[field]} side="src" />
              </Reference>
              <Reference label="BioData now">
                <ValueView field={field} value={now} other={record.src[field]} side="bio" />
              </Reference>
            </div>
            {field === "name" ? (
              <MultiSelect
                label="BioData taxon"
                selectionMode="single"
                placeholder="Search taxa"
                items={taxa.filter((t) => t.current).map((t) => ({ id: t.id, label: t.scientific, supportingText: t.nsx ?? undefined }))}
                selectedKeys={new Set(taxonId ? [taxonId] : [])}
                onSelectionChange={(keys) => {
                  const id = keys === "all" ? undefined : Array.from(keys as Set<string>)[0];
                  if (id) setTaxonId(String(id));
                }}
                isInvalid={tried && !taxon}
                hint={tried && !taxon ? "Choose a taxon" : record.src.name && !taxa.some((t) => t.scientific === record.src.name?.text) ? `BioData has no taxon named ${record.src.name.text}. Add it in Taxonomy Management, or choose another.` : undefined}
              >
                {(item) => <MultiSelect.Item {...item} />}
              </MultiSelect>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input label={field === "rego" ? "Rego ID" : "Name"} value={text} onChange={setText} isInvalid={tried && !text.trim()} hint={tried && !text.trim() ? "This field is required" : undefined} />
                </div>
                {field !== "rego" && (
                  <div className="w-44">
                    <InputDatePicker label="Date" value={date} onChange={(v) => setDate(v as CalendarDate | null)} isInvalid={tried && !date} hint={tried && !date ? "Choose a date" : undefined} />
                  </div>
                )}
              </div>
            )}
          </div>
          <ModalFooter layout="horizontal">
            <Button iconLeading={XClose} color="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button iconLeading={Save01}
              color="primary"
              onPress={() => {
                if (missing) return setTried(true);
                onSave(next);
              }}
            >
              Save value
            </Button>
          </ModalFooter>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

// ── Ignore ──

/**
 * Ignoring needs a reason (the designer, 2 Oct 2026: "Ignoring must be performed only by giving a
 * reason"): BioData keeps its value, the difference is not raised again while neither value changes, and
 * whoever meets it later, in this batch or a later one, reads why.
 */
export function IgnoreModal({ what, count, onClose, onConfirm }: { what: string; count: number; onClose: () => void; onConfirm: (reason: string) => void }) {
  useReturnFocus();
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const missing = !reason.trim();
  return (
    <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full sm:max-w-136">
        <Dialog>
          <ModalHeader
            icon={XClose}
            iconColor="gray"
            layout="horizontal"
            title={count === 1 ? "Ignore this difference?" : `Ignore ${count} differences?`}
            description={`${what}. BioData keeps its value, and it isn't raised again in later scans while neither value changes.`}
          />
          <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6">
            <TextArea
              label="Reason"
              isRequired
              rows={3}
              placeholder="Why BioData's value is right"
              value={reason}
              onChange={setReason}
              isInvalid={tried && missing}
              hint={tried && missing ? "Give a reason to ignore" : "Shown with the difference wherever it appears again."}
            />
          </div>
          <ModalFooter layout="horizontal">
            <Button iconLeading={XClose} color="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button iconLeading={XClose}
              color="primary"
              onPress={() => {
                if (missing) return setTried(true);
                onConfirm(reason.trim());
              }}
            >
              {count === 1 ? "Ignore difference" : `Ignore ${count} differences`}
            </Button>
          </ModalFooter>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Why a difference was ignored: who, when, in which batch (a link to it there), and the reason. */
export function IgnoreDetailsModal({ field, batchId, by, at, reason, batchHref, onClose }: { field: FieldKey; batchId: string; by: string; at: string; reason: string; batchHref: string; onClose: () => void }) {
  useReturnFocus();
  return (
    <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full sm:max-w-136">
        <Dialog>
          <ModalHeader icon={XClose} iconColor="gray" layout="horizontal" title={`${fieldLabel(field)}: ignored`} description={`BioData kept its value. Ignored by ${by}, ${readDate(at.slice(0, 10))}.`} />
          <div className="flex flex-col gap-1 px-4 pt-5 sm:px-6">
            <div className="rounded-lg border border-secondary px-4 py-2">
              <Reference label="Reason">
                <span className="text-sm text-balance text-primary">{reason}</span>
              </Reference>
              <Reference label="Batch">
                <Link href={batchHref} className="text-sm font-medium text-brand-secondary tabular-nums outline-focus-ring hover:underline focus-visible:outline-2">
                  Batch {batchId}
                </Link>
              </Reference>
            </div>
          </div>
          <ModalFooter layout="horizontal">
            <Button iconLeading={XClose} color="secondary" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

// ── Push ──

export interface PushGroup {
  record: VmRecord;
  /** `from` is what BioData holds now (the scanned value, or one already pushed); the scanned value when omitted. */
  changes: { field: FieldKey; value: FieldValue; from?: FieldValue | null }[];
}

/**
 * The last look before BioData changes (the Figma's "Confirm push"): each record, each field, what
 * BioData holds now struck through, then what it becomes. Fields with nothing to update to yet (a
 * name with no BioData taxon) are named and left out, never pushed empty.
 */
export function PushModal({ groups, skipped, onClose, onConfirm }: { groups: PushGroup[]; skipped: { record: VmRecord; field: FieldKey }[]; onClose: () => void; onConfirm: () => void }) {
  useReturnFocus();
  const fields = groups.reduce((n, g) => n + g.changes.length, 0);
  const records = groups.length;
  return (
    <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full sm:max-w-160">
        <Dialog>
          <ModalHeader
            icon={UploadCloud02}
            layout="horizontal"
            title={`Push ${fields} ${fields === 1 ? "update" : "updates"} to BioData?`}
            description={`${records} ${records === 1 ? "record changes" : "records change"}. Check each value below; the record's history keeps what it replaced.`}
          />
          <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto px-4 pt-5 sm:px-6">
            {groups.map((g) => (
              <div key={g.record.id} className="rounded-lg border border-secondary">
                <p className="m-0 border-b border-secondary px-4 py-2.5 text-sm font-medium text-primary">
                  {g.record.id} <span className="font-normal text-tertiary">· {SOURCE_LABEL[g.record.source]}</span>
                </p>
                {g.changes.map((c) => (
                  <div key={c.field} className="flex flex-col gap-1 border-b border-secondary px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-6">
                    <p className="m-0 shrink-0 text-sm text-secondary sm:w-44">{fieldLabel(c.field)}</p>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
                      <span className={cx("text-tertiary line-through", c.field === "name" && "italic")}>{valueText(c.from !== undefined ? c.from : g.record.bio[c.field])}</span>
                      <ArrowNarrowRight aria-label="becomes" className="size-4 shrink-0 text-fg-quaternary" />
                      <span className={cx("font-medium text-primary", c.field === "name" && "italic")}>{valueText(c.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {skipped.length > 0 && (
              <p className="m-0 text-sm text-balance text-tertiary">
                Not included yet: {skipped.map((s) => `${fieldLabel(s.field).toLowerCase()} of ${s.record.id}`).join(", ")}. {skipped.some((s) => s.field === "name") ? "A scientific name needs its taxon added in Taxonomy Management, or another taxon chosen." : "Set a value in Your update first."}
              </p>
            )}
          </div>
          <ModalFooter layout="horizontal">
            <Button iconLeading={XClose} color="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button iconLeading={Send01} color="primary" onPress={onConfirm} isDisabled={fields === 0}>
              Push {fields} {fields === 1 ? "update" : "updates"}
            </Button>
          </ModalFooter>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
