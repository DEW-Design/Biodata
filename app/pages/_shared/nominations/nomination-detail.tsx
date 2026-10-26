"use client";

import { useState } from "react";
import { Tabs as ContentTabs, type Key } from "react-aria-components";
import { ArrowNarrowLeft, CheckCircle, Edit05, MessageAlertCircle, PlayCircle, Trash01, XCircle, Grid01, Shield01, ClockRewind } from "@untitledui/icons";
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
import { AreaList, AreasMap, OwnJustification } from "@/app/pages/_shared/nominations/nomination-areas";
import { attributeLabel, attributeValueLabel, formatShortDate, kindOf, locationArea, nominationStatusMeta, nominationSubject, protectionMeta, speciesFor, type Nomination } from "@/app/pages/_shared/nominations/nomination-data";
import { geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { AuditFeed } from "@/app/pages/_shared/audit-feed";
import { useNominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { setNominationRating, useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { AccessSelect, CurrentRatingValue, RatingValue, RiskSelect } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { STANDARD_ACCESS, areaRatingKey, currentSpeciesRating, nominationRatingKeys, ratingKeyLabel } from "@/app/pages/_shared/nominations/nomination-rating";

// A nomination's own page, laid out like the project page (every record page follows it): a Back
// link, the gradient identity card with the actions at its top right (one white button, the rest in
// "..."), a notice saying where it stands and who acts next, then tabs of label/value rows:
// Overview, What to protect, Audit history.
// Version 2 (the designer, 12 Oct 2026): the BioData Super Admin's review sets the data release risk and user access level
// on What to protect, one pair per thing protected (the whole species, or each attribute), kept on the nomination; once accepted
// they count towards the species' current rating (its accepted nominations' ratings merged). Accept is refused until each has
// a risk. Both admin roles see the species' current rating at the top of What to protect; a BioData Admin otherwise reviews as
// in version 1. Both admin roles can edit any nomination past its draft, in the same form, whatever its status: the Super Admin
// rates it there too (the designer, 12 Oct 2026).
// A location nomination (version 2) has the same page: its place instead of a species (name, area and map), one rating for the
// place, kept on the nomination once accepted. The nominator edits it in the same form it was nominated in.

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
  const { base, version } = useNominationVersion();
  const canReview = useFeatureAccess("nominationReview");
  const canRate = useFeatureAccess("nominationRating");
  const [confirm, setConfirm] = useState<null | "accept" | "delete">(null);
  const [tab, setTab] = useState<Key>("overview");
  const [showRatingErrors, setShowRatingErrors] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const n = nomination;
  const species = speciesFor(n.speciesId);
  const meta = nominationStatusMeta[n.status];
  const isOwner = n.nominator.name === CURRENT_USER_NAME;
  const kind = kindOf(n);
  const name = nominationSubject(n);
  const place = kind === "location" && n.location ? locationArea(n.location) : null;

  const photo = species ? speciesImage(species.species) : undefined;
  const submittedAt = n.history.find((e) => e.status === "submitted")?.at;
  // Version 2: the Super Admin rates what the nomination protects while reviewing it, and sees the rating once accepted.
  const rates = version >= 2 && canRate;
  const nominations = useNominations();
  const showsCurrent = version >= 2 && canRate;
  const current = currentSpeciesRating(nominations, n.speciesId);
  const rating = n.ratings ?? {};
  const unrated = rates ? nominationRatingKeys(n).filter((k) => !rating[k]) : [];
  const unratedNames = unrated.map((k) => ratingKeyLabel(n, k));

  /** The risk and level for one thing protected: fields while under review, the rating once accepted, else nothing. */
  const ratingFor = (key: string) => {
    if (!rates) return null;
    const value = rating[key];
    if (n.status === "under_review")
      return (
        <div className="grid gap-4 border-t border-secondary pt-4 sm:grid-cols-2">
          <RiskSelect
            label="Data release risk"
            value={value?.risk ?? null}
            isInvalid={showRatingErrors && !value}
            onChange={(risk) => setNominationRating(n.id, key, { risk, access: STANDARD_ACCESS[risk] })}
          />
          <AccessSelect label="User access level" risk={value?.risk ?? null} value={value?.access ?? null} onChange={(access) => value && setNominationRating(n.id, key, { ...value, access })} />
        </div>
      );
    if (n.status === "accepted" && value)
      return (
        <div className="border-t border-secondary pt-4">
          <RatingValue rating={value} />
        </div>
      );
    return null;
  };

  // One primary (the next step for whoever is looking), the natural alternative beside it, the rest
  // in "More actions" with the destructive ones set apart (RecordActionBar).
  const actions: { primary?: RecordAction; secondary: RecordAction[]; menu: RecordAction[] } = { secondary: [], menu: [] };
  if (canReview && n.status === "submitted") actions.primary = { id: "start", label: "Start review", icon: PlayCircle, onPress: onStartReview };
  if (canReview && n.status === "under_review") {
    actions.primary = {
      id: "accept",
      label: "Accept",
      icon: CheckCircle,
      onPress: () => {
        if (unrated.length === 0) return setConfirm("accept");
        setShowRatingErrors(true);
        setTab("protection");
      },
    };
    actions.secondary.push({ id: "return", label: "Return for more information", icon: MessageAlertCircle, onPress: () => setReturnOpen(true) });
    actions.secondary.push({ id: "reject", label: "Reject", icon: XCircle, onPress: () => setRejectOpen(true) });
  }
  if (isOwner && n.status === "draft") {
    actions.primary = { id: "edit", label: "Edit draft", icon: Edit05, onPress: onEdit };
    actions.menu.push({ id: "delete", label: "Delete draft", icon: Trash01, destructive: true, onPress: () => setConfirm("delete") });
  }
  if (isOwner && n.status === "submitted") (actions.primary ? actions.menu : actions.secondary).push({ id: "edit", label: "Edit nomination", icon: Edit05, onPress: onEdit });
  if (isOwner && n.status === "returned") actions.primary = { id: "update", label: "Update and resubmit", icon: Edit05, onPress: onEdit };
  // Version 2: both admin roles edit any nomination past its draft, whatever its status, unless the nominator's own edit is already offered.
  const ownEdit = isOwner && ["draft", "submitted", "returned"].includes(n.status);
  if (version >= 2 && canReview && n.status !== "draft" && !ownEdit)
    (actions.primary ? actions.menu : actions.secondary).push({ id: "edit", label: "Edit nomination", icon: Edit05, onPress: onEdit });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref(base)}>Back to nominations</RecordBackLink>

      <RecordHero
        eyebrow={kind === "location" ? "Sensitive location nomination" : "Sensitive species nomination"}
        title={name}
        subtitle={species ? <span className="italic">{species.species}</span> : n.location ? geoExtentSummary(n.location.extent) : undefined}
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

      <ContentTabs selectedKey={tab} onSelectionChange={setTab} className="flex flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList aria-label="Nomination sections" type="underline" size="md">
            <Tab id="overview" label="Overview" icon={Grid01} />
            <Tab id="protection" label="What to protect" icon={Shield01} />
            <Tab id="history" label="Audit history" icon={ClockRewind} />
          </TabList>
        </div>

        <TabPanel id="overview" className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-lg border border-secondary">
            {kind === "location" ? (
              <RecordRow label="Location">
                <span className="flex flex-col">
                  <span>{name}</span>
                  {n.location && <span className="text-tertiary">{geoExtentSummary(n.location.extent)}</span>}
                </span>
              </RecordRow>
            ) : (
            <RecordRow label="Species">
              {species ? (
                <span className="flex flex-col">
                  <span>{species.commonName}</span>
                  <span className="text-tertiary italic">{species.species}</span>
                  <span className="text-xs text-tertiary">
                    {species.family}, {species.group}
                  </span>
                </span>
              ) : (
                <span className="text-tertiary">Not provided</span>
              )}
            </RecordRow>
            )}
            {kind === "species" && <RecordRow label="Protection">{protectionMeta[n.scope].label}</RecordRow>}
            <RecordRow label="Reason">
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
            <div className="w-full shrink-0 overflow-hidden rounded-lg border border-secondary sm:max-w-80 lg:w-80">
              <SpeciesPhotoCarousel scientificName={species.species} alt={species.commonName} />
            </div>
          )}
        </TabPanel>

        <TabPanel id="protection" className="flex flex-col gap-4 p-6">
          {showRatingErrors && unrated.length > 0 && (
            <AlertFullWidth
              color="error"
              title="Ratings missing"
              description={`Set a data release risk before accepting: ${unratedNames.join(", ")}.`}
              confirmLabel=""
              contained
              wrap
            />
          )}
          <div className="rounded-lg border border-secondary">
            {showsCurrent && (
              <RecordRow label="Current rating">
                {kind === "species" ? (
                  <CurrentRatingValue rating={current} />
                ) : n.status === "accepted" && rating.location ? (
                  <RatingValue rating={rating.location} />
                ) : (
                  <span className="flex flex-col">
                    <span>Not rated</span>
                    <span className="text-tertiary">The rating is set when the nomination is accepted.</span>
                  </span>
                )}
              </RecordRow>
            )}
            {kind === "location" ? (
              <RecordRow label="Location">
                <div className="flex flex-col gap-3">
                  <span>Everything recorded in this area is protected.</span>
                  {place && (
                    <>
                      <AreaList areas={[place]} />
                      <AreasMap areas={[place]} className="h-72" />
                    </>
                  )}
                  {ratingFor("location")}
                </div>
              </RecordRow>
            ) : (
              <RecordRow label="Protection">
                <div className="flex flex-col gap-3">
                  <span className="flex flex-col">
                    <span>{protectionMeta[n.scope].label}</span>
                    <span className="text-tertiary">{protectionMeta[n.scope].description}</span>
                  </span>
                  {n.scope === "all" && ratingFor("species")}
                </div>
              </RecordRow>
            )}
            {kind === "species" && n.scope === "selected" &&
              (n.attributes.length === 0 && !n.removals?.length ? (
                <RecordRow label="Attributes">
                  <span className="text-tertiary">No attributes chosen yet</span>
                </RecordRow>
              ) : (
                n.attributes.map((a) => (
                  <RecordRow key={a.id} label={attributeLabel(a)}>
                    <div className="flex flex-col gap-3">
                      <span>{attributeValueLabel(a) || <span className="text-tertiary">Not provided</span>}</span>
                      {a.justification !== undefined && <OwnJustification text={a.justification} />}
                      {a.attribute === "location" && a.areas.length > 0 && (
                        <>
                          <AreaList
                            areas={a.areas}
                            renderArea={(area) => (
                              <>
                                {area.justification !== undefined && <OwnJustification text={area.justification} />}
                                {ratingFor(areaRatingKey(a.id, area.id))}
                              </>
                            )}
                          />
                          <AreasMap areas={a.areas} className="h-72" />
                        </>
                      )}
                      {a.attribute !== "location" && ratingFor(String(a.id))}
                    </div>
                  </RecordRow>
                ))
              ))}
            {/* The accepted restrictions the nomination asks to change (25 Oct 2026), after what it sets. Not rated. */}
            {kind === "species" &&
              (n.removals ?? []).map((r) => (
                <RecordRow key={r.key} label={r.key}>
                  <div className="flex flex-col items-start gap-3">
                    <Badge size="sm" color="blue">
                      Change requested
                    </Badge>
                    <span>{r.summary}</span>
                  </div>
                </RecordRow>
              ))}
          </div>
        </TabPanel>

        <TabPanel id="history" className="p-6">
          <AuditLog id={n.id} idLabel="Nomination ID" items={milestones(n.history, { label: "Decided", is: (e) => e.status === "accepted" || e.status === "rejected" }, { created: n.createdAt, updated: n.updatedAt })} changeCount={n.history.length}>
            <AuditFeed events={n.history} statusMeta={nominationStatusMeta} noun="nomination" />
          </AuditLog>
        </TabPanel>
      </ContentTabs>

      <ConfirmationModal confirmIcon={CheckCircle}
        isOpen={confirm === "accept"}
        onOpenChange={(open) => !open && setConfirm(null)}
        icon={CheckCircle}
        iconColor="success"
        title={`Accept ${n.id}?`}
        description={
          rates && kind === "location"
            ? `This records the panel's decision to protect ${name} with the rating you set, and tells ${n.nominator.name}.`
            : rates
            ? `This records the panel's decision to protect ${name} as nominated, adds its data release rating to the species' current one, and tells ${n.nominator.name}.`
            : `This records the panel's decision to protect ${name} as nominated, and tells ${n.nominator.name}.`
        }
        confirmLabel="Accept nomination"
        onConfirm={() => {
          setConfirm(null);
          onAccept();
        }}
      />
      <DestructiveModal confirmIcon={Trash01}
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

export function NominationNotFound({ id }: { id: string }) {
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Nomination not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">There is no nomination {id}. It may have been a draft that was deleted.</p>
      <Button color="link-color" size="sm" href={roleHref(base)} iconLeading={ArrowNarrowLeft}>
        Back to nominations
      </Button>
    </div>
  );
}
