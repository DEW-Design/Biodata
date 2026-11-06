"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit05, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal } from "@/components/application/modals/modal";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SpeciesField } from "@/app/pages/_shared/species-picker";
import { AreasEditor } from "@/app/pages/_shared/nominations/nomination-areas";
import { AssessmentView, ProtectionView } from "@/app/pages/_shared/nominations/nomination-protection";
import { FileQueue, UploadDropzone, useFileQueue, type QueuedFile } from "@/app/pages/_shared/dataset-upload/upload-dropzone";
import { ExistingRestrictionsTable } from "@/app/pages/_shared/nominations/nomination-restrictions";
import { GeoExtentPicker } from "@/app/pages/project-registration/geo-extent-picker";
import { emptyGeoExtent, type GeoExtentValue } from "@/app/pages/project-registration/types";
import { AccessSelect, RiskSelect } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { STANDARD_ACCESS, areaRatingKey, nominationRatingKeys, ratingKeyLabel, type Rating } from "@/app/pages/_shared/nominations/nomination-rating";
import {
  NOMINATION_ATTRIBUTES,
  existingRestrictions,
  kindOf,
  sectionOrderFor,
  type NominationKind,
  fromEditorRows,
  isOpenNomination,
  missingForNomination,
  nominationSections,
  nominationStatusMeta,
  protectionMeta,
  protectedItems,
  speciesFor,
  toEditorRows,
  type Nomination,
  type NominationArea,
  type NominationAttachment,
  type NominationDraft,
  type NominationRemoval,
  type NominationSection,
  type ProtectionScope,
} from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { ConceptRows } from "@/app/pages/project-registration/concept-rows";
import { existingRestrictionsForSpecies } from "@/app/pages/project-registration/data";
import type { ConceptValueRow } from "@/app/pages/project-registration/types";
import { useRoleHref } from "@/lib/use-role-href";

// The nomination form, fitted from the lo-fi (Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936) into the
// shared form pattern (FormPage, sections in column 2, CONTRACTS 4.1). The lo-fi's one long screen
// becomes sections: Species (its left-hand picker, moved into main), What to protect (Data
// Protection Rules, the attribute rows and why), and Review. The attribute editor is the
// project flow's own ConceptRows, labelled "attribute" here as the lo-fi says, with Location as a
// set of areas. Mandatory details block Continue for the section being left, never ahead of it.
// Version 2 (the designer, 12 Oct 2026):
// - A location nomination uses the same form and steps: Location (a name, then the area chosen as Add Project chooses its
//   geographic extent, GeoExtentPicker, its map opening in the Expand dialog), Review.
// - A nomination an admin makes follows the same workflow as anyone's (the designer, 26 Oct 2026: "an admin cannot directly
//   submit an approved nomination, it has to follow the same workflow as the registered users"): the last step submits it, the
//   panel reviews it, and it is accepted or rejected there. Until 26 Oct 2026 a BioData Admin or Super Admin could approve their
//   own at once, rating each thing protected first; the rating is set while the nomination is under review, or when an admin edits it.
// - Both admin roles edit any nomination past its draft (`onSaveChanges`): Save changes keeps its status, no draft. The Super
//   Admin's rating fields show on Review, required once the nomination is accepted.
// - Version 3: on Review, each rating sits beside the item it rates (under the location, the whole species, or each attribute)
//   instead of in a "Data release" block at the end.
// - Both versions (the designer, 12 Oct 2026: "must be able to set the data risk level and access level in the same screen"):
//   the rating is set where the thing it rates is chosen, not on Review. Each attribute's card on What to protect has its data
//   release risk and user access level under its value; "All data" has one pair under the choice; a location has its pair on the
//   Location step. Review shows each rating as read, beside its item. Both admin roles rate (`nominationRating`).
// - Justification is not a step (the designer, 14 Oct 2026: "for all users when selecting attributes, they have to provide
//   justification for each attribute. Also for each location ... we cannot annoy the users by asking justification for every
//   field when its the same justification for all"). Each attribute, and each area of a Location attribute, is justified where it
//   is chosen. Since 14 Oct 2026 (the designer chose it from three patterns): one "Main reason", asked before the attributes,
//   covers every attribute and area; each item shows "Uses the main reason" and a "Write a different one" link, and the link opens that
//   item's own field, with "Use the main one instead" to close it (the inherited-value pattern). The word is "reason" everywhere
//   on screen, never "justification" (the designer: "don't juggle between justification and reason"); the code keeps the
//   `justification` field name. "All data" and a location
//   nomination have one justification, on their step.
// - An admin's edit opens on What to protect (a location's on Location), not on Review, and "Save changes" is in the footer of
//   every step, so a change is saved where it is made.
// - What is already restricted (the designer, 25 Oct 2026: nominators "can also see what is nominated already and then suggest
//   adding or removing"; "a view like this [the Review table] to show what is already restricted ... along with the status"; "this
//   restriction will show for the restrictions done by other users as well"). A restriction is a whole nomination, whoever made
//   it: the species where it is found (Location) and with every attribute it names. The species list shows each species' status
//   (the open nomination's, else Accepted, else Restricted in a project); choosing one shows a warning that it is already
//   restricted (made prominent: "intuitively understood that the species is restricted already however a specialist user can
//   decide to request to modify the restrictions") over its restrictions (`ExistingRestrictionsTable`), read only ("no need for
//   any action button here. Just show the changes"). A change (a new location, another attribute) is nominated on the next step.
//   A nomination saved with `removals` (25 Oct 2026, before this) keeps them and still shows them on Review and the record.
// - The business's Word document (the designer, 6 Nov 2026, "make these tweaks"): the choice is "What data should be restricted?", All
//   occurrence records or a Subset of them; "Observation type / evidence of presence" is one more attribute; and the Main reason moved below the
//   attributes and became three mandatory answers: Likelihood and consequences (the old main reason, kept in `justification`; an attribute or
//   area no longer takes a reason of its own, "Write a different one" having been removed the same day), Risks of not releasing the data, and whether the data is already in the public domain (Yes or No, then where when Yes).
//   Supporting evidence (optional files, names and sizes kept) and the FYI note on events follow. Not asked of a nomination past its draft that was
//   made before them (`legacyLive`), so an admin can still edit it. A location nomination is unchanged: the document is the species form.

// Species is the shared SpeciesField (app/pages/_shared/species-picker.tsx): a combo box grouped
// by species group, then a summary card with Change. The notes under the card are this form's own.
function SpeciesPicker({
  value,
  onChange,
  excludeNominationId,
  isInvalid,
}: {
  value: string;
  onChange: (id: string) => void;
  excludeNominationId?: string;
  isInvalid?: boolean;
}) {
  const nominations = useNominations();
  const router = useRouter();
  const roleHref = useRoleHref();

  const openBySpecies = useMemo(() => {
    const map = new Map<string, Nomination>();
    for (const n of nominations) if (n.id !== excludeNominationId && isOpenNomination(n)) map.set(n.speciesId, n);
    return map;
  }, [nominations, excludeNominationId]);
  // Each species' status in the list: its open nomination's, else Accepted when a restriction is in force, else Restricted when a
  // project holds its records as licence-only.
  const acceptedSpecies = useMemo(() => {
    const ids = new Set<string>();
    for (const n of nominations) if (n.status === "accepted" && kindOf(n) === "species") ids.add(n.speciesId);
    return new Set([...ids].filter((id) => existingRestrictions(nominations, id, excludeNominationId).some((r) => r.status === "accepted")));
  }, [nominations, excludeNominationId]);

  return (
    <SpeciesField
      value={speciesFor(value)}
      onChange={(s) => onChange(s?.id ?? "")}
      isInvalid={isInvalid}
      statusFor={(s) => {
        const open = openBySpecies.get(s.id);
        if (open) return nominationStatusMeta[open.status].label;
        if (acceptedSpecies.has(s.id)) return nominationStatusMeta.accepted.label;
        return s.alreadySensitive ? "Restricted" : undefined;
      }}
      notes={(selected) => {
        const restrictions = selected.alreadySensitive ? existingRestrictionsForSpecies(selected.id) : [];
        const open = openBySpecies.get(selected.id);
        const restricted = existingRestrictions(nominations, selected.id, excludeNominationId);
        return (
          <>
            {selected.alreadySensitive && (
              <AlertFullWidth
                color="warning"
                title="Already restricted in some projects"
                description={
                  restrictions.length
                    ? `Records in ${restrictions.map((r) => `${r.code} ${r.name}`).join(", ")} are licence-only. A nomination asks for protection everywhere.`
                    : "Some records of this species are already licence-only. A nomination asks for protection everywhere."
                }
                confirmLabel=""
                contained
                wrap
              />
            )}
            {/* An open nomination for the same species blocks this one: the note says why and where to
                go instead, and the form refuses Continue, Save draft and Submit (see duplicateOf). */}
            {open && (
              <AlertFullWidth
                color="error"
                title="This species can't be nominated again yet"
                description={`${open.id} is already open (${nominationStatusMeta[open.status].label}). Update that nomination instead, or choose another species.`}
                confirmLabel={`Open ${open.id}`}
                actionType="link"
                onConfirm={() => router.push(roleHref(`/pages/nominations/${open.id}`))}
                contained
                wrap
              />
            )}
            {/* What is restricted already, nominated or accepted, with its status, under a warning that says so first. */}
            {restricted.length > 0 && (
              <div className="mt-3 flex flex-col gap-3">
                <AlertFullWidth
                  color="warning"
                  title={restricted.some((r) => r.status === "accepted") ? "This species is already restricted" : "This species is already nominated"}
                  description={
                    restricted.some((r) => r.status === "accepted")
                      ? "The restrictions below are in force, whoever nominated them. Each applies where it says, to records that match all of its attributes. If one should change, such as a new location or another attribute, nominate the change on the next step."
                      : "The nomination below is with the review panel. Each applies where it says, to records that match all of its attributes."
                  }
                  confirmLabel=""
                  contained
                  wrap
                />
                <ExistingRestrictionsTable restrictions={restricted} />
              </div>
            )}
          </>
        );
      }}
    />
  );
}

function SummaryRow({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-secondary py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <Button color="link-gray" size="sm" iconLeading={Edit05} onPress={onEdit}>
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

export function NominationForm({
  initial,
  kind: newKind = "species",
  canRate = false,
  onBack,
  onSaveDraft,
  onSubmit,
  onSaveChanges,
}: {
  initial?: Nomination;
  /** What a new nomination is for. An existing one keeps its own. */
  kind?: NominationKind;
  /** Both admin roles editing a nomination past its draft (`onSaveChanges`): a risk and level for each thing protected, set beside it (What to protect, or Location). */
  canRate?: boolean;
  onBack: () => void;
  onSaveDraft: (draft: NominationDraft) => void;
  onSubmit: (draft: NominationDraft) => void;
  /** Version 2, BioData Admin and Super Admin editing a nomination past its draft: Save changes keeps its status, with the
   *  ratings the Super Admin set (required once it is accepted). */
  onSaveChanges?: (draft: NominationDraft, ratings: Record<string, Rating>) => void;
}) {
  const kind = initial ? kindOf(initial) : newKind;
  const order = sectionOrderFor(kind);
  const adminEdit = !!onSaveChanges;
  const [ratings, setRatings] = useState<Record<string, Rating>>(initial?.ratings ?? {});
  const [speciesId, setSpeciesId] = useState(initial?.speciesId ?? "");
  const [locationName, setLocationName] = useState(initial?.location?.name ?? "");
  const [extent, setExtent] = useState<GeoExtentValue>(initial?.location?.extent ?? emptyGeoExtent());
  const [scope, setScope] = useState<ProtectionScope>(initial?.scope ?? "selected");
  const [editor] = useState(() => toEditorRows(initial?.attributes ?? []));
  const [rows, setRows] = useState<ConceptValueRow[]>(editor.rows);
  const [areas, setAreas] = useState<Record<number, NominationArea[]>>(editor.areas);
  const [justification, setJustification] = useState(initial?.justification ?? "");
  // The other two answers of the Word document's three questions, and the supporting files (6 Nov 2026). New files are read by the same queue an
  // upload uses; the ones already saved on the nomination are kept as they are, shown in the same list.
  const [risks, setRisks] = useState(initial?.risksOfNotReleasing ?? "");
  const [publicDomain, setPublicDomain] = useState<"yes" | "no" | undefined>(initial?.publicDomain);
  const [publicWhere, setPublicWhere] = useState(initial?.publicDomainWhere ?? "");
  const [keptFiles, setKeptFiles] = useState<NominationAttachment[]>(initial?.attachments ?? []);
  const queue = useFileQueue("everything");
  // Restrictions an earlier nomination asked to change, by nomination id: kept as saved, no longer chosen on the form.
  const [removals, setRemovals] = useState<Record<string, NominationRemoval>>(() => Object.fromEntries((initial?.removals ?? []).map((r) => [r.key, r])));
  // The items that have their own justification, by `ProtectedItem.key`: only on a nomination saved before 6 Nov 2026, when the form stopped offering
  // one ("Write a different one", removed by the designer). It is kept as it was saved, and not shown here, so an edit does not lose it.
  const [own] = useState<Record<string, string>>(() =>
    Object.fromEntries(protectedItems(initial?.attributes ?? []).flatMap((item) => (item.own !== undefined ? [[item.key, item.own]] : []))),
  );
  // The step the rating fields sit on: where the thing rated is chosen.
  const ratingSection: NominationSection = kind === "location" ? "location" : "protection";
  // An admin's edit opens where the protection is set; any other edit of an existing nomination opens on Review.
  const [section, setSection] = useState<NominationSection>(initial ? (onSaveChanges ? ratingSection : "review") : order[0]);
  const [visited, setVisited] = useState<Set<NominationSection>>(() => new Set(initial ? order : []));
  const [blocked, setBlocked] = useState<Set<NominationSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  const touch = () => setDirty(true);
  const nominations = useNominations();
  const chosenRemovals = Object.values(removals);
  // The chosen items in order; any of them may have its own justification instead of the main one.
  const items = scope === "selected" ? protectedItems(fromEditorRows(rows, areas)) : [];
  const ownFor = (key: string) => own[key];
  const withOwn = <T extends { justification?: string }>(item: T, key: string): T => {
    const { justification: _drop, ...rest } = item;
    void _drop;
    const text = ownFor(key);
    return (text !== undefined ? { ...rest, justification: text } : rest) as T;
  };
  const attachments: NominationAttachment[] = [...keptFiles, ...queue.files.filter((f) => f.status === "complete").map((f) => ({ name: f.name, size: f.size }))];
  // A nomination past its draft that was made before the three questions existed is not held to them when it is edited; every other one is.
  const legacyLive = !!initial && initial.status !== "draft" && initial.status !== "returned" && initial.risksOfNotReleasing === undefined && initial.publicDomain === undefined;
  const draft: NominationDraft =
    kind === "location"
      ? { kind, speciesId: "", scope: "all", attributes: [], justification, location: { name: locationName, extent } }
      : {
          speciesId,
          scope,
          attributes:
            scope === "selected"
              ? fromEditorRows(rows, areas).map((a) =>
                  a.attribute === "location" ? { ...a, areas: a.areas.map((ar) => withOwn(ar, areaRatingKey(a.id, ar.id))) } : withOwn(a, `attr:${a.id}`),
                )
              : [],
          ...(chosenRemovals.length ? { removals: chosenRemovals } : {}),
          justification,
          ...(risks.trim() ? { risksOfNotReleasing: risks } : {}),
          ...(publicDomain ? { publicDomain, ...(publicDomain === "yes" && publicWhere.trim() ? { publicDomainWhere: publicWhere } : {}) } : {}),
          ...(publicDomain === "yes" && attachments.length ? { attachments } : {}),
        };
  // A species with an open nomination (other than this one) can't be nominated again: the species
  // section counts it as unresolved, so Continue, jumping ahead, Save draft and Submit all refuse.
  const duplicateOf = kind === "species" && speciesId ? nominations.find((n) => n.id !== initial?.id && n.speciesId === speciesId && isOpenNomination(n)) : undefined;
  const baseMissing = missingForNomination(draft, "submit", { assessment: !legacyLive });
  const withDuplicate = duplicateOf ? { ...baseMissing, species: [...baseMissing.species, "Choose a species without an open nomination"] } : baseMissing;
  // An admin editing a nomination past its draft is asked a risk for each thing protected, beside the thing it rates; required once
  // the nomination is accepted. A new nomination, an admin's included, has no rating fields: it is rated while it is reviewed.
  const ratingKeys = canRate && adminEdit ? nominationRatingKeys(draft) : [];
  const ratingsRequired = initial?.status === "accepted";
  const ratingName = (key: string) => ratingKeyLabel(draft, key);
  const unrated = (ratingsRequired ? ratingKeys : []).filter((k) => !ratings[k]).map((k) => `Set a data release risk for ${ratingName(k)}`);
  const missing = { ...withDuplicate, [ratingSection]: [...withDuplicate[ratingSection], ...unrated] };
  const index = order.indexOf(section);
  const isLast = section === "review";
  const allMissing = order.flatMap((id) => missing[id]);
  const showErrors = (id: NominationSection) => submitPressed || blocked.has(id);
  const status = initial?.status;
  const isEditingLive = status === "submitted" || adminEdit;
  const isResubmit = status === "returned" && !adminEdit;
  const canDraft = !isEditingLive && !isResubmit;

  const goTo = (next: NominationSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };
  // Continue, and jumping ahead in column 2, refuse to leave a section with mandatory details missing.
  const proceed = (next: NominationSection) => {
    if (order.indexOf(next) > index && missing[section].length > 0) {
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };

  const submit = () => {
    setSubmitPressed(true);
    const first = order.find((id) => missing[id].length > 0);
    if (first) {
      setSection(first);
      return;
    }
    const rated = Object.fromEntries(ratingKeys.filter((k) => ratings[k]).map((k) => [k, ratings[k]]));
    if (adminEdit) onSaveChanges!(draft, rated);
    else onSubmit(draft);
  };

  const saveDraft = () => {
    if (kind === "location" && !locationName.trim()) {
      setBlocked((b) => new Set(b).add("location"));
      setSection("location");
      return;
    }
    if (kind === "species" && (!speciesId || duplicateOf)) {
      setBlocked((b) => new Set(b).add("species"));
      setSection("species");
      return;
    }
    onSaveDraft(draft);
  };

  const sectionMeta = (id: NominationSection) => {
    // An admin's edit saves the nomination where it stands: it does not go to the panel again.
    if (adminEdit && id === "review") return { title: "Review and save", description: "Check the nomination, then save your changes." };
    return nominationSections[id];
  };
  const sectionItems = order.map((id) => {
    const count = id === "review" ? allMissing.length : missing[id].length;
    return {
      id,
      title: sectionMeta(id).title,
      status: deriveSectionStatus({ isCurrent: id === section, isValid: count === 0, visited: visited.has(id), attempted: showErrors(id) }),
      detail: showErrors(id) && count > 0 && id !== section ? `${count} to fix` : undefined,
    };
  });

  // On the species step the duplicate's own error note is its message, so the "Details missing" alert
  // doesn't repeat it (CONTRACTS 4.1: one message per fact).
  const sectionProblems = section === "species" ? baseMissing.species : missing[section];
  const problems = section === "review" ? (submitPressed ? allMissing : []) : showErrors(section) ? sectionProblems : [];
  const title = initial ? (isResubmit ? `Update ${initial.id}` : isEditingLive ? `Edit ${initial.id}` : `Edit draft ${initial.id}`) : kind === "location" ? "New location nomination" : "New nomination";
  const species = speciesFor(speciesId);

  // A location nomination's one reason (a species nomination asks the three questions instead, `assessment` below).
  const sharedJustification = (rows: number, hint?: string, inRow = false) => (
    <TextArea
      label={inRow ? undefined : "Reason"}
      aria-label={inRow ? "Reason" : undefined}
      isRequired
      rows={rows}
      placeholder="What puts these records at risk if they stay public, and what protecting them would prevent."
      value={justification}
      isInvalid={showErrors(kind === "location" ? "location" : "protection") && !justification.trim()}
      hint={showErrors(kind === "location" ? "location" : "protection") && !justification.trim() ? "Enter a reason" : hint}
      onChange={(v) => {
        setJustification(v);
        touch();
      }}
    />
  );
  // The pair of rating fields, set beside the thing it rates.
  const ratingFields = (key: string) => {
    const value = ratings[key];
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <RiskSelect
          label="Data release risk"
          value={value?.risk ?? null}
          isInvalid={showErrors(ratingSection) && ratingsRequired && !value}
          onChange={(risk) => {
            setRatings((r) => ({ ...r, [key]: { risk, access: STANDARD_ACCESS[risk] } }));
            touch();
          }}
        />
        <AccessSelect
          label="User access level"
          risk={value?.risk ?? null}
          value={value?.access ?? null}
          onChange={(access) => {
            if (!value) return;
            setRatings((r) => ({ ...r, [key]: { ...value, access } }));
            touch();
          }}
        />
      </div>
    );
  };
  // The questions below what is protected (the designer, 6 Nov 2026, from the business's Word document): the main reason moved down and became
  // three mandatory answers, then the supporting evidence and a note on events. The first answer is the old main reason, kept in `justification`.
  const needsAnswers = !legacyLive;
  const likelihoodRequired = scope === "all" || items.length === 0 || items.some((i) => own[i.key] === undefined) || chosenRemovals.length > 0;
  const answerErrors = showErrors("protection");
  const likelihoodMissing = answerErrors && likelihoodRequired && !justification.trim();
  const risksMissing = answerErrors && needsAnswers && !risks.trim();
  const whereMissing = answerErrors && needsAnswers && publicDomain === "yes" && !publicWhere.trim();
  const keptAsQueued: QueuedFile[] = keptFiles.map((f, i) => ({ id: `kept-${i}`, name: f.name, size: f.size, loaded: f.size, status: "complete" }));
  const removeFile = (id: string) => {
    if (id.startsWith("kept-")) setKeptFiles((k) => k.filter((_, i) => `kept-${i}` !== id));
    else queue.remove(id);
    touch();
  };
  const assessment = (
    <>
      <FormRow
        title="Likelihood and consequences"
        required={likelihoodRequired}
        description="The likelihood of the species data being misused to threaten or disturb the species population and/or environment, and the consequences if it is. Consider, for example, site specificity of the species, poaching threat, sensitivities to disturbance and social media interest."
      >
        <TextArea
          aria-label="Likelihood and consequences"
          isRequired={likelihoodRequired}
          rows={5}
          value={justification}
          isInvalid={likelihoodMissing}
          hint={likelihoodMissing ? "Describe the likelihood and consequences of misuse" : undefined}
          onChange={(v) => {
            setJustification(v);
            touch();
          }}
        />
      </FormRow>
      <FormRow
        title="Risks of not releasing the data"
        required={needsAnswers}
        description="The risks created by not releasing the data as held, and how they can be minimised. For example, accidental destruction of habitat due to lack of data access."
      >
        <TextArea
          aria-label="Risks of not releasing the data"
          isRequired={needsAnswers}
          rows={4}
          value={risks}
          isInvalid={risksMissing}
          hint={risksMissing ? "Describe the risks of not releasing the data" : undefined}
          onChange={(v) => {
            setRisks(v);
            touch();
          }}
        />
      </FormRow>
      <FormRow
        title="Already in the public domain"
        required={needsAnswers}
        description="Is the data already in the public domain?"
        error={answerErrors && needsAnswers && !publicDomain ? "Say whether the data is already in the public domain" : undefined}
      >
        <RadioGroup
          aria-label="Already in the public domain"
          orientation="horizontal"
          value={publicDomain ?? ""}
          onChange={(v) => {
            setPublicDomain(v as "yes" | "no");
            touch();
          }}
        >
          <RadioButton value="yes" label="Yes" />
          <RadioButton value="no" label="No" />
        </RadioGroup>
        {publicDomain === "yes" && (
          <TextArea
            label="Where is it public?"
            isRequired
            rows={3}
            value={publicWhere}
            isInvalid={whereMissing}
            hint={whereMissing ? "Say where the data is already public" : "For example, in academic publications that cannot be redacted."}
            onChange={(v) => {
              setPublicWhere(v);
              touch();
            }}
          />
        )}
        {/* Where it is already public is shown by the files that show it (the designer, 6 Nov 2026): asked on Yes only. */}
        {publicDomain === "yes" && (
          <div className="flex flex-col gap-1.5">
            <Label>Supporting evidence (optional)</Label>
            <UploadDropzone
              accepts="everything"
              onAdd={(added) => {
                queue.add(added);
                touch();
              }}
            />
            <FileQueue files={[...keptAsQueued, ...queue.files]} onRemove={removeFile} />
            {queue.rejectedMessage && <p className="text-sm text-error-primary">{queue.rejectedMessage}</p>}
          </div>
        )}
      </FormRow>
      <div className="pt-6">
        <AlertFullWidth
          color="brand"
          title="Important information"
          description="Where a sensitive species is observed at an event, the event location information will be restricted. This will restrict the location information associated with other non-sensitive species observed at the event."
          confirmLabel=""
          contained
          wrap
        />
      </div>
    </>
  );
  const rates = ratingKeys.length > 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading={kind === "location" ? "Sensitive location nomination" : "Sensitive species nomination"}
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: order.length }}
          onSelect={(id) => proceed(id as NominationSection)}
        />
      </FormSidebar>

      <FormPage
        eyebrow={`${title} - Step ${index + 1} of ${order.length}`}
        title={sectionMeta(section).title}
        subtitle={`${sectionMeta(section).description}${section === "review" ? "" : kind === "location" ? " A draft only needs the location's name." : " A draft only needs the species."}`}
        onCancel={() => (dirty ? setConfirmBack(true) : onBack())}
        onSaveDraft={canDraft ? saveDraft : adminEdit && !isLast ? submit : undefined}
        saveLabel={canDraft ? undefined : "Save changes"}
        onBack={index > 0 ? () => goTo(order[index - 1]) : undefined}
        problems={problems.length ? { items: problems } : undefined}
        primaryLabel={isLast ? (isEditingLive ? "Save changes" : isResubmit ? "Resubmit nomination" : "Submit nomination") : "Continue"}
        primaryIsContinue={!isLast}
        onPrimary={isLast ? submit : () => proceed(order[index + 1])}
      >
        {section === "species" && (
          <FormRow title="Species" required description="Search by common name, scientific name or family.">
            <SpeciesPicker
              isInvalid={showErrors("species") && !speciesId}
              value={speciesId}
              excludeNominationId={initial?.id}
              onChange={(id) => {
                setSpeciesId(id);
                // A change names what another species is protected by: it does not carry over.
                setRemovals({});
                touch();
              }}
            />
          </FormRow>
        )}

        {section === "location" && (
          <>
            <FormRow title="Location name" required description="A short name the panel will know it by.">
              <Input
                aria-label="Location name"
                isRequired
                placeholder="E.g., Pygmy Bluetongue Lizard nesting site"
                value={locationName}
                isInvalid={showErrors("location") && !locationName.trim()}
                hint={showErrors("location") && !locationName.trim() ? "Name the location" : undefined}
                onChange={(v) => {
                  setLocationName(v);
                  touch();
                }}
              />
            </FormRow>
            <FormRow
              title="Area"
              required
              description="Draw it on the map, choose it from a list, enter coordinates or upload a shapefile."
              error={showErrors("location") && missing.location.includes("Define the location's area") ? "Define the location's area" : undefined}
            >
              <GeoExtentPicker
                value={extent}
                expand="modal"
                onChange={(next) => {
                  setExtent(next);
                  touch();
                }}
              />
            </FormRow>
            <FormRow title="Reason" required description="What puts this place at risk if its records stay public, and what protecting them would prevent.">
              {sharedJustification(5, undefined, true)}
            </FormRow>
            {rates && (
              <FormRow title="Data release" required={ratingsRequired} description="How records in this area are released, and who sees them as held.">
                {ratingFields("location")}
              </FormRow>
            )}
          </>
        )}

        {section === "protection" && (
          <>
            <FormRow title="What data should be restricted?" required>
              <RadioGroup
                aria-label="What data should be restricted"
                value={scope}
                onChange={(v) => {
                  setScope(v as ProtectionScope);
                  touch();
                }}
              >
                <RadioButton value="all" label={protectionMeta.all.label} hint={protectionMeta.all.description} />
                <RadioButton value="selected" label={protectionMeta.selected.label} hint={protectionMeta.selected.description} />
              </RadioGroup>
            </FormRow>
            {scope === "all" && rates && (
              <FormRow title="Data release" required={ratingsRequired} description="How records of this species are released, and who sees them as held.">
                {ratingFields("species")}
              </FormRow>
            )}
            {scope === "selected" && (
              <FormRow
                title="Attributes"
                required={chosenRemovals.length === 0}
                description={
                  chosenRemovals.length > 0
                    ? "The restriction as it should be. A record must match every attribute. For Location, add the places where the species is found that this applies to."
                    : "A record must match every attribute. For Location, add the places where the species is found that this applies to."
                }
              >
                <ConceptRows
                  noun="attribute"
                  allowEmpty={chosenRemovals.length > 0}
                  rows={rows}
                  options={NOMINATION_ATTRIBUTES}
                  onChange={(next) => {
                    setRows(next);
                    touch();
                  }}
                  renderBelow={(row, option, update) => (
                    <>
                      {option?.valueType === "areas" && (
                        <AreasEditor
                          areas={areas[row.id] ?? []}
                          invalid={showErrors("protection") && (areas[row.id] ?? []).length === 0}
                          renderArea={(area) => <>{rates && ratingFields(areaRatingKey(row.id, area.id))}</>}
                          onChange={(next) => {
                            setAreas((prev) => ({ ...prev, [row.id]: next }));
                            update({ values: next.map((a) => a.id) });
                            touch();
                          }}
                        />
                      )}
                      {/* This attribute's rating, once the attribute is chosen. */}
                      {rates && row.concept && row.concept !== "location" && ratingFields(String(row.id))}
                    </>
                  )}
                />
              </FormRow>
            )}
            {assessment}
          </>
        )}

        {section === "review" && (
          <div className="flex flex-col rounded-lg border border-secondary p-6">
            {/* What is protected reads as on the record page (ProtectionView): each reason written out once, over the items it
                covers, each with its rating. The species is its own row above, so the view leaves it out. */}
            {kind === "location" && (
              <SummaryRow title="Location" onEdit={() => setSection("location")}>
                <ProtectionView nomination={{ ...draft, ratings }} showRatings={rates} />
              </SummaryRow>
            )}
            {kind === "species" && (
              <>
                <SummaryRow title="Species" onEdit={() => setSection("species")}>
                  {species ? (
                    <div className="flex items-center gap-3">
                      <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-10" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-primary">{species.commonName}</span>
                        <span className="text-xs text-tertiary italic">{species.species}</span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-quaternary">Not provided</p>
                  )}
                </SummaryRow>
                <SummaryRow title="What to protect" onEdit={() => setSection("protection")}>
                  <ProtectionView nomination={{ ...draft, ratings }} showRatings={rates} />
                </SummaryRow>
                {(draft.risksOfNotReleasing || draft.publicDomain || (draft.attachments?.length ?? 0) > 0) && (
                  <SummaryRow title="Risks and evidence" onEdit={() => setSection("protection")}>
                    <AssessmentView nomination={draft} />
                  </SummaryRow>
                )}
              </>
            )}
          </div>
        )}
      </FormPage>

      <DestructiveModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={confirmBack}
        onOpenChange={setConfirmBack}
        title="Discard your nomination?"
        description={canDraft ? "You have unsaved changes to this nomination. Save a draft to keep them, or discard them." : "You have unsaved changes to this nomination. Leaving now will lose them."}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        secondaryLabel={canDraft ? "Save draft" : undefined}
        onSecondary={() => {
          setConfirmBack(false);
          saveDraft();
        }}
        onConfirm={() => {
          setConfirmBack(false);
          onBack();
        }}
      />
    </div>
  );
}
