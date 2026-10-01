"use client";

import { useState } from "react";
import { Tabs as ContentTabs } from "react-aria-components";
import { ArrowNarrowLeft, CheckCircle, Edit05, MessageAlertCircle, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { RejectModal } from "@/app/pages/_shared/agreement-modals";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { SpeciesPhotoCarousel } from "@/app/pages/_shared/map-search/species-photo-carousel";
import { AreaList, AreasMap } from "@/app/pages/_shared/nominations/nomination-areas";
import { attributeLabel, attributeValueLabel, formatShortDate, nominationStatusMeta, protectionMeta, speciesFor, type Nomination } from "@/app/pages/_shared/nominations/nomination-data";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";

// A nomination's own page, laid out like the project page (every record page follows it): a Back
// link, the gradient identity card with the actions at its top right (one white button, the rest in
// "..."), a notice saying where it stands and who acts next, then tabs of label/value rows:
// Overview, What to protect, Audit history.

export function NominationDetail({
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
  const canReview = useFeatureAccess("nominationReview");
  const [confirm, setConfirm] = useState<null | "accept" | "delete">(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const n = nomination;
  const species = speciesFor(n.speciesId);
  const meta = nominationStatusMeta[n.status];
  const isOwner = n.nominator.name === CURRENT_USER_NAME;
  const name = species?.commonName ?? n.speciesId;
  const photo = species ? speciesImage(species.species) : undefined;
  const submittedAt = n.history.find((e) => e.status === "submitted")?.at;

  // One primary (the next step for whoever is looking), the natural alternative beside it, the rest
  // in "More actions" with the destructive ones set apart (RecordActionBar).
  const actions: { primary?: RecordAction; secondary: RecordAction[]; menu: RecordAction[] } = { secondary: [], menu: [] };
  if (canReview && n.status === "submitted") actions.primary = { id: "start", label: "Start review", onPress: onStartReview };
  if (canReview && n.status === "under_review") {
    actions.primary = { id: "accept", label: "Accept", icon: CheckCircle, onPress: () => setConfirm("accept") };
    actions.secondary.push({ id: "return", label: "Return for more information", icon: MessageAlertCircle, onPress: () => setReturnOpen(true) });
    actions.secondary.push({ id: "reject", label: "Reject", onPress: () => setRejectOpen(true) });
  }
  if (isOwner && n.status === "draft") {
    actions.primary = { id: "edit", label: "Edit draft", icon: Edit05, onPress: onEdit };
    actions.menu.push({ id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setConfirm("delete") });
  }
  if (isOwner && n.status === "submitted") (actions.primary ? actions.menu : actions.secondary).push({ id: "edit", label: "Edit nomination", icon: Edit05, onPress: onEdit });
  if (isOwner && n.status === "returned") actions.primary = { id: "update", label: "Update and resubmit", icon: Edit05, onPress: onEdit };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref("/pages/nominations")}>Back to nominations</RecordBackLink>

      <RecordHero
        eyebrow="Sensitive species nomination"
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

      {/* Where it stands and who acts next, for the nominator. The panel gets no banner while the
          next step is theirs: the status badge and the action on the card already say it, and a
          banner would restate them. Decisions (returned, accepted, rejected) carry the panel's note,
          so everyone sees those. */}
      <div className="shrink-0 px-6 pt-4 empty:hidden">
        {n.status === "draft" && (
          <AlertFullWidth color="gray" title="Draft" description="Not submitted yet. Only the nominator can see it." confirmLabel="" contained wrap />
        )}
        {n.status === "submitted" && !canReview && (
          <AlertFullWidth
            color="brand"
            title="Waiting for review"
            description="The sensitive species panel will pick it up. It can still be edited until the review starts."
            confirmLabel=""
            contained
            wrap
          />
        )}
        {n.status === "under_review" && !canReview && (
          <AlertFullWidth
            color="warning"
            title="Under review"
            description="The sensitive species panel is reviewing it. The nominator is told when there is a decision."
            confirmLabel=""
            contained
            wrap
          />
        )}
        {n.status === "returned" && (
          <AlertFullWidth
            color="warning"
            title="Returned for more information"
            description={n.decisionNote || "The panel returned it without a note."}
            confirmLabel=""
            contained
            wrap
          />
        )}
        {n.status === "accepted" && (
          <AlertFullWidth
            color="success"
            title="Accepted"
            description={n.decisionNote || "The panel accepted this nomination."}
            confirmLabel=""
            contained
            wrap
          />
        )}
        {n.status === "rejected" && (
          <AlertFullWidth color="error" title="Rejected" description={n.decisionNote || "The panel gave no reason."} confirmLabel="" contained wrap />
        )}
      </div>

      <ContentTabs defaultSelectedKey="overview" className="flex flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Nomination sections" type="underline" size="md">
            <Tab id="overview" label="Overview" />
            <Tab id="protection" label="What to protect" />
            <Tab id="history" label="Audit history" />
          </TabList>
        </div>

        <TabPanel id="overview" className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-lg border border-secondary">
            <RecordRow label="Species">
              {species ? (
                <span className="flex flex-col">
                  <span>{species.commonName}</span>
                  <span className="text-tertiary italic">{species.species}</span>
                  <span className="text-xs text-tertiary">
                    {species.family} · {species.group}
                  </span>
                </span>
              ) : (
                <span className="text-tertiary">Not provided</span>
              )}
            </RecordRow>
            <RecordRow label="Protection">{protectionMeta[n.scope].label}</RecordRow>
            <RecordRow label="Justification">
              <p className={n.justification.trim() ? "m-0 max-w-prose whitespace-pre-line text-balance" : "m-0 text-tertiary"}>{n.justification.trim() || "Not provided"}</p>
            </RecordRow>
            <RecordRow label="Nominated by">
              <span className="flex flex-col">
                <span>{n.nominator.name}</span>
                {n.nominator.organisation && <span className="text-tertiary">{n.nominator.organisation}</span>}
                <span className="text-tertiary">{n.nominator.email}</span>
              </span>
            </RecordRow>
            <RecordRow label="Created">{formatShortDate(n.createdAt)}</RecordRow>
            <RecordRow label="Last updated">{formatShortDate(n.updatedAt)}</RecordRow>
          </div>
          {photo && species && (
            <div className="w-full shrink-0 overflow-hidden rounded-lg border border-secondary pb-3 sm:max-w-80 lg:w-80">
              <SpeciesPhotoCarousel scientificName={species.species} alt={species.commonName} />
            </div>
          )}
        </TabPanel>

        <TabPanel id="protection" className="p-6">
          <div className="rounded-lg border border-secondary">
            <RecordRow label="Protection">
              <span className="flex flex-col">
                <span>{protectionMeta[n.scope].label}</span>
                <span className="text-tertiary">{protectionMeta[n.scope].description}</span>
              </span>
            </RecordRow>
            {n.scope === "selected" &&
              (n.attributes.length === 0 ? (
                <RecordRow label="Attributes">
                  <span className="text-tertiary">No attributes chosen yet</span>
                </RecordRow>
              ) : (
                n.attributes.map((a) => (
                  <RecordRow key={a.id} label={attributeLabel(a)}>
                    <div className="flex flex-col gap-3">
                      <span>{attributeValueLabel(a) || <span className="text-tertiary">Not provided</span>}</span>
                      {a.attribute === "location" && a.areas.length > 0 && (
                        <>
                          <AreaList areas={a.areas} />
                          <AreasMap areas={a.areas} className="h-72" />
                        </>
                      )}
                    </div>
                  </RecordRow>
                ))
              ))}
          </div>
        </TabPanel>

        <TabPanel id="history" className="p-6">
          <AuditLog id={n.id} idLabel="Nomination ID" items={milestones(n.history, { label: "Decided", is: (e) => e.status === "accepted" || e.status === "rejected" }, { created: n.createdAt, updated: n.updatedAt })} changeCount={n.history.length}>
            <div className="rounded-lg border border-secondary">
              {[...n.history].reverse().map((e, i) => (
                <RecordRow key={`${e.status}-${e.at}-${i}`} label={formatShortDate(e.at)}>
                  <span className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" color={nominationStatusMeta[e.status].badgeColor}>
                        {nominationStatusMeta[e.status].label}
                      </Badge>
                      <span className="text-tertiary">{e.by}</span>
                    </span>
                    {e.note && <span className="max-w-prose text-secondary">{e.note}</span>}
                  </span>
                </RecordRow>
              ))}
            </div>
          </AuditLog>
        </TabPanel>
      </ContentTabs>

      <ConfirmationModal
        isOpen={confirm === "accept"}
        onOpenChange={(open) => !open && setConfirm(null)}
        icon={CheckCircle}
        iconColor="success"
        title={`Accept ${n.id}?`}
        description={`This records the panel's decision to protect ${name} as nominated, and tells ${n.nominator.name}.`}
        confirmLabel="Accept nomination"
        onConfirm={() => {
          setConfirm(null);
          onAccept();
        }}
      />
      <DestructiveModal
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

export function NominationNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Nomination not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">There is no nomination {id}. It may have been a draft that was deleted.</p>
      <Button color="link-color" size="sm" href={roleHref("/pages/nominations")} iconLeading={ArrowNarrowLeft}>
        Back to nominations
      </Button>
    </div>
  );
}
