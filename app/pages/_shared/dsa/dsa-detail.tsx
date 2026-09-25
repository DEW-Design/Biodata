"use client";

import { useState, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { ArrowNarrowLeft, Download01, Edit05, Eye, EyeOff, Mail01, Phone01, SearchLg, SearchMd } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Table, TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { RejectModal } from "@/app/pages/_shared/agreement-modals";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { useRoleHref } from "@/lib/use-role-href";
import { contactName, dsaScopeOptions, dsaStatusMeta, formatShortDate, todayIso, type Dsa, type DsaContact, type DsaStatus, type DsaSystem } from "@/app/pages/_shared/dsa/dsa-data";
import { cx } from "@/utils/cx";

// The DSA deep dive at /pages/dsa/<id> (lo-fi frame "DSA List", right-hand pane, Figma node 3:15089),
// restructured to borrow project-detail's own information arrangement directly, per direct request
// ("the structure of arranging information should also be borrowed from the project details
// screen... currently the DSA information screen looks like it's all over the place"). The first
// pass stacked three same-weight BentoCards (each re-announcing its own title, one of them holding
// two contacts crammed into a shared grid) - that flat, undifferentiated stack was the actual
// complaint, not any one card's content. Now:
//   toolbar    Back to agreements + Download PDF/Actions - unchanged from the gradient-card pass
//   gradient   identity + short-form metadata - unchanged from the gradient-card pass
//   tabs       Overview / Data Sharing, `type="underline" size="md"`, exactly project-detail's own
//              ContentTabs treatment
//   content    one bordered card per tab, its own fields divided by `border-b` (project-detail's
//              "Full Project Name"/"Abstract" card), a persistent right-hand rail of `ContactCard`s
//              on Overview (project-detail's Data Owner/Project Manager rail) instead of a
//              same-width grid, and real `Mail01`/`Phone01` icons next to each contact's email/
//              phone - all direct ports of "the rigour and polish from Projects" (Sept 22 2026
//              follow-up), not new patterns invented for DSA.
//
// Deliberately not ported: project-detail's `FlaggedConceptsBanner` (an admin review queue over a
// project's own flagged concepts) has no DSA equivalent in this data model - there is nothing real
// to flag on an agreement yet, so no banner is faked here just to look busier.
//
// Empty values say "Not provided" rather than a stray dash (CONTEXT.md, cognitive-load principles),
// and a section for something the agreement doesn't use (no API systems) collapses to one honest
// line instead of an empty table.
//
// Toolbar/action set follows the shared DSA/DLA workflow (agreement-status.ts, see CONTEXT.md's
// "Unified DSA/DLA status model"): Edit (Draft through Approved, not once Active - "for active
// requests only cancel option can be used"), Start Review (Submitted), Put On Hold / Resume
// (Under Review <-> On Hold), Approve / Reject (Under Review), Cancel (anywhere before Closed).
// DSA has no separate requester-vs-reviewer persona to gate these behind - `DsaShell` already
// replaces all of `main` with a restricted message for every role but the one that can manage DSAs
// at all, so every action here is always available once this component renders.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-sm font-medium text-tertiary">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

// Same helper as project-detail's own MetaField - a label/value pair that can render on the
// gradient card (white text) or on a plain background (the default).
function MetaField({ label, children, onDark = false }: { label: string; children: ReactNode; onDark?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className={cx("text-xs font-semibold tracking-wide uppercase", onDark ? "text-white/70" : "text-quaternary")}>{label}</p>
      <div className={cx("text-sm", onDark ? "text-white" : "text-primary")}>{children}</div>
    </div>
  );
}

const NotProvided = () => <span className="text-quaternary">Not provided</span>;

// project-detail's own ContactCard, ported directly (same title/orgLabel header, border-t divider,
// name line, and a Mail01/Phone01-led row rather than two bare text lines) rather than approximated.
// `orgLabel` is optional there too - passed for "Agreement requested by" (the partner org, real,
// distinct information) and omitted for "Agreement custodian (DEW)", whose org is already named in
// the title itself, so repeating "DEW" as a value one line below would be a literal duplicate.
function ContactCard({ title, orgLabel, contact }: { title: string; orgLabel?: string; contact: DsaContact }) {
  const name = contactName(contact);
  return (
    <BentoCard className="flex-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        {orgLabel && <p className="text-sm text-tertiary">{orgLabel}</p>}
      </div>
      <div className="flex flex-col gap-1 border-t border-secondary pt-4">
        {name ? <p className="text-sm font-medium text-primary">{name}</p> : <NotProvided />}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
          {contact.email && (
            <span className="flex items-center gap-1.5">
              <Mail01 className="size-3.5 text-quaternary" />
              {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1.5">
              <Phone01 className="size-3.5 text-quaternary" />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

function scopeLabels(system: DsaSystem) {
  return system.scopes.map((id) => dsaScopeOptions.find((o) => o.id === id)?.label ?? id).join(", ");
}

function permissionLabels(system: DsaSystem) {
  const labels = [system.canRead && "Read data", system.canWrite && "Write data"].filter(Boolean);
  return labels.length ? labels.join(", ") : null;
}

// Same masking rule as the form: credentials stay hidden until someone asks to see them.
function SystemPanelBody({ system }: { system: DsaSystem }) {
  const [shown, setShown] = useState(false);
  const mask = "•".repeat(48);
  const contact = contactName(system.org);

  return (
    <div className="flex flex-col gap-5">
      <Field label="Department / agency">{system.org.name || <NotProvided />}</Field>
      <Field label="Redirect URL">{system.redirectUrl || <NotProvided />}</Field>
      <Field label="Scope">{scopeLabels(system) || <NotProvided />}</Field>
      <Field label="Permissions">{permissionLabels(system) ?? <NotProvided />}</Field>
      <div className="flex flex-col gap-2 border-t border-secondary pt-5">
        <p className="text-sm font-semibold text-primary">Contact</p>
        <div className="flex flex-col gap-0.5 rounded-lg bg-secondary p-4">
          {contact ? <p className="text-sm font-medium text-primary">{contact}</p> : <NotProvided />}
          {system.org.email && <p className="text-sm text-tertiary">{system.org.email}</p>}
          {system.org.phone && <p className="text-sm text-tertiary">{system.org.phone}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-secondary pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">Credentials</p>
          <Button size="sm" color="link-gray" iconLeading={shown ? EyeOff : Eye} onPress={() => setShown((s) => !s)}>
            {shown ? "Hide tokens" : "Show tokens"}
          </Button>
        </div>
        <Field label="System token">
          <span className="break-all text-tertiary">{shown ? system.accessToken : mask}</span>
        </Field>
        <Field label="Refresh token">
          <span className="break-all text-tertiary">{shown ? system.refreshToken : mask}</span>
        </Field>
        <p className="text-sm text-tertiary">Tokens are re-generated from Edit Agreement.</p>
      </div>
    </div>
  );
}

export function DsaDetail({
  dsa,
  onEdit,
  onDeleteDraft,
  onStartReview,
  onHold,
  onResume,
  onApprove,
  onReject,
  onCancel,
}: {
  dsa: Dsa;
  onEdit: () => void;
  onDeleteDraft: () => void;
  onStartReview: () => void;
  onHold: () => void;
  onResume: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onCancel: () => void;
}) {
  const [systemOpen, setSystemOpen] = useState<DsaSystem | null>(null);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete" | "approve">(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [tab, setTab] = useState<Key>("overview");
  const [systemSearch, setSystemSearch] = useState("");
  const [systemPage, setSystemPage] = useState(1);
  const [systemPageSize, setSystemPageSize] = useState(50);
  const roleHref = useRoleHref();
  const meta = dsaStatusMeta[dsa.status];
  const isDraft = dsa.status === "draft";
  // Every action below is a direct toolbar button, always visible - the same "never behind a
  // scroll" convention DLA's own toolbar already follows. Edit stops once an agreement is Active
  // ("for active requests only cancel option can be used" - see agreement-status.ts); Cancel is
  // available anywhere before Closed/Rejected/Cancelled itself.
  const canEdit = dsa.status === "draft" || dsa.status === "submitted" || dsa.status === "under_review" || dsa.status === "on_hold" || dsa.status === "approved";
  const canCancel = dsa.status !== "closed" && dsa.status !== "rejected" && dsa.status !== "cancelled";
  const hasOtherAction = canEdit || dsa.status === "submitted" || dsa.status === "under_review" || dsa.status === "on_hold";

  // Section header + search + table (CONTEXT.md's non-negotiable) applied at this table's own
  // scale - a count next to its label, a real search, real numbered pagination - rather than the
  // page-level `SectionHeader` component, which is sized for a whole screen, not a sub-card inside
  // a detail tab.
  const systemQuery = systemSearch.trim().toLowerCase();
  const systemRows = systemQuery ? dsa.systems.filter((s) => [s.name, s.org.name].some((v) => v.toLowerCase().includes(systemQuery))) : dsa.systems;
  const systemPageCount = Math.max(1, Math.ceil(systemRows.length / systemPageSize));
  const systemCurrentPage = Math.min(systemPage, systemPageCount);
  const pagedSystems = systemRows.slice((systemCurrentPage - 1) * systemPageSize, systemCurrentPage * systemPageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Back link + every real action this record can take right now, always visible - never
          behind a scroll, matching DLA's own toolbar exactly. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <Button color="link-gray" size="sm" iconLeading={ArrowNarrowLeft} href={roleHref(`/pages/dsa?status=${dsa.status}`)}>
          Back to agreements
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            color="secondary"
            iconLeading={Download01}
            isDisabled={!dsa.agreementFile}
            onPress={() =>
              toast.brand("Download isn't wired up yet", {
                description: "Agreement PDFs aren't stored in this preview, so there is no file to download.",
              })
            }
          >
            Download PDF
          </Button>
          {isDraft && (
            <Button color="secondary-destructive" onPress={() => setConfirm("delete")}>
              Delete draft
            </Button>
          )}
          {canEdit && (
            <Button color="secondary" iconLeading={Edit05} onPress={onEdit}>
              {isDraft ? "Edit draft" : "Edit agreement"}
            </Button>
          )}
          {dsa.status === "submitted" && (
            <Button color="primary" onPress={onStartReview}>
              Start Review
            </Button>
          )}
          {dsa.status === "under_review" && (
            <>
              <Button color="secondary" onPress={onHold}>
                Put On Hold
              </Button>
              <Button color="secondary-destructive" onPress={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button color="primary" onPress={() => setConfirm("approve")}>
                Approve
              </Button>
            </>
          )}
          {dsa.status === "on_hold" && (
            <Button color="primary" onPress={onResume}>
              Resume Review
            </Button>
          )}
          {canCancel && (
            <Button color={hasOtherAction ? "secondary-destructive" : "link-destructive"} onPress={() => setConfirm("cancel")}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* The same gradient card the Home dashboard/project-detail open with, so the agreement's
          identity and its short-form metadata are the one focal point at the top of the page. */}
      <div className="shrink-0 px-6 pt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">Data Sharing Agreement</p>
            <h1 className="text-2xl font-medium text-white">{dsa.id}</h1>
          </div>
          <div className="flex flex-wrap items-start gap-8">
            <MetaField onDark label="Data Partnership">
              {dsa.partner || "Not provided"}
            </MetaField>
            <MetaField onDark label="Valid From">
              {dsa.validFrom ? formatShortDate(dsa.validFrom) : "Not provided"}
            </MetaField>
            <MetaField onDark label="Valid To">
              {dsa.validTo ? formatShortDate(dsa.validTo) : "Not provided"}
            </MetaField>
            <MetaField onDark label="Status">
              <Badge size="sm" color={meta.badgeColor}>
                {meta.label}
              </Badge>
            </MetaField>
          </div>
        </div>
      </div>

      {/* Neutral statements of fact, same convention as DLA's own status banners - DSA has no
          separate requester persona to write differently for, so this always reads as the one
          reviewer's own view. */}
      <div className="shrink-0 px-6 pt-4">
        {dsa.status === "under_review" && (
          <AlertFullWidth
            color="warning"
            title="Under Review"
            description="This agreement needs a decision - see Put On Hold, Reject or Approve above."
            confirmLabel="Noted"
            contained
            className="max-w-none rounded-lg border border-warning-200 px-4 py-3 md:px-4"
          />
        )}
        {dsa.status === "on_hold" && (
          <AlertFullWidth
            color="warning"
            title="On Hold"
            description="This review is paused pending information from the requester. Resume once you have what you need."
            confirmLabel="Noted"
            contained
            className="max-w-none rounded-lg border border-warning-200 px-4 py-3 md:px-4"
          />
        )}
        {dsa.status === "rejected" && (
          <AlertFullWidth
            color="error"
            title="Agreement Rejected"
            description={dsa.rejectionReason || "No reason was provided."}
            confirmLabel="Noted"
            contained
            className="max-w-none rounded-lg border border-error-200 px-4 py-3 md:px-4"
          />
        )}
        {dsa.status === "cancelled" && (
          <AlertFullWidth
            color="gray"
            title="Cancelled"
            description="This agreement was cancelled and is no longer active."
            confirmLabel="Noted"
            contained
            className="max-w-none rounded-lg border border-secondary px-4 py-3 md:px-4"
          />
        )}
      </div>

      {/* Real Tabs directly under the gradient card, matching project-detail's own ContentTabs row
          exactly - the underline is drawn by TabList itself, no extra border div needed. */}
      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="Agreement sections" type="underline" size="md" className="gap-6">
            <Tab id="overview" label="Overview" />
            <Tab id="sharing" label="Data Sharing" />
          </TabList>
        </div>

        <TabPanel id="overview" className="flex flex-col gap-4 p-6">
          <p className="text-xs text-tertiary">Last updated {formatShortDate(dsa.updatedAt)}</p>

          {/* Same row as project-detail's Overview tab: a single bordered card on the left holding
              this tab's own fields (a baseline label/value row for the short one, an uppercase
              eyebrow section for the long one), a persistent contacts rail on the right - not a
              same-width grid, so the rail reads as reference material beside the main content. */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-secondary">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-secondary p-6">
                <span className="text-sm text-tertiary">Signed agreement</span>
                <span className={cx("text-sm font-medium", dsa.agreementFile ? "text-primary" : "text-quaternary")}>
                  {dsa.agreementFile?.name ?? "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-6">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Purpose of data sharing</p>
                <p className={cx("text-sm", dsa.purpose ? "text-secondary" : "text-quaternary")}>{dsa.purpose || "Not provided"}</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
              <ContactCard title="Agreement requested by" orgLabel={dsa.partner || undefined} contact={dsa.requestedBy} />
              <ContactCard title="Agreement custodian (DEW)" contact={dsa.custodian} />
            </div>
          </div>
        </TabPanel>

        <TabPanel id="sharing" className="p-6">
          <div className="flex flex-col rounded-lg border border-secondary">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-secondary p-6">
              <span className="text-sm text-tertiary">Data shared via offline</span>
              <span className={cx("text-sm font-medium", dsa.sharedOffline ? "text-primary" : "text-quaternary")}>
                {dsa.sharedOffline ? "Digital copies" : "Not used"}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Data shared via system (API)</p>
                {dsa.sharedViaSystem && dsa.systems.length > 0 && <CountBadge count={dsa.systems.length} color="gray" />}
              </div>
              {dsa.sharedViaSystem && dsa.systems.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="w-full max-w-xs">
                    <Input
                      aria-label="Search systems"
                      size="sm"
                      icon={SearchMd}
                      placeholder="Search system or department"
                      value={systemSearch}
                      onChange={(value) => {
                        setSystemSearch(value);
                        setSystemPage(1);
                      }}
                    />
                  </div>
                  {systemRows.length === 0 ? (
                    <p className="py-4 text-sm text-tertiary">No systems match your search.</p>
                  ) : (
                    <TableCard.Root size="sm">
                      <Table aria-label="Systems that receive data through the API">
                        <Table.Header>
                          <Table.Head id="system" label="System" isRowHeader />
                          <Table.Head id="org" label="Department / agency" />
                          <Table.Head id="action" label="Action" />
                        </Table.Header>
                        <Table.Body items={pagedSystems}>
                          {(system) => (
                            <Table.Row id={system.id} textValue={system.name}>
                              <Table.Cell>
                                <span className="text-sm font-medium text-primary">{system.name}</span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-sm text-tertiary">{system.org.name}</span>
                              </Table.Cell>
                              <Table.Cell>
                                <Button color="link-color" size="sm" onPress={() => setSystemOpen(system)}>
                                  View details
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          )}
                        </Table.Body>
                      </Table>
                      <TableCard.PaginationNumbered
                        page={systemCurrentPage}
                        pageCount={systemPageCount}
                        onPageChange={setSystemPage}
                        pageSize={systemPageSize}
                        onPageSizeChange={(size) => {
                          setSystemPageSize(size);
                          setSystemPage(1);
                        }}
                        totalCount={systemRows.length}
                      />
                    </TableCard.Root>
                  )}
                </div>
              ) : (
                <p className="text-sm text-quaternary">Not used</p>
              )}
            </div>
          </div>
        </TabPanel>
      </Tabs>

      <SidePanel isOpen={systemOpen !== null} onOpenChange={(open) => !open && setSystemOpen(null)} title={systemOpen?.name ?? "System"}>
        {systemOpen && <SystemPanelBody system={systemOpen} />}
      </SidePanel>

      <DestructiveModal
        isOpen={confirm === "delete" || confirm === "cancel"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "delete" ? `Delete draft ${dsa.id}?` : `Cancel ${dsa.id}?`}
        description={
          confirm === "delete"
            ? "The draft is removed and can't be recovered."
            : `${dsa.partner || "The partner organisation"} loses access under this agreement. The agreement moves to Cancelled and can't be reversed here.`
        }
        confirmLabel={confirm === "delete" ? "Delete draft" : "Cancel agreement"}
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action === "delete") onDeleteDraft();
          else onCancel();
        }}
      />
      <ConfirmationModal
        isOpen={confirm === "approve"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Approve ${dsa.id}?`}
        description={
          dsa.validFrom && dsa.validFrom > todayIso()
            ? `This agreement moves to Approved and becomes Active on ${formatShortDate(dsa.validFrom)}.`
            : "This agreement's start date has already arrived, so it moves straight to Active."
        }
        confirmLabel="Approve"
        onConfirm={() => {
          setConfirm(null);
          onApprove();
        }}
      />
      <RejectModal id={dsa.id} isOpen={rejectOpen} onOpenChange={setRejectOpen} onReject={(reason) => { setRejectOpen(false); onReject(reason); }} />
    </div>
  );
}

const emptyCopy: Record<DsaStatus, { title: string; description: string; cta: boolean }> = {
  draft: { title: "No drafts", description: "Agreements you save as a draft appear here until they are submitted.", cta: true },
  submitted: { title: "No submitted agreements", description: "Agreements waiting for a reviewer to start their review appear here.", cta: true },
  under_review: { title: "No agreements under review", description: "Agreements a reviewer is currently assessing appear here.", cta: false },
  on_hold: { title: "No agreements on hold", description: "Agreements paused pending information from the requester appear here.", cta: false },
  approved: { title: "No approved agreements", description: "Agreements approved and waiting on their own start date appear here.", cta: false },
  rejected: { title: "No rejected agreements", description: "Agreements a reviewer formally rejected appear here.", cta: false },
  active: {
    title: "No active agreements",
    description: "There are no active Data Sharing Agreements. Create one to start sharing data with a partner organisation.",
    cta: true,
  },
  closed: { title: "No closed agreements", description: "Agreements that have run their course, automatically or manually, appear here.", cta: false },
  cancelled: { title: "No cancelled agreements", description: "Agreements cancelled by the requester or an admin appear here.", cta: false },
};

// Lo-fi frame "DSA Empty State" (node 3:15244). The lo-fi's concentric-ring backdrop is a
// decorative graphic with no asset in this repo, so it is left out rather than redrawn.
export function DsaEmptyState({ status, newHref }: { status: DsaStatus; newHref: string }) {
  const copy = emptyCopy[status];
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <FeaturedIcon icon={SearchLg} theme="modern" color="gray" size="lg" />
        <div className="flex flex-col gap-2">
          <h2 className="m-0! text-lg! font-semibold! tracking-normal! text-primary!">{copy.title}</h2>
          <p className="text-sm text-balance text-tertiary">{copy.description}</p>
        </div>
      </div>
      {copy.cta && (
        <Button color="primary" href={newHref}>
          New agreement
        </Button>
      )}
    </div>
  );
}

// Agreements live in module state (see dsa-store.ts), so a full reload on an agreement created this
// session lands here rather than on a blank page.
export function DsaNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">Agreement not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">
        There is no agreement {id}. In this preview, agreements you create are kept only until the page is reloaded.
      </p>
      <Button color="link-color" size="sm" href={roleHref("/pages/dsa")} iconLeading={ArrowNarrowLeft}>
        Back to agreements
      </Button>
    </div>
  );
}
