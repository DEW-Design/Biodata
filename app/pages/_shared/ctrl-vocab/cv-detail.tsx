"use client";

import { useState, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { Archive, ArrowNarrowLeft, Download01, Edit05, RefreshCcw01, SearchMd, Trash01, Power01, Rows01, File06, ClockRewind } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal, FormModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { CV_ROOT,
  archivedByEndDate,
  columnLabel,
  cvStatus,
  cvStatusMeta,
  cvTypeLabel,
  draftOf,
  entryStatusMeta,
  formatDateTime,
  formatShortDate,
  identifierLabel,
  resolvedEntries,
  sortEntries,
  sourceTable,
  todayIso,
  validateCv,
  type Cv,
  type CvEntry, shownFields } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { allCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// A vocabulary's own page, laid out like the project page (CONTRACTS 4.6): Back link, the gradient
// identity card with the actions at its top right, at most one notice, then underline tabs of
// bordered label/value cards.
//
//   Entries   the values, in display order (REQ-18.2: the configured order, otherwise by name).
//             Inactive entries stay listed and marked (REQ-18.5). A Descriptive vocabulary shows the
//             values read live from its source table through the mapping (REQ-18.4).
//   Details   the definition: name, category, dates, columns, and for a Descriptive vocabulary its
//             table and mapping.
//   History   every change, who and when, with the before and after values (REQ-18.11). The Figma's
//             "View Logs" link becomes this tab.
//
// A numbered vocabulary (Code or ID) shows its identifier column as "ID". Its template
// is downloaded and uploaded from column 2's Actions, not from this page.
//
// Actions: Edit is the next step; Archive sits below the divider in "..." (a live vocabulary is never
// deleted, REQ-18.6); a draft, never live, can be deleted instead (the designer, 30 Sept 2026). An archived vocabulary's next step is Reactivate, which asks for the new end date and runs
// the creation checks first (REQ-18.5). Export history downloads this vocabulary's audit log (REQ-18.11).

const NotProvided = () => <span className="text-quaternary">Not provided</span>;

/** The same order as the edit grid: Order (when shown), then an automatic ID, then the values. */
function columnsIn(cv: Cv) {
  const all = shownFields(cv).map((f) => (f.id === "code" ? { ...f, label: identifierLabel(cv.idKind) } : f));
  const autoId = cv.type === "reference" && cv.idKind === "number";
  const isId = (id: string) => autoId && id === "code";
  return [...all.filter((f) => f.id === "order"), ...all.filter((f) => isId(f.id)), ...all.filter((f) => f.id !== "order" && !isId(f.id))];
}

function EntriesTable({ cv, entries }: { cv: Cv; entries: CvEntry[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const columns = columnsIn(cv);
  const descriptive = cv.type === "descriptive";

  const query = search.trim().toLowerCase();
  const rows = query ? entries.filter((e) => [e.code, e.name, e.title, e.value, e.description].some((v) => v.toLowerCase().includes(query))) : entries;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const heading = (id: string, label: string) => (descriptive && cv.mapping[id]?.length ? `${label} (${cv.mapping[id].map((c) => columnLabel(cv.sourceTable, c)).join(" + ")})` : label);

  const colWidth = `${100 / (columns.length + 1 + cv.customColumns.length)}%`;
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full max-w-xs">
        <Input
          aria-label="Search entries"
          size="sm"
          icon={SearchMd}
          placeholder="Search code, name, title or value"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-tertiary">{entries.length === 0 ? "No entries yet." : "No entries match your search."}</p>
      ) : (
        <TableCard.Root size="sm">
          <Table layout="fixed" className="min-w-[800px]" bodyScrollable size="sm" aria-label={`${cv.name} entries`}>
            <Table.Header size="sm">
              {/* The columns are the vocabulary's own, so they share the width evenly (CONTRACTS 4.2f). */}
              {[
                ...columns.map((f) => <Table.Head key={f.id} id={f.id} style={{ width: colWidth }} label={heading(f.id, f.label)} isRowHeader={f.id === (cv.type === "reference" && cv.idKind === "number" ? "name" : "code")} />),
                <Table.Head key="status" id="status" style={{ width: colWidth }} label="Available to users" />,
                ...cv.customColumns.map((c) => <Table.Head key={c.id} id={c.id} style={{ width: colWidth }} label={heading(c.id, c.label)} />),
              ]}
            </Table.Header>
            <Table.Body items={paged}>
              {(entry) => (
                <Table.Row id={entry.id} textValue={entry.code || entry.name} size="sm">
                  {[
                    ...columns.map((f) => (
                      <Table.Cell key={f.id} size="sm">
                        <span className={cx("text-sm", f.id === "code" ? (cv.type === "reference" && cv.idKind === "number" ? "text-quaternary tabular-nums" : "font-medium text-primary tabular-nums") : f.id === "order" ? "text-secondary tabular-nums" : "text-secondary", entry.status === "inactive" && "text-tertiary")}>
                          {entry[f.id] || <NotProvided />}
                        </span>
                      </Table.Cell>
                    )),
                    <Table.Cell key="status" size="sm">
                      <Badge size="sm" color={entryStatusMeta[entry.status].badgeColor}>
                        {entryStatusMeta[entry.status].label}
                      </Badge>
                    </Table.Cell>,
                    ...cv.customColumns.map((c) => (
                      <Table.Cell key={c.id} size="sm">
                        <span className="text-sm text-secondary">{entry.custom[c.id] || <NotProvided />}</span>
                      </Table.Cell>
                    )),
                  ]}
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <TableCard.PaginationNumbered
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            totalCount={rows.length}
          />
        </TableCard.Root>
      )}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-secondary">{children}</div>;
}

export function CvDetail({
  cv,
  onEdit,
  onArchive,
  onReactivate,
  onDeleteDraft,
}: {
  cv: Cv;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: (endDate: string) => void;
  onDeleteDraft: () => void;
}) {
  const roleHref = useRoleHref();
  const [tab, setTab] = useState<Key>("entries");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [reactivateError, setReactivateError] = useState<string | undefined>();

  const status = cvStatus(cv);
  const meta = cvStatusMeta[status];
  const byEndDate = archivedByEndDate(cv);
  const entries = sortEntries(resolvedEntries(cv));
  const activeCount = entries.filter((e) => e.status === "active").length;
  const table = sourceTable(cv.sourceTable);
  const created = cv.history[0];

  const exportHistory = () =>
    downloadCsv(
      `${cv.id}-history.csv`,
      ["Date and time", "By", "Action", "Field", "Previous value", "Updated value"],
      cv.history.flatMap((e) => (e.changes?.length ? e.changes.map((c) => [formatDateTime(e.at), e.by, e.action, c.field, c.from, c.to]) : [[formatDateTime(e.at), e.by, e.action, "", "", ""]])),
    );

  const edit: RecordAction = { id: "edit", label: status === "draft" ? "Edit draft" : "Edit vocabulary", icon: Edit05, onPress: onEdit };
  const exportAction: RecordAction = { id: "export", label: "Export history", icon: Download01, onPress: exportHistory };
  const actions: { primary?: RecordAction; secondary: RecordAction[]; menu: RecordAction[] } =
    status === "archived"
      ? {
          primary: {
            id: "reactivate",
            label: "Reactivate",
            icon: RefreshCcw01,
            onPress: () => {
              setNewEndDate("");
              setReactivateError(undefined);
              setReactivateOpen(true);
            },
          },
          secondary: [],
          menu: [exportAction],
        }
      : {
          primary: edit,
          secondary: [],
          menu: [
            exportAction,
            status === "draft"
              ? { id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setConfirmDelete(true) }
              : { id: "archive", label: "Archive vocabulary", icon: Archive, destructive: true, onPress: () => setConfirmArchive(true) },
          ],
        };

  const reactivate = () => {
    const today = todayIso();
    if (newEndDate && newEndDate < today) return setReactivateError("The end date must be today or later");
    if (newEndDate && newEndDate < cv.startDate) return setReactivateError("The end date must be on or after the start date");
    // REQ-18.5: the checks a new vocabulary goes through run again before it comes back.
    const problems = Object.values(validateCv({ ...draftOf(cv), endDate: newEndDate }, "publish", allCvs(), cv.id));
    if (problems.length) return setReactivateError(`Fix these first, from Edit: ${problems.join(", ")}.`);
    setReactivateOpen(false);
    onReactivate(newEndDate);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref(CV_ROOT)}>Back to vocabularies</RecordBackLink>

      <RecordHero eyebrow={`${cvTypeLabel[cv.type]} vocabulary`} title={cv.name} description={cv.description || undefined} actions={<RecordActionBar onDark {...actions} />}>
        <HeroMeta label="ID">
          <span className="tabular-nums">{cv.id}</span>
        </HeroMeta>
        <HeroMeta label="Category">{cv.category || "Not provided"}</HeroMeta>
        <HeroMeta label="Start date">{cv.startDate ? formatShortDate(cv.startDate) : "Not provided"}</HeroMeta>
        <HeroMeta label="End date">{cv.endDate ? formatShortDate(cv.endDate) : "No end date"}</HeroMeta>
        <HeroMeta label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </HeroMeta>
      </RecordHero>

      <div className="shrink-0 px-6 pt-4 empty:hidden">
        {status === "archived" && (
          <AlertFullWidth
            color="gray"
            title={byEndDate ? `Archived when its end date passed (${formatShortDate(cv.endDate)})` : "Archived"}
            description="Its values are no longer offered in any form. Records that already hold one keep it, but can't be saved with it again. Reactivate to bring it back."
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {status === "scheduled" && (
          <AlertFullWidth
            color="brand"
            title={`Goes live on ${formatShortDate(cv.startDate)}`}
            description="Until then its values aren't offered in forms or accepted in uploads."
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
      </div>

      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="Vocabulary sections" type="underline" size="md">
            <Tab id="entries" label="Entries" icon={Rows01} badge={activeCount} />
            <Tab id="details" label="Details" icon={File06} />
            <Tab id="history" label="History" icon={ClockRewind} />
          </TabList>
        </div>

        <TabPanel id="entries" className="flex flex-col gap-4 p-6">
          {cv.type === "descriptive" && (
            <p className="text-sm text-balance text-tertiary">
              {table ? `Read from the ${table.label} table each time they're used, never copied here.` : "No source table chosen yet."}
            </p>
          )}
          {entries.length > activeCount && (
            <p className="text-sm text-balance text-tertiary">
              {entries.length - activeCount} hidden from users: not offered in forms&apos; dropdowns, but kept on the records that already hold {entries.length - activeCount === 1 ? "it" : "them"}.
            </p>
          )}
          {cv.type === "descriptive" && (!cv.mapping.code?.length || !cv.mapping.name?.length) ? (
            <p className="text-sm text-quaternary">Map the Code and Name columns to see the values.</p>
          ) : (
            <EntriesTable cv={cv} entries={entries} />
          )}
        </TabPanel>

        <TabPanel id="details" className="flex flex-col gap-4 p-6">
          <Card>
            <RecordRow label="Vocabulary name">{cv.name}</RecordRow>
            <RecordRow label="Category">{cv.category || <NotProvided />}</RecordRow>
            <RecordRow label="Type">{cvTypeLabel[cv.type]}</RecordRow>
            <RecordRow label="Short description">{cv.description || <NotProvided />}</RecordRow>
            <RecordRow label="Start date">{cv.startDate ? formatShortDate(cv.startDate) : <NotProvided />}</RecordRow>
            <RecordRow label="End date">{cv.endDate ? formatShortDate(cv.endDate) : "No end date"}</RecordRow>
            <RecordRow label="Created">{created ? `${formatDateTime(created.at)} by ${created.by}` : <NotProvided />}</RecordRow>
          </Card>
          <Card>
            <RecordRow label="Columns">{columnsIn(cv).map((f) => f.label).join(", ")}</RecordRow>
            <RecordRow label="Custom columns">{cv.customColumns.length ? cv.customColumns.map((c) => c.label).join(", ") : "None"}</RecordRow>
            {cv.type === "descriptive" && (
              <>
                <RecordRow label="Source table">{table?.label ?? <NotProvided />}</RecordRow>
                {[...columnsIn(cv), ...cv.customColumns].map((f) => (
                  <RecordRow key={f.id} label={`${f.label} from`}>
                    {cv.mapping[f.id]?.length ? cv.mapping[f.id].map((c) => columnLabel(cv.sourceTable, c)).join(" + ") : <NotProvided />}
                  </RecordRow>
                ))}
              </>
            )}
          </Card>
        </TabPanel>


        <TabPanel id="history" className="p-6">
          <AuditLog id={cv.id} idLabel="Vocabulary ID" items={milestones(cv.history, { label: "Activated", is: (e) => e.action === "Created" || e.action === "Published" }, { created: cv.createdAt, updated: cv.updatedAt })} changeCount={cv.history.length}>
            <Card>
              {[...cv.history].reverse().map((e, i) => (
                <RecordRow key={`${e.at}-${i}`} label={formatDateTime(e.at)}>
                  <span className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-primary">{e.action}</span>
                      <span className="text-tertiary">by {e.by}</span>
                    </span>
                    {e.changes?.length ? (
                      <span className="flex flex-col gap-1">
                        {e.changes.map((c, j) => (
                          <span key={j} className="text-secondary">
                            {c.field}: <span className="text-tertiary">{c.from}</span> changed to <span className="text-primary">{c.to}</span>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </RecordRow>
              ))}
            </Card>
          </AuditLog>
        </TabPanel>
      </Tabs>

      <DestructiveModal
        confirmIcon={Trash01}
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete draft ${cv.name || cv.id}?`}
        description="The draft and its entries are deleted and can't be recovered. It was never live, so no record holds its values."
        confirmLabel="Delete draft"
        onConfirm={() => {
          setConfirmDelete(false);
          onDeleteDraft();
        }}
      />
      <DestructiveModal
        confirmIcon={Archive}
        isOpen={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${cv.name}?`}
        description="Its values stop being offered in forms and accepted in uploads straight away. Records that already hold one keep it. You can reactivate it later."
        confirmLabel="Archive vocabulary"
        onConfirm={() => {
          setConfirmArchive(false);
          onArchive();
        }}
      />
      <FormModal
        submitIcon={Power01}
        isOpen={reactivateOpen}
        onOpenChange={setReactivateOpen}
        icon={RefreshCcw01}
        title={`Reactivate ${cv.name}?`}
        description={byEndDate ? "It archived itself when its end date passed. Give it a new end date, or leave it empty for no end date." : "Give it an end date, or leave it empty for no end date."}
        submitLabel="Reactivate"
        onSubmit={reactivate}
      >
        <InputDatePicker
          label="New end date"
          value={newEndDate ? parseDate(newEndDate) : null}
          onChange={(v) => {
            setNewEndDate(v ? v.toString() : "");
            setReactivateError(undefined);
          }}
          isInvalid={!!reactivateError}
          hint={reactivateError}
        />
      </FormModal>
    </div>
  );
}

export function CvNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Vocabulary not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">There is no vocabulary {id}. It may have been created in another browser.</p>
      <Button color="link-color" size="sm" href={roleHref(CV_ROOT)} iconLeading={ArrowNarrowLeft}>
        Back to vocabularies
      </Button>
    </div>
  );
}
