"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { ArrowNarrowLeft, Download01, Plus, SearchLg } from "@untitledui/icons";
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
import { toast } from "@/components/application/toast/toast";
import { AddLocationModal } from "@/app/pages/_shared/dla/add-location-modal";
import {
  dlaLevel3Projects,
  dlaLevelMeta,
  dlaLocationMethodLabel,
  dlaStatusMeta,
  formatShortDate,
  requestorName,
  type Dla,
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
// wireframe's own flat two-pane layout or a same-weight card stack. See CONTEXT.md, "Data
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

function LocationCard({ location, index }: { location: DlaLocation; index: number }) {
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

function ApproveModal({ dla, isOpen, onOpenChange, onApprove }: { dla: Dla; isOpen: boolean; onOpenChange: (open: boolean) => void; onApprove: (input: DlaApproveInput) => void }) {
  const [validFrom, setValidFrom] = useState(dla.requestPeriodFrom);
  const [validTo, setValidTo] = useState(dla.requestPeriodTo);
  const [agreementFile, setAgreementFile] = useState<{ name: string } | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customNote, setCustomNote] = useState("");

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Approve Request"
      description="Set the agreement period and approve this request"
      submitLabel="Upload and Approve"
      size="sm"
      onSubmit={() => onApprove({ validFrom, validTo, agreementFile, isCustom, customNote })}
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
        hint="PDF, PNG, JPG (max. 2mb)"
        onChange={(files) => {
          const file = files?.[0];
          if (file) setAgreementFile({ name: file.name });
        }}
      />
      <Checkbox label="Custom DLA" hint={isCustom ? undefined : "This is a custom DLA…"} isSelected={isCustom} onChange={setIsCustom} />
      {isCustom && <TextArea placeholder="Describe what makes this DLA custom" rows={2} value={customNote} onChange={setCustomNote} />}
    </FormModal>
  );
}

function RejectModal({ dla, isOpen, onOpenChange, onReject }: { dla: Dla; isOpen: boolean; onOpenChange: (open: boolean) => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setReason("");
          setAttempted(false);
        }
        onOpenChange(open);
      }}
      title="Reject Request"
      description={`Provide a reason for rejecting ${dla.id}`}
      submitLabel="Confirm Rejection"
      size="sm"
      onSubmit={() => {
        setAttempted(true);
        if (!reason.trim()) return;
        onReject(reason.trim());
      }}
    >
      <TextArea
        label="Rejection Reason"
        isRequired
        rows={3}
        placeholder="Enter a description…"
        value={reason}
        onChange={setReason}
        isInvalid={attempted && !reason.trim()}
        hint={attempted && !reason.trim() ? "A reason is required." : undefined}
      />
    </FormModal>
  );
}

export function DlaDetail({
  dla,
  onApprove,
  onReject,
  onWithdraw,
  onAddLocation,
}: {
  dla: Dla;
  onApprove: (input: DlaApproveInput) => void;
  onReject: (reason: string) => void;
  onWithdraw: () => void;
  onAddLocation: (location: DlaLocation) => void;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const canApprove = useFeatureAccess("dlaApproval");
  const [tab, setTab] = useState<Key>("overview");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const meta = dlaStatusMeta[dla.status];
  const canWithdraw = dla.status === "active" || dla.status === "under_review";
  const showAgreement = dla.status === "active" || dla.status === "expired";
  const isPendingReview = dla.status === "under_review" && canApprove;

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
      {/* Every action this page can take lives here, always visible, never behind a scroll - an
          admin's whole reason for opening an Under Review request is to decide on it, so Approve/
          Reject sit right where the identity card is, not after everything else on the page. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <Button color="link-gray" size="sm" iconLeading={ArrowNarrowLeft} href={roleHref(`/pages/dla?status=${dla.status}`)}>
          Back to requests
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {showAgreement && (
            <Button
              color="secondary"
              iconLeading={Download01}
              isDisabled={!dla.agreementFile}
              onPress={() =>
                toast.brand("Download isn't wired up yet", {
                  description: "Agreement files aren't stored in this preview, so there is no file to download.",
                })
              }
            >
              Download PDF
            </Button>
          )}
          {canWithdraw && (
            <Button color={isPendingReview ? "link-destructive" : "secondary-destructive"} onPress={() => setWithdrawOpen(true)}>
              Withdraw
            </Button>
          )}
          {isPendingReview && (
            <>
              <Button color="secondary-destructive" onPress={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button color="primary" onPress={() => setApproveOpen(true)}>
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 px-6 pt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">Data Licencing Agreement</p>
            <h1 className="text-2xl font-medium text-white">{dla.id}</h1>
          </div>
          <div className="flex flex-wrap items-start gap-8">
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
          </div>
        </div>
      </div>

      {/* Neutral statements of fact, not addressed to "you" - this page is read by both the
          requester and (for Under Review) the admin who's about to act on it, and copy written in
          the requester's voice ("you'll be contacted") doesn't make sense for the latter. The
          decision itself is the toolbar's Approve/Reject, not a banner telling the reader to wait. */}
      <div className="shrink-0 px-6 pt-4">
        {dla.status === "under_review" && (
          <AlertFullWidth
            color="warning"
            title="Under Review"
            description={isPendingReview ? "This request needs a decision - see Approve/Reject above." : "This request is being assessed. The requester will be notified once a decision is made."}
            confirmLabel="Noted"
            className="max-w-none rounded-lg border border-warning-200 px-4 py-3 md:px-4"
          />
        )}
        {dla.status === "rejected" && (
          <AlertFullWidth
            color="error"
            title="Request Rejected"
            description={dla.rejectionReason || "No reason was provided."}
            confirmLabel="Noted"
            className="max-w-none rounded-lg border border-error-200 px-4 py-3 md:px-4"
          />
        )}
        {dla.status === "withdrawn" && (
          <AlertFullWidth
            color="gray"
            title="Withdrawn"
            description="This request was withdrawn and is no longer active."
            confirmLabel="Noted"
            className="max-w-none rounded-lg border border-secondary px-4 py-3 md:px-4"
          />
        )}
        {dla.status === "expired" && (
          <AlertFullWidth
            color="warning"
            title="Licence Expired"
            description={`This agreement expired on ${formatShortDate(dla.validTo)}. Renew to continue accessing its data locations.`}
            confirmLabel="Renew Licence"
            onConfirm={() => router.push(roleHref(`/pages/dla/new?renewFrom=${dla.id}`))}
            className="max-w-none rounded-lg border border-warning-200 px-4 py-3 md:px-4"
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
          <TabList aria-label="Request sections" type="underline" size="md" className="gap-6">
            <Tab id="overview" label="Overview" />
            <Tab id="locations" label="Locations & Access" />
            {showAgreement && <Tab id="agreement" label="Agreement" />}
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
                    Add Location
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-4 p-6">
                {dla.locations.length === 0 ? (
                  <NotProvided />
                ) : (
                  <div className="flex flex-col gap-4">
                    {dla.locations.map((location, index) => (
                      <LocationCard key={location.id} location={location} index={index} />
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
        </div>
      </Tabs>

      <ApproveModal dla={dla} isOpen={approveOpen} onOpenChange={setApproveOpen} onApprove={(input) => { onApprove(input); setApproveOpen(false); }} />
      <RejectModal dla={dla} isOpen={rejectOpen} onOpenChange={setRejectOpen} onReject={(reason) => { onReject(reason); setRejectOpen(false); }} />
      <AddLocationModal isOpen={addLocationOpen} onOpenChange={setAddLocationOpen} onAdd={onAddLocation} />

      <DestructiveModal
        isOpen={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title={`Withdraw ${dla.id}?`}
        description="This request or agreement moves to Withdrawn and can't be reversed here."
        confirmLabel="Withdraw"
        onConfirm={() => {
          setWithdrawOpen(false);
          onWithdraw();
        }}
      />
    </div>
  );
}

const emptyCopy: Record<DlaStatus, { title: string; description: string; cta: boolean }> = {
  active: { title: "No active agreements", description: "There are currently no active Data Licensing Agreements.", cta: false },
  under_review: {
    title: "No Active DLA Requests",
    description: "There are currently no Data Licensing Agreement associated with your account. Create a new request to seek approval for access to licensed data. You will be able to track the status of your request once submitted.",
    cta: true,
  },
  rejected: { title: "No rejected requests", description: "Requests that weren't approved appear here.", cta: false },
  expired: { title: "No expired agreements", description: "Agreements past their grant period appear here.", cta: false },
  withdrawn: { title: "No withdrawn requests", description: "Requests or agreements you withdraw appear here.", cta: false },
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
        <Button color="primary" href={newHref}>
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
      <h1 className="text-lg font-medium text-primary">Request not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">
        There is no request {id}. In this preview, requests you create are kept only until the page is reloaded.
      </p>
      <Button color="link-color" size="sm" href={roleHref("/pages/dla")} iconLeading={ArrowNarrowLeft}>
        Back to requests
      </Button>
    </div>
  );
}
