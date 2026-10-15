"use client";

import { useState } from "react";
import { Tabs as ContentTabs, type Key } from "react-aria-components";
import { CheckCircle, ClockRewind, Edit05, File06, MessageAlertCircle, PlayCircle, Trash01, XCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { RejectModal } from "@/app/pages/_shared/agreement-modals";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { AuditFeed } from "@/app/pages/_shared/audit-feed";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { ProtectionView } from "@/app/pages/_shared/nominations/nomination-protection";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { formatShortDate, kindOf, nominationStatusMeta, nominationSubject, speciesFor, type Nomination } from "@/app/pages/_shared/nominations/nomination-data";
import { RiskBadge } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { accessLevelMeta, nominationRatingKeys, ratingKeyLabel } from "@/app/pages/_shared/nominations/nomination-rating";
import { setNominationRating, useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useNominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";

// Version 3 of a nomination's page (the designer, 12 Oct 2026), rebuilt from the audit of what each person opens it for: the
// nominator (where is it, is anything waiting on me), the reviewer (is the case sound; accept, return or reject) and the Super
// Admin (how sensitive is each thing protected, who may see it, what is already protected). A nomination reads as one sentence,
// "this species or place, these details hidden, for this reason, at this stage", so the page keeps that sentence together:
// - The card: what it is and its status. Its actions are the record's own (edit, delete); the review decisions are below.
// - Where it stands was a panel under the card (steps, the panel's note, the three decisions). Removed on 14 Oct 2026 (the
//   designer: "the status card and the species card and the image on the right is not needed"): the status is the card's badge,
//   the timeline is History, and the decisions are the card's actions again as 4.6 has them (Start review, or Accept with Return
//   and Reject in "..."). Only a note the panel wrote is shown, as one notice under the card. Pressing Accept with ratings
//   missing shows "Ratings missing" over the table, as version 2 does.
// - Two tabs, Nomination and History. Nomination: "Already protected" (what earlier accepted nominations of the species
//   protect, for both admin roles, only when there is something), then what this nomination protects (`ProtectionView`,
//   nomination-protection.tsx, 14 Oct 2026: a summary, then one card per reason listing the items it covers, each with its
//   rating, set in place by an admin while under review), and no nominator's email (removed 14 Oct 2026). Audit history is the shared audit summary, as on version 2 (14 Oct 2026). The old
//   Overview went: the card already holds its facts.
// - One name, Protection: no "What to protect", "Data release" or "Current rating" headings, and no form helper text.

type Decision = null | "accept" | "delete";

export function NominationRecordV3({
  nomination,
  onEdit,
  onDelete,
  onStartReview,
  onAccept,
  onReject,
  onReturn,
}: {
  nomination: Nomination;
  onEdit: () => void;
  onDelete: () => void;
  onStartReview: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onReturn: (note: string) => void;
}) {
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();
  const all = useNominations();
  const canReview = useFeatureAccess("nominationReview");
  const canRate = useFeatureAccess("nominationRating");
  const [confirm, setConfirm] = useState<Decision>(null);
  const [tab, setTab] = useState<Key>("nomination");
  const [tried, setTried] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const n = nomination;
  const kind = kindOf(n);
  const name = nominationSubject(n);
  const species = speciesFor(n.speciesId);
  const meta = nominationStatusMeta[n.status];
  const isOwner = n.nominator.name === CURRENT_USER_NAME;
  const submittedAt = n.history.find((e) => e.status === "submitted")?.at;

  const ratings = n.ratings ?? {};
  const keys = nominationRatingKeys(n);
  const ratingInPlace = canRate && n.status === "under_review";
  const unrated = ratingInPlace ? keys.filter((k) => !ratings[k]) : [];

  // ── The card's actions: the record's own. The review decisions live in the panel below. ──
  const actions: { primary?: RecordAction; secondary: RecordAction[]; menu: RecordAction[] } = { secondary: [], menu: [] };
  if (isOwner && n.status === "draft") {
    actions.primary = { id: "edit", label: "Edit draft", icon: Edit05, onPress: onEdit };
    actions.menu.push({ id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setConfirm("delete") });
  }
  if (isOwner && n.status === "submitted") actions.primary = { id: "edit", label: "Edit nomination", icon: Edit05, onPress: onEdit };
  if (isOwner && n.status === "returned") actions.primary = { id: "update", label: "Update and resubmit", icon: Edit05, onPress: onEdit };
  const ownEdit = isOwner && ["draft", "submitted", "returned"].includes(n.status);
  const accept = () => {
    if (unrated.length === 0) return setConfirm("accept");
    setTried(true);
    setTab("nomination");
  };
  // The panel's next step is the card's one button, as on every record page (4.6); the admin's edit waits in "..." meanwhile.
  if (canReview && n.status === "submitted") actions.primary = { id: "start", label: "Start review", icon: PlayCircle, onPress: onStartReview };
  if (canReview && n.status === "under_review") {
    actions.primary = { id: "accept", label: "Accept", icon: CheckCircle, onPress: accept };
    actions.menu.push({ id: "return", label: "Return for more information", icon: MessageAlertCircle, onPress: () => setReturnOpen(true) });
  }
  const panelActs = canReview && (n.status === "submitted" || n.status === "under_review");
  if (canReview && n.status !== "draft" && !ownEdit) {
    const edit: RecordAction = { id: "edit", label: "Edit nomination", icon: Edit05, onPress: onEdit };
    if (panelActs) actions.menu.push(edit);
    else actions.primary = edit;
  }
  if (canReview && n.status === "under_review") actions.menu.push({ id: "reject", label: "Reject", icon: XCircle, destructive: true, onPress: () => setRejectOpen(true) });

  // Data release risk and user access level are for the BioData Admin and Super Admin only (the designer, 14 Oct 2026: "strictly
  // only for biodata admin and super admin"), whatever the status: no one else sees the columns, accepted or not.
  const showRatings = canRate;

  // What earlier accepted nominations of the same species protect: context for the panel, never this nomination's own rating.
  const earlier =
    canRate && kind === "species"
      ? all.filter((o) => o.id !== n.id && kindOf(o) === "species" && o.speciesId === n.speciesId && o.status === "accepted" && o.ratings && Object.keys(o.ratings).length > 0)
      : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref(base)}>Back to nominations</RecordBackLink>

      <RecordHero
        eyebrow={kind === "location" ? "Sensitive location nomination" : "Sensitive species nomination"}
        title={name}
        subtitle={species ? <span className="italic">{species.species}</span> : undefined}
        actions={<RecordActionBar onDark {...actions} />}
      >
        <HeroMeta label="Nomination">{n.id}</HeroMeta>
        <HeroMeta label="Nominated by">{n.nominator.organisation ? `${n.nominator.name}, ${n.nominator.organisation}` : n.nominator.name}</HeroMeta>
        <HeroMeta label="Submitted">{submittedAt ? formatShortDate(submittedAt) : "Not submitted"}</HeroMeta>
        <HeroMeta label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </HeroMeta>
      </RecordHero>

      {/* Where it stands is the card's status badge; the History tab has the timeline. Only words the panel wrote are shown here. */}
      {n.decisionNote && (n.status === "returned" || n.status === "accepted" || n.status === "rejected") && (
        <div className="shrink-0 px-6 pt-4">
          <AlertFullWidth
            color={n.status === "returned" ? "warning" : n.status === "rejected" ? "error" : "success"}
            title={n.status === "returned" ? `What the panel needs from ${isOwner ? "you" : n.nominator.name}` : "The panel's note"}
            description={n.decisionNote}
            confirmLabel=""
            contained
            wrap
          />
        </div>
      )}

      <ContentTabs selectedKey={tab} onSelectionChange={setTab} className="flex flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Nomination sections" type="underline" size="md">
            <Tab id="nomination" label="Nomination" icon={File06} />
            <Tab id="history" label="Audit history" icon={ClockRewind} />
          </TabList>
        </div>

        <TabPanel id="nomination" className="flex flex-col gap-6 p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {earlier.length > 0 && (
              <div className="rounded-lg border border-secondary">
                <RecordRow label="Already protected">
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {earlier.flatMap((o) =>
                      nominationRatingKeys(o)
                        .filter((k) => o.ratings?.[k])
                        .map((k) => {
                          const r = o.ratings![k];
                            return (
                            <li key={`${o.id}-${k}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>{ratingKeyLabel(o, k)}</span>
                              <RiskBadge risk={r.risk} />
                              <span className="text-tertiary">{accessLevelMeta[r.access].label}</span>
                              <Button color="link-color" size="sm" href={roleHref(`${base}/${o.id}`)}>
                                {o.id}
                              </Button>
                            </li>
                          );
                        }),
                    )}
                  </ul>
                </RecordRow>
              </div>
            )}
            {tried && unrated.length > 0 && (
              <AlertFullWidth
                color="error"
                title="Ratings missing"
                description={`Set a data release risk for each before accepting. ${keys.length - unrated.length} of ${keys.length} rated.`}
                confirmLabel=""
                contained
                wrap
              />
            )}
            <ProtectionView
              nomination={n}
              showRatings={showRatings}
              rate={ratingInPlace ? { onChange: (key, rating) => setNominationRating(n.id, key, rating), showErrors: tried } : undefined}
            />
          </div>
        </TabPanel>

        <TabPanel id="history" className="p-6">
          <AuditLog id={n.id} idLabel="Nomination ID" items={milestones(n.history, { label: "Decided", is: (e) => e.status === "accepted" || e.status === "rejected" }, { created: n.createdAt, updated: n.updatedAt })} changeCount={n.history.length}>
            <AuditFeed events={n.history} statusMeta={nominationStatusMeta} noun="nomination" />
          </AuditLog>
        </TabPanel>
      </ContentTabs>

      <ConfirmationModal
        confirmIcon={CheckCircle}
        isOpen={confirm === "accept"}
        onOpenChange={(open) => !open && setConfirm(null)}
        icon={CheckCircle}
        iconColor="success"
        title={`Accept ${n.id}?`}
        description={
          ratingInPlace
            ? `This protects ${name} with the ratings you set, and tells ${n.nominator.name}.`
            : `This records the panel's decision to protect ${name} as nominated, and tells ${n.nominator.name}.`
        }
        confirmLabel="Accept nomination"
        onConfirm={() => {
          setConfirm(null);
          onAccept();
        }}
      />
      <DestructiveModal
        confirmIcon={Trash01}
        isOpen={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Delete draft ${n.id}?`}
        description="The draft is removed and can't be recovered."
        confirmLabel="Delete draft"
        onConfirm={() => {
          setConfirm(null);
          onDelete();
        }}
      />
      <RejectModal
        id={n.id}
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject nomination"
        description={`Tell ${n.nominator.name} why ${name} won't be protected.`}
        submitLabel="Reject nomination"
        fieldLabel="Reason"
        onReject={(reason) => {
          onReject(reason);
          setRejectOpen(false);
        }}
      />
      <RejectModal
        id={n.id}
        isOpen={returnOpen}
        onOpenChange={setReturnOpen}
        icon={MessageAlertCircle}
        iconColor="warning"
        submitIcon={MessageAlertCircle}
        title="Return for more information"
        description={`${n.nominator.name} can update the nomination and submit it again.`}
        submitLabel="Return nomination"
        fieldLabel="What do you need from the nominator?"
        placeholder="For example, which populations are affected…"
        onReject={(note) => {
          onReturn(note);
          setReturnOpen(false);
        }}
      />
    </div>
  );
}
