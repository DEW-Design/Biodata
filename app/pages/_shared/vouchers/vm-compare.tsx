"use client";

import { useState, type FC, type ReactNode } from "react";
import { DotsVertical, Edit05, FlipBackward, InfoCircle, Plus, XClose } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { ResizableTh, createColumnWidths, tableWidth } from "@/app/pages/_shared/resizable-columns";
import { FIELDS, MATCH_LABEL, SOURCE_LABEL, fieldLabel, fieldShort, readDate, sameValue, valueText, type FieldKey, type FieldValue, type VmBatch, type VmRecord } from "@/app/pages/_shared/vouchers/vm-data";
import { EditValueModal, IgnoreDetailsModal, IgnoreModal, ValueView, useProposal } from "@/app/pages/_shared/vouchers/vm-parts";
import { useVmRoot } from "@/app/pages/_shared/vouchers/vm-root";
import { TX_ROOT } from "@/app/pages/_shared/taxonomy/tx-data";
import { useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";
import { useRoleHref } from "@/lib/use-role-href";
import { fieldStatus, ignoreFields, reopenField, restoreDecisions, setEdit, snapshotDecisions, useDecisions, useEdits, type FieldStatus } from "@/app/pages/_shared/vouchers/vm-store";
import { cx } from "@/utils/cx";

// The one comparison every record is shown in, in a batch and on a record's own page, whatever its
// state (the designer, 1 Oct 2026: "the All records and to review are looking different"). Laid out
// as the Figma draws it (node 1584:10572): a row per record, and inside it one line per field. Columns:
// ID, Key match, Field, the source, BioData now, Your update.
//
//   - Matching lines are hidden until "Show matching fields" is on (the first version's switch, brought
//     back by the designer: "That was good bring it back"); a record whose fields all match says so in
//     one line.
//   - Your update is the value BioData gets, as the Figma has it; a line that differs starts with the
//     source's value. Lines that won't change say why ("No update needed, already matches", "Updated by
//     ...", "Ignored by ..."), with the value updated to or kept. Each line's actions are in one menu (Edit
//     value, Ignore difference, Cancel change, Review again); Edit opens the value in a dialog (taxon
//     picker, Rego ID, or person and date with a calendar). Any updatable field stays updatable.
//   - Observed by is compared and shown, its difference marked, but has no update: it is not updated
//     from a scan (the designer: "Observed by is not editable"; the Figma draws no update for it).
//   - Every column resizes from the edge of its header, as Controlled Vocabulary's grids do (the
//     designer: "use a resizable column like what we did in contrl vocab"); widths are remembered in
//     this browser. That is why this is a composed table (resizable-columns.tsx), not the design
//     system's Table, which has no column resizing; the header and cell classes copy Controlled
//     Vocabulary's.
//   - Records are selected with the design system's small Checkbox on the ID's line.
//   - Two layouts (vm-root.tsx, CONTRACTS 4.4): "lines", a row per record with its fields as lines
//     (Option 1); "rows", a row per field with the record's cells spanning them and each field's row
//     coloured by where it stands, as the Figma draws it (Option 2).

const useCompareWidths = createColumnWidths({
  storageName: "biodata-voucher-widths",
  defaults: { id: 120, key: 112, field: 136, source: 216, bio: 200, update: 272 },
  fallback: 160,
  min: 96,
  max: 520,
  step: 16,
});
const SELECT_WIDTH = 40;

// Controlled Vocabulary's header and cell classes (cv-grids.tsx), so the two tables read alike.
const thClass = "border-b border-secondary bg-secondary px-3 py-2 text-left align-top text-xs font-semibold whitespace-nowrap text-quaternary";
const td = "border-b border-secondary px-3 py-1 align-top";

// The row menu trigger of the project record's actions (record-panel.tsx).
const iconButton =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2";

/** A value on one line, for a line that also carries a caption: a person and date read "Lana Steiner, 14 Aug 2026". */
function OneLine({ field, value }: { field: FieldKey; value: FieldValue | null }) {
  if (field === "name") return <ValueView field={field} value={value} other={null} side="src" compact />;
  return (
    <span className="truncate text-sm text-primary" title={valueText(value)}>
      {valueText(value)}
    </span>
  );
}

/**
 * Option 2's line colours, as the Figma draws them: red for a field that needs review (or a change not
 * pushed yet), amber for one already decided (updated or ignored); a match, or Observed by, stays white.
 * The tints are the design system's: bg-error-primary (error-50), bg-warning-primary (warning-50).
 */
const TINT: Record<FieldStatus["state"], string> = { pending: "bg-error-primary", pushed: "bg-warning-primary", ignored: "bg-warning-primary", match: "", noted: "" };

/** Every line is the same height, so a field's line lines up across the columns. Two lines of text fit. */
function Line({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx("flex h-12 min-w-0 items-center", className)}>{children}</div>;
}

export function CompareTable({
  batch,
  records,
  label,
  recordHref,
  selected,
  onSelectionChange,
  showMatching = false,
  reviewOnly = false,
  layout = "lines",
  fill = false,
  footer,
}: {
  batch: VmBatch;
  records: VmRecord[];
  label: string;
  /** Where a record's ID links. Omitted on the record's own page. */
  recordHref?: (r: VmRecord) => string;
  /** The records selected for push. Omitted where there is nothing to select (a record's own page). */
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  /** Show the lines that match too. */
  showMatching?: boolean;
  /** The batch is narrowed to Needs review: show only the lines still to review. */
  reviewOnly?: boolean;
  /** "lines": a row per record, its fields as lines inside it (Option 1). "rows": a row per field (Option 2). */
  layout?: "lines" | "rows";
  /** A collection screen's table: it takes the height left, and its rows scroll under a sticky header (CONTRACTS 4.2). */
  fill?: boolean;
  /** Pinned under the rows (the pagination). */
  footer?: ReactNode;
}) {
  const decisions = useDecisions();
  const edits = useEdits();
  const proposal = useProposal();
  const widths = useCompareWidths("batch");
  // Option 2 draws the Figma's grid: a rule between cells, so each field's row reads as its own.
  const edge = layout === "rows" ? "border-r border-secondary" : "";
  const [editing, setEditing] = useState<{ record: VmRecord; field: FieldKey } | null>(null);
  const [ignoring, setIgnoring] = useState<{ record: VmRecord; field: FieldKey } | null>(null);
  const [details, setDetails] = useState<{ record: VmRecord; field: FieldKey } | null>(null);
  const roleHref = useRoleHref();
  const root = useVmRoot();
  const router = useRouter();
  const taxa = useTaxa();
  const source = SOURCE_LABEL[batch.source];
  const statusOf = (r: VmRecord, f: FieldKey): FieldStatus => fieldStatus(batch, r, f, decisions, edits);
  const pendingIds = records.filter((r) => FIELDS.some((f) => statusOf(r, f.key).state === "pending")).map((r) => r.id);
  const selectable = !!onSelectionChange;
  const chosen = pendingIds.filter((id) => selected?.has(id));
  const columns = [
    { id: "id", label: "ID" },
    { id: "key", label: "Key match" },
    { id: "field", label: "Field" },
    { id: "source", label: source },
    { id: "bio", label: "BioData now" },
    { id: "update", label: "Your update" },
  ];
  const total = tableWidth(
    columns.map((c) => widths.width(c.id)),
    selectable ? [SELECT_WIDTH] : [],
  );

  /**
   * The lines a record shows: every field with "Show matching fields" on; otherwise the ones that don't
   * simply match; and when the batch is narrowed to Needs review, only the ones still to review (the
   * designer, 2 Oct 2026: "we dont have to show already updated records in needs review?"). Decided lines
   * stay under All, Updated and Ignored.
   */
  const linesOf = (r: VmRecord): FieldKey[] =>
    FIELDS.map((f) => f.key).filter((f) => {
      if (showMatching) return true;
      const state = statusOf(r, f).state;
      return reviewOnly ? state === "pending" : state !== "match";
    });

  /**
   * Set what BioData will be updated to. On a line the scan found different, the value is kept as given.
   * Anywhere else, a value BioData already holds clears it, so the line goes back to how it was.
   */
  const change = (r: VmRecord, f: FieldKey, s: FieldStatus, value: FieldValue | null) => {
    const ref = { recordId: r.id, field: f };
    if (s.state === "pending" && !s.manual) setEdit(batch.id, ref, value && !sameValue(value, s.now) ? value : null);
    else setEdit(batch.id, ref, value && !sameValue(value, s.now) ? value : null);
  };

  /** Ignore one difference, once a reason is given (IgnoreModal). */
  const ignore = (r: VmRecord, f: FieldKey, reason: string) => {
    const refs = [{ recordId: r.id, field: f }];
    const before = snapshotDecisions(batch.id, refs);
    ignoreFields(batch.id, refs, reason);
    setEdit(batch.id, refs[0], null);
    toast.success(`${fieldShort(f)} of ${r.id} ignored`, {
      description: "BioData keeps its value. It stays ignored in later scans while neither value changes.",
      actionLabel: "Undo",
      onAction: () => restoreDecisions(before),
    });
  };

  /** Where and why a field was ignored: this batch, or the earlier one it was carried from. */
  const ignoredWhere = (r: VmRecord, s: FieldStatus) => {
    const d = s.decision?.kind === "ignored" ? s.decision : undefined;
    const batchId = s.carriedFrom?.batchId ?? batch.id;
    return {
      batchId,
      by: s.carriedFrom?.by ?? d?.by ?? "",
      at: s.carriedFrom?.at ?? d?.at ?? "",
      reason: s.carriedFrom?.reason ?? d?.reason ?? "No reason recorded",
      href: roleHref(`${root}/${batchId}?record=${encodeURIComponent(r.id)}`),
      carried: !!s.carriedFrom,
    };
  };

  /** The line's actions, in one menu: the project record's "..." trigger. */
  const menu = (r: VmRecord, f: FieldKey, items: { id: string; label: string; icon: FC<{ className?: string }>; run: () => void }[]) => (
    <Dropdown.Root>
      <Tooltip title="Actions">
        <TooltipTrigger aria-label={`Actions for ${fieldShort(f).toLowerCase()} of ${r.id}`} className={iconButton}>
          <DotsVertical className="size-5" />
        </TooltipTrigger>
      </Tooltip>
      <Dropdown.Popover placement="bottom end" className="w-60">
        <Dropdown.Menu aria-label={`Actions for ${fieldShort(f).toLowerCase()} of ${r.id}`} onAction={(key) => items.find((i) => i.id === key)?.run()}>
          {items.map((i) => (
            <Dropdown.Item key={i.id} id={i.id} label={i.label} icon={i.icon} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );

  /** The source's scientific name has no current BioData taxon, and the admin hasn't chosen another one. */
  const needsTaxon = (r: VmRecord, f: FieldKey) => {
    if (f !== "name" || !r.src.name) return false;
    if (taxa.some((t) => t.current && t.scientific === r.src.name!.text)) return false;
    const chosen = proposal(batch, r, f);
    return !chosen || sameValue(chosen, statusOf(r, f).now);
  };
  /** Taxonomy Management's Append, from BioData's current taxon where there is one. */
  const addTaxonHref = (s: FieldStatus) => roleHref(`${TX_ROOT}/new?type=append${s.now?.taxonId ? `&from=${encodeURIComponent(s.now.taxonId)}` : ""}`);

  /**
   * Your update for one line. Always a value (the designer, 1 Oct 2026: "you must show what is it updated
   * to"): what BioData gets, what it was updated to, or what it kept; under it, who did it. A line that
   * simply matches says so. Its actions are in one menu, not words beside the value (the designer:
   * "Edit and ignore is feeling visually broken ... put both in menu icon"). Observed by has neither.
   */
  const update = (r: VmRecord, f: FieldKey) => {
    const s = statusOf(r, f);
    if (s.state === "noted") return null;
    const ref = { recordId: r.id, field: f };
    const items: { id: string; label: string; icon: FC<{ className?: string }>; run: () => void }[] = [];
    let top: ReactNode;
    let caption: ReactNode;
    let captionTitle: string | undefined;

    if (s.state === "pending" && needsTaxon(r, f)) {
      // The source's name has no BioData taxon, and no other taxon was chosen: nothing can be pushed
      // until the taxon exists. The line says so and leads to Taxonomy Management's Append, starting
      // from BioData's current taxon (its genus and higher taxa). Once the taxon is added, the line
      // finds it by itself and shows it with its new NSX code, ready to push (2 Oct 2026: "What would
      // make the admin help in the same screen to know they must add the taxon first").
      const href = addTaxonHref(s);
      return (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-primary">Add the taxon first</span>
            <span className="truncate text-xs text-tertiary" title={`The ${source}'s name isn't in BioData's taxonomy. Add it in Taxonomy Management, then push.`}>
              Not in BioData&apos;s taxonomy yet
            </span>
          </span>
          <Button color="link-color" size="sm" href={href}>
            Add taxon
          </Button>
          {menu(r, f, [
            { id: "add", label: "Add in Taxonomy Management", icon: Plus, run: () => router.push(href) },
            { id: "edit", label: "Choose another taxon", icon: Edit05, run: () => setEditing({ record: r, field: f }) },
            { id: "ignore", label: "Ignore difference", icon: XClose, run: () => setIgnoring({ record: r, field: f }) },
          ])}
        </>
      );
    }

    if (s.state === "pending") {
      const value = proposal(batch, r, f);
      const has = !!value && !!value.text.trim();
      top = has ? <ValueView field={f} value={value} other={null} side="src" compact /> : <span className="text-sm text-tertiary">Not set</span>;
      if (s.manual) caption = "Your change, not pushed yet";
      items.push({ id: "edit", label: f === "name" && !has ? "Choose a taxon" : "Edit value", icon: Edit05, run: () => setEditing({ record: r, field: f }) });
      if (s.manual) items.push({ id: "cancel", label: "Cancel change", icon: FlipBackward, run: () => setEdit(batch.id, ref, null) });
      else items.push({ id: "ignore", label: "Ignore difference", icon: XClose, run: () => setIgnoring({ record: r, field: f }) });
    } else if (s.state === "pushed" && s.decision?.kind === "pushed") {
      top = <OneLine field={f} value={s.now} />;
      caption = `Updated by ${s.decision.by}, ${readDate(s.decision.at.slice(0, 10))}`;
      items.push({ id: "edit", label: "Edit value", icon: Edit05, run: () => setEditing({ record: r, field: f }) });
    } else if (s.state === "ignored") {
      // Kept, with where and why (the designer: "previously ignored must let the user know in which batch
      // it was ignored and be able to go to the batch and the reason").
      const w = ignoredWhere(r, s);
      top = <OneLine field={f} value={s.now} />;
      caption = w.carried ? (
        <>
          Ignored in{" "}
          <Link href={w.href} className="font-medium text-brand-secondary tabular-nums outline-focus-ring hover:underline focus-visible:outline-2">
            batch {w.batchId}
          </Link>
          : {w.reason}
        </>
      ) : (
        <>Ignored: {w.reason}</>
      );
      captionTitle = `Ignored in batch ${w.batchId} by ${w.by}: ${w.reason}`;
      items.push({ id: "why", label: "Why it was ignored", icon: InfoCircle, run: () => setDetails({ record: r, field: f }) });
      items.push({ id: "reopen", label: "Review again", icon: FlipBackward, run: () => reopenField(batch.id, ref, !!s.carriedFrom) });
    } else {
      top = <span className="truncate text-sm text-tertiary">No update needed, already matches</span>;
      items.push({ id: "edit", label: "Edit value", icon: Edit05, run: () => setEditing({ record: r, field: f }) });
    }

    return (
      <>
        <span className="flex min-w-0 flex-1 flex-col">
          {top}
          {caption && (
            <span className="truncate text-xs text-tertiary" title={captionTitle ?? (typeof caption === "string" ? caption : undefined)}>
              {caption}
            </span>
          )}
        </span>
        {menu(r, f, items)}
      </>
    );
  };

  return (
    <div className={cx("flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary", fill && "min-h-48 flex-1")}>
      <div className={cx("overflow-auto", fill && "min-h-0 flex-1")}>
        <table aria-label={label} className="w-full table-fixed border-collapse" style={{ minWidth: total }}>
          <thead className={cx(fill && "sticky top-0 z-10")}>
            <tr>
              {selectable && (
                <th scope="col" style={{ width: SELECT_WIDTH }} className={thClass}>
                  <Checkbox
                    size="sm"
                    aria-label="Select every record on this page that has an update to push"
                    isDisabled={pendingIds.length === 0}
                    isSelected={chosen.length > 0 && chosen.length === pendingIds.length}
                    isIndeterminate={chosen.length > 0 && chosen.length < pendingIds.length}
                    onChange={(on) => onSelectionChange!(new Set(on ? pendingIds : []))}
                  />
                </th>
              )}
              {columns.map((c, i) => (
                <ResizableTh key={c.id} id={c.id} label={c.label} widths={widths} className={thClass} last={i === columns.length - 1} />
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const lines = linesOf(r);
              const canSelect = pendingIds.includes(r.id);
              const span = layout === "rows" ? Math.max(lines.length, 1) : undefined;
              // The record's own cells: in Option 2 they span its field rows.
              const head = (
                <>
                  {selectable && (
                    <td rowSpan={span} className={cx(td, edge)}>
                      <Line>
                        <Checkbox
                          size="sm"
                          aria-label={`Select ${r.id}`}
                          isDisabled={!canSelect}
                          isSelected={canSelect && !!selected?.has(r.id)}
                          onChange={(on) => {
                            const next = new Set(selected);
                            if (on) next.add(r.id);
                            else next.delete(r.id);
                            onSelectionChange!(next);
                          }}
                        />
                      </Line>
                    </td>
                  )}
                  <td rowSpan={span} className={cx(td, edge)}>
                    <Line>
                      {recordHref ? (
                        <Link href={recordHref(r)} className="truncate text-sm font-medium text-primary tabular-nums outline-focus-ring hover:text-brand-700 hover:underline focus-visible:outline-2">
                          {r.id}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium text-primary tabular-nums">{r.id}</span>
                      )}
                    </Line>
                  </td>
                  <td rowSpan={span} className={cx(td, edge)}>
                    <Line>
                      <span className="text-sm text-balance text-secondary">{MATCH_LABEL[r.matchedOn]}</span>
                    </Line>
                  </td>
                </>
              );
              const allMatch = (
                <td colSpan={4} className={cx(td, edge)}>
                  <Line>
                    <span className="text-sm text-quaternary">All four fields match BioData</span>
                  </Line>
                </td>
              );
              const label = (f: FieldKey) => <span className={cx("truncate text-sm", statusOf(r, f).differs ? "text-secondary" : "text-quaternary")}>{fieldShort(f)}</span>;
              const src = (f: FieldKey) => <ValueView field={f} value={r.src[f]} other={r.bio[f]} side="src" />;
              const bio = (f: FieldKey) => <ValueView field={f} value={statusOf(r, f).now} other={r.src[f]} side="bio" />;

              // Option 2: a row per field, as the Figma draws it. The Field column is grey and the three
              // value cells are coloured by where the field stands.
              if (layout === "rows") {
                if (lines.length === 0)
                  return (
                    <tr key={r.id}>
                      {head}
                      {allMatch}
                    </tr>
                  );
                return lines.map((f, i) => {
                  const tint = TINT[statusOf(r, f).state];
                  return (
                    <tr key={`${r.id}|${f}`}>
                      {i === 0 && head}
                      <td className={cx(td, edge, "bg-secondary")}>
                        <Line>{label(f)}</Line>
                      </td>
                      <td className={cx(td, edge, tint)}>
                        <Line>{src(f)}</Line>
                      </td>
                      <td className={cx(td, edge, tint)}>
                        <Line>{bio(f)}</Line>
                      </td>
                      <td className={cx(td, tint)}>
                        <Line className="gap-2">{update(r, f)}</Line>
                      </td>
                    </tr>
                  );
                });
              }

              return (
                <tr key={r.id}>
                  {head}
                  {lines.length === 0 ? (
                    allMatch
                  ) : (
                    <>
                      <td className={td}>
                        {lines.map((f) => (
                          <Line key={f}>{label(f)}</Line>
                        ))}
                      </td>
                      <td className={td}>
                        {lines.map((f) => (
                          <Line key={f}>{src(f)}</Line>
                        ))}
                      </td>
                      <td className={td}>
                        {lines.map((f) => (
                          <Line key={f}>{bio(f)}</Line>
                        ))}
                      </td>
                      <td className={td}>
                        {lines.map((f) => (
                          <Line key={f} className="gap-2">
                            {update(r, f)}
                          </Line>
                        ))}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
      {ignoring && (
        <IgnoreModal
          what={`${ignoring.record.id}, ${fieldLabel(ignoring.field).toLowerCase()}`}
          count={1}
          onClose={() => setIgnoring(null)}
          onConfirm={(reason) => {
            ignore(ignoring.record, ignoring.field, reason);
            setIgnoring(null);
          }}
        />
      )}
      {details &&
        (() => {
          const w = ignoredWhere(details.record, statusOf(details.record, details.field));
          return <IgnoreDetailsModal field={details.field} batchId={w.batchId} by={w.by} at={w.at} reason={w.reason} batchHref={w.href} onClose={() => setDetails(null)} />;
        })()}
      {editing && (
        <EditValueModal
          record={editing.record}
          field={editing.field}
          current={statusOf(editing.record, editing.field).state === "pending" ? proposal(batch, editing.record, editing.field) : statusOf(editing.record, editing.field).now}
          now={statusOf(editing.record, editing.field).now}
          onClose={() => setEditing(null)}
          onSave={(value) => {
            change(editing.record, editing.field, statusOf(editing.record, editing.field), value);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
