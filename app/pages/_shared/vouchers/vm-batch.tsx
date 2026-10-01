"use client";

import { useState } from "react";
import { Download01 } from "@untitledui/icons";
import { TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { ListFilterButton, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { FIELDS, MATCH_LABEL, sameValue, RESULT_META, SOURCE_LABEL, formatDateTime, readDate, valueText, type FieldKey, type MatchKey, type RecordResult, type VmBatch, type VmRecord } from "@/app/pages/_shared/vouchers/vm-data";
import { VM_OPTION_2, useVmRoot } from "@/app/pages/_shared/vouchers/vm-root";
import { CompareTable } from "@/app/pages/_shared/vouchers/vm-compare";
import { IgnoreModal, PushModal, useProposal, type PushGroup } from "@/app/pages/_shared/vouchers/vm-parts";
import { fieldStatus, ignoreFields, pushFields, recordResult, restoreDecisions, setEdit, snapshotDecisions, summarise, useAllRecords, useDecisions, useEdits } from "@/app/pages/_shared/vouchers/vm-store";
import { useRoleHref } from "@/lib/use-role-href";

// One scan batch, laid out like the project page (CONTRACTS 4.6): Back link, the identity card, then
// the batch's records. From the Figma's batch screen (nodes 1584:10220 and 1584:10572):
//
//   - Every record is shown the same way, in one table (vm-compare.tsx): its fields beside the
//     source's, and Your update, whatever its state. "Show matching fields" (off at first) adds the
//     lines that match. Where a record stands (Needs review, Matched,
//     Updated, Ignored) is a Status filter, with the Figma's "View only" fields and Key match beside
//     it; there are no tabs (the designer, 1 Oct 2026: "put the tab options under filters"). The batch
//     opens on the records that need review; clearing the filter shows them all, in the same layout.
//   - Select records, then "Review and push" in the bottom bar opens the Figma's confirmation. "Ignore"
//     in the bar keeps BioData's values for every difference in the selected records.
//   - The batch's source is in the eyebrow; column 2 moves between sources.

const STATUS_ORDER: RecordResult[] = ["review", "matched", "updated", "ignored"];

export function VmBatchPage({ batch }: { batch: VmBatch }) {
  const roleHref = useRoleHref();
  const root = useVmRoot();
  const decisions = useDecisions();
  const edits = useEdits();
  const proposal = useProposal();
  const all = useAllRecords(batch);
  const source = SOURCE_LABEL[batch.source];
  const summary = summarise(batch, decisions, edits);

  const resultOf = (r: VmRecord): RecordResult => (batch.records.includes(r) || hasEdit(r) ? recordResult(batch, r, decisions, edits) : "matched");
  const hasEdit = (r: VmRecord) => FIELDS.some((f) => `${batch.id}|${r.id}|${f.key}` in edits);
  const pendingOf = (r: VmRecord): FieldKey[] => FIELDS.map((f) => f.key).filter((k) => fieldStatus(batch, r, k, decisions, edits).state === "pending");

  const [filters, setFilters] = useState<FilterSelection>((): FilterSelection => (batch.records.some((r) => recordResult(batch, r, decisions, edits) === "review") ? { status: new Set(["review"]) } : {}));
  const [search, setSearch] = useState("");
  // Off: only the lines that differ, or that an admin has decided or changed (the first version's switch).
  const [showMatching, setShowMatching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pushing, setPushing] = useState<string[] | null>(null);
  const [ignoring, setIgnoring] = useState(false);
  const resetPage = () => setPage(1);

  const query = search.trim().toLowerCase();
  const statusFilter = filters.status ?? new Set<string>();
  const fieldFilter = filters.field ?? new Set<string>();
  const keyFilter = filters.key ?? new Set<string>();
  const rows = all.filter(
    (r) =>
      (!query || r.id.toLowerCase().includes(query) || (r.src.name?.text ?? "").toLowerCase().includes(query) || (r.bio.name?.text ?? "").toLowerCase().includes(query)) &&
      (keyFilter.size === 0 || keyFilter.has(r.matchedOn)) &&
      (fieldFilter.size === 0 || FIELDS.some((f) => fieldFilter.has(f.key) && fieldStatus(batch, r, f.key, decisions, edits).differs)) &&
      (statusFilter.size === 0 || statusFilter.has(resultOf(r))),
  );
  const narrowed = !!query || statusFilter.size > 0 || fieldFilter.size > 0 || keyFilter.size > 0;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const recordHref = (r: VmRecord) => roleHref(`${root}/${batch.id}?record=${encodeURIComponent(r.id)}`);

  // ── Push or ignore the selected records ──
  const selectedRows = all.filter((r) => selected.has(r.id) && pendingOf(r).length > 0);
  const selectedPending = selectedRows.reduce((n, r) => n + pendingOf(r).length, 0);

  const ignoreRefs = () => selectedRows.flatMap((r) => pendingOf(r).filter((f) => fieldStatus(batch, r, f, decisions, edits).differs).map((field) => ({ recordId: r.id, field })));
  const ignoreSelected = (reason: string) => {
    const refs = ignoreRefs();
    const before = snapshotDecisions(batch.id, refs);
    ignoreFields(batch.id, refs, reason);
    setIgnoring(false);
    for (const ref of refs) setEdit(batch.id, ref, null);
    setSelected(new Set());
    toast.success(`${refs.length} ${refs.length === 1 ? "difference" : "differences"} ignored`, {
      description: "BioData keeps its values. They stay ignored in later scans while neither value changes.",
      actionLabel: "Undo",
      onAction: () => restoreDecisions(before),
    });
  };

  const pushPlan = (ids: string[]) => {
    const groups: PushGroup[] = [];
    const skipped: { record: VmRecord; field: FieldKey }[] = [];
    for (const r of all.filter((x) => ids.includes(x.id))) {
      const changes: PushGroup["changes"] = [];
      for (const field of pendingOf(r)) {
        const value = proposal(batch, r, field);
        const from = fieldStatus(batch, r, field, decisions, edits).now;
        // Nothing to push: no value yet, or the value BioData already holds (a name whose taxon isn't in BioData).
        if (value && value.text.trim() && !sameValue(value, from)) changes.push({ field, value, from });
        else skipped.push({ record: r, field });
      }
      if (changes.length) groups.push({ record: r, changes });
    }
    return { groups, skipped };
  };

  const confirmPush = (ids: string[]) => {
    const { groups } = pushPlan(ids);
    const items = groups.flatMap((g) => g.changes.map((c) => ({ recordId: g.record.id, field: c.field, value: c.value })));
    pushFields(batch.id, items);
    setPushing(null);
    setSelected(new Set());
    toast.success(`${items.length} ${items.length === 1 ? "update" : "updates"} pushed to BioData`, { description: `${groups.length} ${groups.length === 1 ? "record" : "records"} updated.` });
  };

  const exportCsv = () =>
    downloadCsv(
      `voucher-batch-${batch.id}.csv`,
      ["Record", "Key match", "Field", `${source} value`, "BioData value", "Status", "Decided by", "Decided on"],
      batch.records.flatMap((r) =>
        FIELDS.filter((f) => fieldStatus(batch, r, f.key, decisions, edits).differs).map((f) => {
          const s = fieldStatus(batch, r, f.key, decisions, edits);
          const d = s.decision && s.decision.kind !== "reopened" ? s.decision : undefined;
          return [
            r.id,
            MATCH_LABEL[r.matchedOn],
            f.label,
            valueText(r.src[f.key]),
            valueText(r.bio[f.key]),
            s.state === "pending" ? "Needs review" : s.state === "pushed" ? "Updated" : "Ignored",
            d?.by ?? s.carriedFrom?.by ?? "",
            d ? formatDateTime(d.at) : s.carriedFrom ? formatDateTime(s.carriedFrom.at) : "",
          ];
        }),
      ),
    );

  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", options: STATUS_ORDER.map((s) => ({ id: s, label: RESULT_META[s].label })) },
    { id: "field", label: "Field that differs", options: FIELDS.map((f) => ({ id: f.key, label: f.label })) },
    { id: "key", label: "Key match", options: (Object.keys(MATCH_LABEL) as MatchKey[]).map((k) => ({ id: k, label: MATCH_LABEL[k] })) },
  ];
  const plan = pushing ? pushPlan(pushing) : null;
  const onlyReview = statusFilter.size === 1 && statusFilter.has("review");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={roleHref(`${root}?source=${batch.source}`)}>{source} batches</RecordBackLink>
      <RecordHero eyebrow={`${source} scan`} title={`Batch ${batch.id}`} actions={<RecordActionBar onDark secondary={[{ id: "export", label: "Export differences", icon: Download01, onPress: exportCsv }]} />}>
        <HeroMeta label="Ran on">{readDate(batch.ranOn)}</HeroMeta>
        <HeroMeta label="Records checked">
          <span className="tabular-nums">{batch.checked.toLocaleString("en-AU")}</span>
        </HeroMeta>
        <HeroMeta label="Fields that differ">
          <span className="tabular-nums">{summary.different}</span>
          {summary.missing > 0 && <span className="text-white/70"> · {summary.missing} missing in BioData</span>}
        </HeroMeta>
        <HeroMeta label="Records to review">
          <span className="tabular-nums">{summary.toReview}</span>
        </HeroMeta>
      </RecordHero>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search records"
            placeholder="Search by scientific name or ID"
            value={search}
            onChange={(next) => {
              setSearch(next);
              resetPage();
            }}
          />
          <div>
            <ListFilterButton
              sections={filterSections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                resetPage();
              }}
            />
          </div>
          <div className="ml-auto">
            <Toggle size="sm" label="Show matching fields" isSelected={showMatching} onChange={setShowMatching} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="m-0 text-sm text-balance text-tertiary">
              {onlyReview && !query && fieldFilter.size === 0 && keyFilter.size === 0 ? "Nothing in this batch needs review. Every difference is decided." : "No records match your search and filters."}
            </p>
            {narrowed && (
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  setSearch("");
                  setFilters({});
                  resetPage();
                }}
              >
                Show every record
              </Button>
            )}
          </div>
        ) : (
          <CompareTable
            fill
            layout={root === VM_OPTION_2 ? "rows" : "lines"}
            batch={batch}
            records={paged}
            label={`Records in batch ${batch.id}`}
            recordHref={recordHref}
            selected={selected}
            onSelectionChange={setSelected}
            showMatching={showMatching}
            reviewOnly={onlyReview}
            footer={
              <TableCard.PaginationNumbered
                page={currentPage}
                pageCount={pageCount}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  resetPage();
                }}
                totalCount={rows.length}
              />
            }
          />
        )}
      </div>

      {summary.toReview > 0 || selectedRows.length > 0 ? (
        <div className="shrink-0 border-t border-secondary bg-primary">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <p className="text-sm text-tertiary">
              {selectedRows.length === 0 ? (
                "Select the records to push. Each one is updated to Your update."
              ) : (
                <>
                  <span className="font-semibold text-primary">
                    {selectedRows.length} {selectedRows.length === 1 ? "record" : "records"} selected
                  </span>
                  <span className="text-quaternary">
                    {" "}
                    · {selectedPending} {selectedPending === 1 ? "update" : "updates"}
                  </span>
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button color="secondary" isDisabled={ignoreRefs().length === 0} onPress={() => setIgnoring(true)}>
                Ignore
              </Button>
              <Button color="primary" isDisabled={selectedRows.length === 0} onPress={() => setPushing(selectedRows.map((r) => r.id))}>
                Review and push
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {ignoring && (
        <IgnoreModal
          what={`${selectedRows.length} ${selectedRows.length === 1 ? "record" : "records"}: every difference not decided yet`}
          count={ignoreRefs().length}
          onClose={() => setIgnoring(false)}
          onConfirm={ignoreSelected}
        />
      )}
      {pushing && plan && <PushModal groups={plan.groups} skipped={plan.skipped} onClose={() => setPushing(null)} onConfirm={() => confirmPush(pushing)} />}
    </div>
  );
}
