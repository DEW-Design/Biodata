"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { ArrowNarrowLeft, CheckCircle, Download01, Edit05, PauseCircle, PlayCircle, Plus, SearchLg, SlashCircle01, Trash01, XCircle, Grid01, MarkerPin04, FileCheck02, ClockRewind } from "@untitledui/icons";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { AuditLog } from "@/app/pages/_shared/audit-log";
import { RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputDate } from "@/components/base/input/input-date";
import { InputFile } from "@/components/base/input/input-file";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { DestructiveModal, FormModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { AddLocationModal } from "@/app/pages/_shared/dla/add-location-modal";
import { RejectModal } from "@/app/pages/_shared/agreement-modals";
import {
  dlaLevel3Projects,
  dlaLevelMeta,
  dlaLocationMethodLabel,
  dlaStatusMeta,
  formatShortDate,
  isDlaEditable,
  MAX_AGREEMENT_FILE_BYTES,
  requestorName,
  todayIso,
  type Dla,
  type DlaAgreementFile,
  type DlaApproveInput,
  type DlaLocation,
  type DlaRequestor,
  type DlaStatus,
} from "@/app/pages/_shared/dla/dla-data";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// The DLA deep dive at /pages/dla/<id> (wireframe "View - Data Licence Agreement", Figma
// YMproGZfrFB5jUqPHPxMhk node 33:43259), rebuilt on the same information arrangement DSA and
// project-detail both use - a gradient identity card, a toolbar carrying every real action (never
// behind a scroll), then real Tabs (Overview / Locations & Access / Agreement) instead of the
// wireframe's own flat two-pane layout or a same-weight card stack. See context/decisions/2026-09-23-03-data-licencing-agreement-dla-workflow-built-at-pages.md, "Data
// Licencing Agreement (DLA)".
//
// Unlike DSA (two contacts - requester and DEW custodian, so a persistent side rail of ContactCards
// made sense), a DLA has exactly one requestor - it's rendered as its own field group inline rather
// than forced into a one-card "rail" that would just be an orphaned narrow column.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-sm font-medium text-tertiary">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function MetaField({ label, children, onDark = false }: { label: string; children: ReactNode; onDark?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className={cx("text-xs font-semibold tracking-wide uppercase", onDark ? "text-white/70" : "text-quaternary")}>{label}</p>
      <div className={cx("text-sm", onDark ? "text-white" : "text-primary")}>{children}</div>
    </div>
  );
}

const NotProvided = () => <span className="text-quaternary">Not provided</span>;

function LocationCard({ location, index, locked, newRequestHref }: { location: DlaLocation; index: number; locked: boolean; newRequestHref: string }) {
  const router = useRouter();
  const level = dlaLevelMeta[location.level];
  const projectNames = location.projectIds.map((id) => dlaLevel3Projects.find((p) => p.id === id)?.name ?? id);
  return (
    <div className={cx("flex flex-col gap-3", index > 0 && "border-t border-secondary pt-4")}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-tertiary">{index + 1}</span>
        <span className="text-xs font-medium text-quaternary">{dlaLocationMethodLabel(location)}</span>
      </div>
      <p className="pl-7 text-sm font-medium text-primary">{location.name}</p>
      <div className="pl-7">
        <Field label="License Category">
          <div className="flex flex-col gap-1">
            <Badge size="sm" color={location.level === "level3" ? "warning" : "brand"}>
              {level.short}
            </Badge>
            <p className="text-sm text-tertiary">{level.description}</p>
            {/* Once granted, a location's level can't change in place (CONTEXT.md, "DLA: an access
                level can't be changed once granted") - say so here, where the level is shown, rather
                than leaving the missing Edit action to speak for itself. */}
            {locked && (
              <AlertFullWidth
                wrap
                color="gray"
                title="Access level locked"
                description={`This is the granted level and can't be changed here. Need ${location.level === "level3" ? "Level 2" : "Level 3"} instead?`}
                confirmLabel="Submit a new request"
                onConfirm={() => router.push(newRequestHref)}
              />
            )}
          </div>
        </Field>
      </div>
      {location.level === "level3" && (
        <div className="pl-7">
          <Field label="Projects for Level 3 Access">
            {projectNames.length > 0 ? (
              <ul className="list-disc pl-4 text-sm text-secondary">
                {projectNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : (
              <NotProvided />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}

function RequestorFields({ requestor }: { requestor: DlaRequestor }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name">{requestorName(requestor) || <NotProvided />}</Field>
      <Field label="Organisation">{requestor.organisation || <NotProvided />}</Field>
      <Field label="Email">{requestor.email || <NotProvided />}</Field>
      <Field label="Phone">{requestor.phone || <NotProvided />}</Field>
    </div>
  );
}

/** Reads a real picked file's own bytes into a `DlaAgreementFile` - the file's content becomes a
 *  base64 `data:` URL (`FileReader.readAsDataURL`), so "Download PDF" later has something real to
 *  hand back, not just the name that was typed into a text field. A DOM API, so it lives here
 *  (a "use client" file) rather than in dla-data.ts. */
function readAgreementFile(file: File): Promise<DlaAgreementFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, size: file.size, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** A real download, not a toast: the file's own real bytes are already a `data:` URL, so a
 *  temporary `<a download>` (the same technique this app's CSV/Excel/PDF exports already use,
 *  see map-search/export-utils.ts) hands it straight back with no Blob conversion needed. */
function downloadAgreementFile(file: DlaAgreementFile) {
  const a = document.createElement("a");
  a.href = file.dataUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Approve moves straight to Active if the chosen start date has already arrived, otherwise
// Approved / Auto Approved until that date (agreement-status.ts) - the modal's own copy says which
// outcome the current date field will produce, computed live as the reviewer picks a date.
function ApproveModal({ dla, isOpen, onOpenChange, onApprove }: { dla: Dla; isOpen: boolean; onOpenChange: (open: boolean) => void; onApprove: (input: DlaApproveInput) => void }) {
  const [validFrom, setValidFrom] = useState(dla.requestPeriodFrom);
  const [validTo, setValidTo] = useState(dla.requestPeriodTo);
  const [agreementFile, setAgreementFile] = useState<DlaAgreementFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const willBeActiveNow = !!validFrom && validFrom <= todayIso();

  return (
    <FormModal submitIcon={CheckCircle}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={CheckCircle}
      iconColor="success"
      title="Approve request"
      description={
        willBeActiveNow
          ? "The start date has already arrived, so this request moves straight to Active."
          : validFrom
            ? `This request moves to Approved and becomes Active on ${formatShortDate(validFrom)}.`
            : "Set the agreement period and approve this request."
      }
      submitLabel="Upload and Approve"
      size="sm"
      isSubmitLoading={isReadingFile}
      onSubmit={() => {
        if (isReadingFile) return;
        onApprove({ validFrom, validTo, agreementFile, isCustom, customNote });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <InputDate label="Agreement Start Date" value={validFrom ? parseDate(validFrom) : null} onChange={(v) => setValidFrom(v ? v.toString() : "")} />
        <InputDate label="Agreement End Date" value={validTo ? parseDate(validTo) : null} onChange={(v) => setValidTo(v ? v.toString() : "")} />
      </div>
      <InputFile
        label="Attach Agreement"
        placeholder={agreementFile?.name ?? "Choose a file"}
        buttonText="Browse"
        acceptedFileTypes={["application/pdf", "image/png", "image/jpeg"]}
        hint={fileError || "PDF, PNG, JPG (max. 2mb)"}
        isInvalid={!!fileError}
        isLoading={isReadingFile}
        onChange={(files) => {
          const file = files?.[0];
          if (!file) return;
          if (file.size > MAX_AGREEMENT_FILE_BYTES) {
            setFileError(`"${file.name}" is over 2MB - choose a smaller file.`);
            setAgreementFile(null);
            return;
          }
          setFileError("");
          setIsReadingFile(true);
          readAgreementFile(file)
            .then(setAgreementFile)
            .catch(() => setFileError(`Couldn't read "${file.name}" - try again.`))
            .finally(() => setIsReadingFile(false));
        }}
      />
      <Checkbox label="Custom DLA" hint={isCustom ? undefined : "This is a custom DLA…"} isSelected={isCustom} onChange={setIsCustom} />
      {isCustom && <TextArea placeholder="Describe what makes this DLA custom" rows={2} value={customNote} onChange={setCustomNote} />}
    </FormModal>
  );
}

export function DlaDetail({
  dla,
  onEdit,
  onDeleteDraft,
  onStartReview,
  onHold,
  onResume,
  onApprove,
  onReject,
  onCancel,
  onAddLocation,
}: {
  dla: Dla;
  onEdit: () => void;
  onDeleteDraft: () => void;
  onStartReview: () => void;
  onHold: () => void;
  onResume: () => void;
  onApprove: (input: DlaApproveInput) => void;
  onReject: (reason: string) => void;
  onCancel: () => void;
  onAddLocation: (location: DlaLocation) => void;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const canApprove = useFeatureAccess("dlaApproval");
  const [tab, setTab] = useState<Key>("overview");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<null | "cancel" | "delete">(null);
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const meta = dlaStatusMeta[dla.status];
  const isDraft = dla.status === "draft";
  // Every action below is a direct toolbar button, always visible - the reviewer-only ones
  // (Start Review/Hold/Resume/Approve/Reject) stay gated behind `dlaApproval`, same as before;
  // Edit/Cancel are the requester's own capabilities, gated by whatever got this component to
  // render at all (`dlaAccess`, checked by DlaShell). "For active requests only cancel option can
  // be used" (agreement-status.ts) - Edit stops once a request is Approved, not just Active: an
  // Approved request's level is already a decision, so reopening the form can't be how a granted
  // Level 2 quietly becomes Level 3 (isDlaEditable, dla-data.ts).
  const canEdit = isDlaEditable(dla.status);
  // A granted location's own level (Approved and Active both - a Closed one already has its own
  // Renew Licence banner) is locked; LocationCard says so and points at a new request instead.
  const locationLevelsLocked = dla.status === "approved" || dla.status === "active";
  const canCancel = dla.status !== "closed" && dla.status !== "rejected" && dla.status !== "cancelled";
  const showAgreement = dla.status === "active" || dla.status === "closed";
  const isPendingReview = dla.status === "under_review" && canApprove;

  // One primary (the next workflow step), the natural alternative beside it, everything else in the
  // "More actions" menu (RecordActionBar). A requester with no workflow step still sees Edit.
  const isReviewer = canApprove && (dla.status === "submitted" || dla.status === "under_review" || dla.status === "on_hold");
  const editAction: RecordAction = { id: "edit", label: isDraft ? "Edit draft" : "Edit request", icon: Edit05, onPress: onEdit };
  const actions: { primary?: RecordAction; secondary: RecordAction[]; menu: RecordAction[] } = { secondary: [], menu: [] };
  if (isDraft) actions.primary = editAction;
  else if (dla.status === "submitted" && canApprove) actions.primary = { id: "start", label: "Start review", icon: PlayCircle, onPress: onStartReview };
  else if (dla.status === "under_review" && canApprove) actions.primary = { id: "approve", label: "Approve", icon: CheckCircle, onPress: () => setApproveOpen(true) };
  else if (dla.status === "on_hold" && canApprove) actions.primary = { id: "resume", label: "Resume review", icon: PlayCircle, onPress: onResume };
  if (showAgreement)
    actions.secondary.push({
      id: "download",
      label: "Download PDF",
      icon: Download01,
      isDisabled: !dla.agreementFile,
      onPress: () => dla.agreementFile && downloadAgreementFile(dla.agreementFile),
    });
  if (dla.status === "under_review" && canApprove) actions.secondary.push({ id: "reject", label: "Reject", icon: XCircle, onPress: () => setRejectOpen(true) });
  if (canEdit && !isDraft) (isReviewer ? actions.menu : actions.secondary).push(editAction);
  if (dla.status === "under_review" && canApprove) actions.menu.unshift({ id: "hold", label: "Put on hold", icon: PauseCircle, onPress: onHold });
  if (isDraft) actions.menu.push({ id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setCancelConfirm("delete") });
  if (canCancel && !isDraft) actions.menu.push({ id: "cancel", label: "Cancel request", icon: SlashCircle01, destructive: true, onPress: () => setCancelConfirm("cancel") });

  // The gradient card's own "Agreement Period" never just says "Not set" for a request that
  // hasn't been granted yet - it falls back to what was actually requested, labelled as such, so
  // the one glance-able summary at the top doesn't read as a data gap when the requester did in
  // fact specify a period. The Request Details card below still shows the requested period as its
  // own field, in full, once the reader gets there.
  const periodSummary = dla.validFrom && dla.validTo
    ? `${formatShortDate(dla.validFrom)} to ${formatShortDate(dla.validTo)}`
    : dla.requestPeriodFrom && dla.requestPeriodTo
      ? `${formatShortDate(dla.requestPeriodFrom)} to ${formatShortDate(dla.requestPeriodTo)} (requested)`
      : "Not set";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Laid out like the project page: a Back link, then the identity card with the actions at its
          top right (the next step as a button, the rest in "..."), always in view. */}
      <RecordBackLink href={roleHref("/pages/dla")}>Back to requests</RecordBackLink>

      <RecordHero eyebrow="Data Licencing Agreement" title={dla.id} actions={<RecordActionBar onDark {...actions} />}>
        <MetaField onDark label="Requestor">
          {dla.requestor.organisation || "Not provided"}
        </MetaField>
        <MetaField onDark label="Agreement Period">
          {periodSummary}
        </MetaField>
        <MetaField onDark label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </MetaField>
      </RecordHero>

      {/* Neutral statements of fact, not addressed to "you" - this page is read by both the
          requester and (for Under Review) the admin who's about to act on it, and copy written in
          the requester's voice ("you'll be contacted") doesn't make sense for the latter. The
          decision itself is the card's Approve/Reject, not a banner telling the reader to wait; a
          reviewer gets no Under Review banner, since the badge and the card's actions already say it. */}
      <div className="shrink-0 px-6 pt-4 empty:hidden">
        {dla.status === "under_review" && !isPendingReview && (
          <AlertFullWidth
            color="warning"
            title="Under review"
            description="This request is being assessed. The requester will be notified once a decision is made."
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {dla.status === "on_hold" && (
          <AlertFullWidth
            color="warning"
            title="On hold"
            description={canApprove ? "This review is paused pending information from the requester. Resume once you have what you need." : "This request is on hold pending further information. You'll be notified once the review resumes."}
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {dla.status === "rejected" && (
          <AlertFullWidth
            color="error"
            title="Rejected"
            description={dla.rejectionReason || "No reason was provided."}
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {dla.status === "cancelled" && (
          <AlertFullWidth
            color="gray"
            title="Cancelled"
            description="This request was cancelled and is no longer active."
            confirmLabel="Noted"
            contained
            wrap
          />
        )}
        {dla.status === "closed" && (
          <AlertFullWidth
            color="gray"
            title="Closed"
            description={dla.validTo ? `This agreement closed on ${formatShortDate(dla.validTo)}. Renew to continue accessing its data locations.` : "This agreement is closed. Renew to continue accessing its data locations."}
            confirmLabel="Renew licence"
            onConfirm={() => router.push(roleHref(`/pages/dla/new?renewFrom=${dla.id}`))}
            contained
            wrap
          />
        )}
      </div>

      {/* Real Tabs, matching project-detail's/DSA's own ContentTabs treatment exactly (`type=
          "underline" size="md"`) instead of a flat stack of same-weight cards - progressive
          disclosure per one concern per tab, per CONTEXT.md's cognitive-load principles. Reading
          order: Overview (who/why/how-long) first, Locations & Access (what's being asked for)
          second, Agreement (the actual outcome) last, only once one exists. */}
      <Tabs selectedKey={tab} onSelectionChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Request sections" type="underline" size="md">
            <Tab id="overview" label="Overview" icon={Grid01} />
            <Tab id="locations" label="Locations & Access" icon={MarkerPin04} />
            {showAgreement && <Tab id="agreement" label="Agreement" icon={FileCheck02} />}
            <Tab id="audit" label="Audit Log" icon={ClockRewind} />
          </TabList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <TabPanel id="overview">
            <div className="flex flex-col rounded-lg border border-secondary">
              <div className="flex flex-col gap-2 border-b border-secondary p-6">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Purpose of Data Use</p>
                <p className={cx("text-sm", dla.purpose ? "text-secondary" : "text-quaternary")}>{dla.purpose || "Not provided"}</p>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-secondary p-6">
                <span className="text-sm text-tertiary">Requested Agreement Period</span>
                <span className="text-sm font-medium text-primary">
                  {dla.requestPeriodFrom && dla.requestPeriodTo ? `${formatShortDate(dla.requestPeriodFrom)} to ${formatShortDate(dla.requestPeriodTo)}` : <NotProvided />}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-6">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Data Requestor</p>
                <RequestorFields requestor={dla.requestor} />
              </div>
            </div>
          </TabPanel>

          <TabPanel id="locations">
            <div className="flex flex-col rounded-lg border border-secondary">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary p-6">
                <h2 className="text-sm font-semibold text-primary">Data Locations &amp; License Categories</h2>
                {dla.status === "active" && (
                  <Button color="secondary" size="sm" iconLeading={Plus} onPress={() => setAddLocationOpen(true)}>
                    Add location
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-4 p-6">
                {dla.locations.length === 0 ? (
                  <NotProvided />
                ) : (
                  <div className="flex flex-col gap-4">
                    {dla.locations.map((location, index) => (
                      <LocationCard key={location.id} location={location} index={index} locked={locationLevelsLocked} newRequestHref={roleHref("/pages/dla/new")} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabPanel>

          {showAgreement && (
            <TabPanel id="agreement">
              <div className="flex flex-col rounded-lg border border-secondary">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-secondary p-6">
                  <span className="text-sm text-tertiary">Agreement Grant Period</span>
                  <span className="text-sm font-medium text-primary">
                    {dla.validFrom && dla.validTo ? `${formatShortDate(dla.validFrom)} - ${formatShortDate(dla.validTo)}` : <NotProvided />}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-6">
                  <span className="text-sm text-tertiary">Signed agreement</span>
                  <span className={cx("text-sm font-medium", dla.agreementFile ? "text-primary" : "text-quaternary")}>{dla.agreementFile?.name ?? "Not provided"}</span>
                </div>
              </div>
            </TabPanel>
          )}

          <TabPanel id="audit">
            <AuditLog events={dla.history} statusMeta={dlaStatusMeta} noun="request" />
          </TabPanel>
        </div>
      </Tabs>

      <ApproveModal dla={dla} isOpen={approveOpen} onOpenChange={setApproveOpen} onApprove={(input) => { onApprove(input); setApproveOpen(false); }} />
      <RejectModal id={dla.id} isOpen={rejectOpen} onOpenChange={setRejectOpen} onReject={(reason) => { onReject(reason); setRejectOpen(false); }} />
      <AddLocationModal isOpen={addLocationOpen} onOpenChange={setAddLocationOpen} onAdd={onAddLocation} />

      <DestructiveModal confirmIcon={cancelConfirm === "delete" ? Trash01 : SlashCircle01}
        isOpen={cancelConfirm !== null}
        onOpenChange={(open) => !open && setCancelConfirm(null)}
        title={cancelConfirm === "delete" ? `Delete draft ${dla.id}?` : `Cancel ${dla.id}?`}
        description={
          cancelConfirm === "delete"
            ? "The draft is removed and can't be recovered."
            : "This request or agreement moves to Cancelled and can't be reversed here."
        }
        confirmLabel={cancelConfirm === "delete" ? "Delete draft" : "Cancel request"}
        onConfirm={() => {
          const action = cancelConfirm;
          setCancelConfirm(null);
          if (action === "delete") onDeleteDraft();
          else onCancel();
        }}
      />
    </div>
  );
}

const emptyCopy: Record<DlaStatus, { title: string; description: string; cta: boolean }> = {
  draft: { title: "No drafts", description: "Requests you save as a draft appear here until they are submitted.", cta: true },
  submitted: { title: "No submitted requests", description: "Requests waiting for a reviewer to start their review appear here.", cta: true },
  under_review: {
    title: "No Active DLA Requests",
    description: "There are currently no Data Licensing Agreement associated with your account. Create a new request to seek approval for access to licensed data. You will be able to track the status of your request once submitted.",
    cta: true,
  },
  on_hold: { title: "No requests on hold", description: "Requests paused pending information from the requester appear here.", cta: false },
  approved: { title: "No approved requests", description: "Requests approved and waiting on their own start date appear here.", cta: false },
  rejected: { title: "No rejected requests", description: "Requests that weren't approved appear here.", cta: false },
  active: { title: "No active agreements", description: "There are currently no active Data Licensing Agreements.", cta: false },
  closed: { title: "No closed agreements", description: "Agreements that have run their course, automatically or manually, appear here.", cta: false },
  cancelled: { title: "No cancelled requests", description: "Requests or agreements cancelled by the requester or an admin appear here.", cta: false },
};

// Wireframe frame "No DLAs Yet" (Figma YMproGZfrFB5jUqPHPxMhk node 33:43259) - its concentric-ring
// backdrop is a decorative graphic with no asset in this repo, left out rather than redrawn, same
// precedent as DSA's own empty state.
export function DlaEmptyState({ status, newHref }: { status: DlaStatus; newHref: string }) {
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
        <Button iconLeading={Plus} color="primary" href={newHref}>
          Request DLA
        </Button>
      )}
    </div>
  );
}

// Requests live in module state (see dla-store.ts), so a full reload on a request created this
// session lands here rather than on a blank page.
export function DlaNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Request not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">
        There is no request {id}. It may have been deleted, or created in another browser.
      </p>
      <Button color="link-color" size="sm" href={roleHref("/pages/dla")} iconLeading={ArrowNarrowLeft}>
        Back to requests
      </Button>
    </div>
  );
}
