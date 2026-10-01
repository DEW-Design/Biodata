"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit05, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal } from "@/components/application/modals/modal";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { FormSectionList, FormSidebar, deriveSectionStatus } from "@/app/pages/_shared/form-section-list";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SpeciesField } from "@/app/pages/_shared/species-picker";
import { AreaList, AreasEditor } from "@/app/pages/_shared/nominations/nomination-areas";
import {
  NOMINATION_ATTRIBUTES,
  NOMINATION_SECTION_ORDER,
  attributeLabel,
  attributeValueLabel,
  fromEditorRows,
  isOpenNomination,
  missingForNomination,
  nominationSections,
  nominationStatusMeta,
  protectionMeta,
  speciesFor,
  toEditorRows,
  type Nomination,
  type NominationArea,
  type NominationDraft,
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
// becomes four sections: Species (its left-hand picker, moved into main), What to protect (Data
// Protection Rules and the attribute rows), Justification, and Review. The attribute editor is the
// project flow's own ConceptRows, labelled "attribute" here as the lo-fi says, with Location as a
// set of areas. Mandatory details block Continue for the section being left, never ahead of it.

// Species is the shared SpeciesField (app/pages/_shared/species-picker.tsx): a combo box grouped
// by species group, then a summary card with Change. The notes under the card are this form's own.
function SpeciesPicker({ value, onChange, excludeNominationId, isInvalid }: { value: string; onChange: (id: string) => void; excludeNominationId?: string; isInvalid?: boolean }) {
  const nominations = useNominations();
  const router = useRouter();
  const roleHref = useRoleHref();

  const openBySpecies = useMemo(() => {
    const map = new Map<string, Nomination>();
    for (const n of nominations) if (n.id !== excludeNominationId && isOpenNomination(n)) map.set(n.speciesId, n);
    return map;
  }, [nominations, excludeNominationId]);

  return (
    <SpeciesField
      value={speciesFor(value)}
      onChange={(s) => onChange(s?.id ?? "")}
      isInvalid={isInvalid}
      statusFor={(s) => (openBySpecies.has(s.id) ? "Nominated" : s.alreadySensitive ? "Restricted" : undefined)}
      notes={(selected) => {
        const restrictions = selected.alreadySensitive ? existingRestrictionsForSpecies(selected.id) : [];
        const open = openBySpecies.get(selected.id);
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
  onBack,
  onSaveDraft,
  onSubmit,
}: {
  initial?: Nomination;
  onBack: () => void;
  onSaveDraft: (draft: NominationDraft) => void;
  onSubmit: (draft: NominationDraft) => void;
}) {
  const [speciesId, setSpeciesId] = useState(initial?.speciesId ?? "");
  const [scope, setScope] = useState<ProtectionScope>(initial?.scope ?? "selected");
  const [editor] = useState(() => toEditorRows(initial?.attributes ?? []));
  const [rows, setRows] = useState<ConceptValueRow[]>(editor.rows);
  const [areas, setAreas] = useState<Record<number, NominationArea[]>>(editor.areas);
  const [justification, setJustification] = useState(initial?.justification ?? "");
  const [section, setSection] = useState<NominationSection>(initial ? "review" : "species");
  const [visited, setVisited] = useState<Set<NominationSection>>(() => new Set(initial ? NOMINATION_SECTION_ORDER : []));
  const [blocked, setBlocked] = useState<Set<NominationSection>>(new Set());
  const [submitPressed, setSubmitPressed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  const touch = () => setDirty(true);
  const draft: NominationDraft = { speciesId, scope, attributes: scope === "selected" ? fromEditorRows(rows, areas) : [], justification };
  const nominations = useNominations();
  // A species with an open nomination (other than this one) can't be nominated again: the species
  // section counts it as unresolved, so Continue, jumping ahead, Save draft and Submit all refuse.
  const duplicateOf = speciesId ? nominations.find((n) => n.id !== initial?.id && n.speciesId === speciesId && isOpenNomination(n)) : undefined;
  const baseMissing = missingForNomination(draft);
  const missing = duplicateOf ? { ...baseMissing, species: [...baseMissing.species, "Choose a species without an open nomination"] } : baseMissing;
  const index = NOMINATION_SECTION_ORDER.indexOf(section);
  const isLast = section === "review";
  const allMissing = NOMINATION_SECTION_ORDER.flatMap((id) => missing[id]);
  const showErrors = (id: NominationSection) => submitPressed || blocked.has(id);
  const status = initial?.status;
  const isEditingLive = status === "submitted";
  const isResubmit = status === "returned";
  const canDraft = !isEditingLive && !isResubmit;

  const goTo = (next: NominationSection) => {
    setVisited((v) => new Set(v).add(section));
    setSection(next);
  };
  // Continue, and jumping ahead in column 2, refuse to leave a section with mandatory details missing.
  const proceed = (next: NominationSection) => {
    if (NOMINATION_SECTION_ORDER.indexOf(next) > index && missing[section].length > 0) {
      setBlocked((b) => new Set(b).add(section));
      return;
    }
    goTo(next);
  };

  const submit = () => {
    setSubmitPressed(true);
    const first = NOMINATION_SECTION_ORDER.find((id) => missing[id].length > 0);
    if (first) {
      setSection(first);
      return;
    }
    onSubmit(draft);
  };

  const saveDraft = () => {
    if (!speciesId || duplicateOf) {
      setBlocked((b) => new Set(b).add("species"));
      setSection("species");
      return;
    }
    onSaveDraft(draft);
  };

  const sectionItems = NOMINATION_SECTION_ORDER.map((id) => {
    const count = id === "review" ? allMissing.length : missing[id].length;
    return {
      id,
      title: nominationSections[id].title,
      status: deriveSectionStatus({ isCurrent: id === section, isValid: count === 0, visited: visited.has(id), attempted: showErrors(id) }),
      detail: showErrors(id) && count > 0 && id !== section ? `${count} to fix` : undefined,
    };
  });

  // On the species step the duplicate's own error note is its message, so the "Details missing" alert
  // doesn't repeat it (CONTRACTS 4.1: one message per fact).
  const sectionProblems = section === "species" ? baseMissing.species : missing[section];
  const problems = section === "review" ? (submitPressed ? allMissing : []) : showErrors(section) ? sectionProblems : [];
  const title = initial ? (isResubmit ? `Update ${initial.id}` : isEditingLive ? `Edit ${initial.id}` : `Edit draft ${initial.id}`) : "New nomination";
  const species = speciesFor(speciesId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormSidebar>
        <FormSectionList
          heading="Sensitive species nomination"
          groups={[{ sections: sectionItems }]}
          progress={{ done: sectionItems.filter((i) => i.status === "complete").length, total: NOMINATION_SECTION_ORDER.length }}
          onSelect={(id) => proceed(id as NominationSection)}
        />
      </FormSidebar>

      <FormPage
        eyebrow={`${title} - Step ${index + 1} of ${NOMINATION_SECTION_ORDER.length}`}
        title={nominationSections[section].title}
        subtitle={`${nominationSections[section].description}${section === "review" ? "" : " A draft only needs the species."}`}
        onCancel={() => (dirty ? setConfirmBack(true) : onBack())}
        onSaveDraft={canDraft ? saveDraft : undefined}
        onBack={index > 0 ? () => goTo(NOMINATION_SECTION_ORDER[index - 1]) : undefined}
        problems={problems.length ? { items: problems } : undefined}
        primaryLabel={isLast ? (isEditingLive ? "Save changes" : isResubmit ? "Resubmit nomination" : "Submit nomination") : "Continue"}
        primaryIsContinue={!isLast}
        onPrimary={isLast ? submit : () => proceed(NOMINATION_SECTION_ORDER[index + 1])}
      >
        {section === "species" && (
          <FormRow title="Species" required description="Search by common name, scientific name or family.">
            <SpeciesPicker
              isInvalid={showErrors("species") && !speciesId}
              value={speciesId}
              excludeNominationId={initial?.id}
              onChange={(id) => {
                setSpeciesId(id);
                touch();
              }}
            />
          </FormRow>
        )}

        {section === "protection" && (
          <>
            <FormRow title="What should be protected?" required>
              <RadioGroup
                aria-label="What should be protected"
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
            {scope === "selected" && (
              <FormRow title="Attributes" required description="Choose each attribute and its value. For Location, add the places whose records should be obscured.">
                <ConceptRows
                  noun="attribute"
                  rows={rows}
                  options={NOMINATION_ATTRIBUTES}
                  onChange={(next) => {
                    setRows(next);
                    touch();
                  }}
                  renderBelow={(row, option, update) =>
                    option?.valueType === "areas" ? (
                      <AreasEditor
                        areas={areas[row.id] ?? []}
                        invalid={showErrors("protection") && (areas[row.id] ?? []).length === 0}
                        onChange={(next) => {
                          setAreas((prev) => ({ ...prev, [row.id]: next }));
                          update({ values: next.map((a) => a.id) });
                          touch();
                        }}
                      />
                    ) : null
                  }
                />
              </FormRow>
            )}
          </>
        )}

        {section === "justification" && (
          <FormRow title="Justification" required description="What puts this species at risk if its records stay public, and what protecting them would prevent.">
            <TextArea
              aria-label="Justification"
              rows={6}
              placeholder="Enter a justification…"
              value={justification}
              isInvalid={showErrors("justification") && !justification.trim()}
              hint={showErrors("justification") && !justification.trim() ? "Enter a justification" : undefined}
              onChange={(v) => {
                setJustification(v);
                touch();
              }}
            />
          </FormRow>
        )}

        {section === "review" && (
          <div className="flex flex-col rounded-lg border border-secondary p-6">
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
              <p className="text-sm text-secondary">{protectionMeta[scope].label}</p>
              {scope === "selected" && (
                <dl className="m-0 flex flex-col gap-3">
                  {draft.attributes.map((a) => (
                    <div key={a.id} className="flex flex-col gap-2">
                      <div className="grid grid-cols-[minmax(0,12rem)_1fr] gap-4 text-sm">
                        <dt className="text-tertiary">{attributeLabel(a)}</dt>
                        <dd className="m-0 text-primary">{attributeValueLabel(a) || <span className="text-quaternary">Not provided</span>}</dd>
                      </div>
                      {a.attribute === "location" && a.areas.length > 0 && <AreaList areas={a.areas} />}
                    </div>
                  ))}
                </dl>
              )}
            </SummaryRow>
            <SummaryRow title="Justification" onEdit={() => setSection("justification")}>
              <p className={justification.trim() ? "text-sm whitespace-pre-line text-secondary" : "text-sm text-quaternary"}>{justification.trim() || "Not provided"}</p>
            </SummaryRow>
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
