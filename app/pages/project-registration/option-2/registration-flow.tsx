"use client";

// Add Project, option 1 (at /pages/project-registration since 16 Oct 2026; it was the second layout): the three-column
// structure every other screen here uses. Column 1 is
// the primary icon rail, column 2 is the section list (progress + where you are + what needs
// attention), column 3 is the form for the current section. Compared against the first layout (one
// question per card, no rail or sidebar) with the floating options control - see context/decisions/2026-09-25-02-add-project-gets-a-second-layout-at-pages.md.
//
// What changed from the first layout, and why:
// - Related fields share a screen (project name + abstract + dates; owner + contact + role + managers)
//   instead of one question per card, so 14 cards become 5 sections plus one per restriction kind.
// - Column 2 lists every section with its state (current, complete, needs attention, not started),
//   and any section can be opened at any time - the first layout only ever moved forward or back.
// - Required fields explain themselves inline, but only after Continue is pressed with something
//   missing; nothing goes red while a person is still on their first answer.
// - Optional details (permits, targeted species, URI/DOI, limitations) sit in one collapsed
//   accordion instead of a row of "+ Add" buttons, and Review lists what is still missing with a
//   link to each section.
// - Every control is a real DEW component (RadioGroup, Checkbox, Select, TextArea, Accordion); the
//   bespoke choice tiles are gone.
//
// It is version 2 of that layout (the designer, 9 Oct 2026): a short project name with a character limit, one Project
// contacts list with a role per person, focus areas in Method and details, no survey type, one Methodology question
// (Incidental observations, Systematic or Not recorded; Systematic adds each methodology used, one at a time, with its
// note), and the map's Expand dialog. Version 1 was retired on 16 Oct 2026 (the designer: "keep only version 2"), so there
// is no Version tool; its rules stay in sections.ts for the project page's edit form. See sections.ts's `FormVersion`.
//
// The Pre-fill sample content switch on the Prototype tools bar fills every section with sample-content.ts, for showing the
// form to stakeholders, and switching it off puts back what was there.
//
// Same form state, validation rules, restriction editors and success screen as the first layout.
// No backend: "Create project" keeps the project in this browser's localStorage (created-projects-store.ts),
// and Save draft says it persists nothing.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LogIn01, Trash01, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { FormPage } from "@/app/pages/_shared/form-page";
import { createdProjectHref, saveCreatedProject, type CreatedProject } from "@/app/pages/_shared/created-projects-store";
import { useSampleContent } from "@/app/_prototype-tools/sample-content";
import { sampleProjectForm } from "../sample-content";
import { SuccessScreen } from "../success-screen";
import { initialDataCollection, initialProjectDetails, initialRestrictions } from "../types";
import { SectionFields } from "./form-sections";
import { RegistrationProgress } from "./registration-progress";
import { RegistrationShell } from "./registration-shell";
import { ReviewSection } from "./review-section";
import { isFormValid, isSectionValid, missingFields, sectionMeta, STEP_TITLES, toSavedForm, visibleSections, type FormState, type FormVersion, type SectionId } from "./sections";

const BASE_PATH = "/pages/project-registration";
const version: FormVersion = 2;

function GuestPrompt() {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Sign up to add a project</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">Create a free BioData SA account to start contributing projects to South Australia&apos;s biodiversity record.</p>
      <div className="flex gap-3">
        <Button color="secondary" iconLeading={LogIn01} href="/pages/auth/login">
          Log in
        </Button>
        <Button color="primary" iconLeading={UserPlus01} href="/pages/auth/signup">
          Sign up
        </Button>
      </div>
      <Button color="link-gray" size="sm" href={roleHref("/pages/project-list")}>
        Back to projects
      </Button>
    </div>
  );
}

export function RegistrationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleHref = useRoleHref();

  const [state, setState] = useState<FormState>(() => ({ details: initialProjectDetails(), collection: initialDataCollection(), restrictions: initialRestrictions() }));
  const [dirty, setDirty] = useState(false);
  const [visited, setVisited] = useState<Set<SectionId>>(new Set());
  const [attempted, setAttempted] = useState<Set<SectionId>>(new Set());
  // The project once it is created: kept in localStorage, and where "Go to Project" leads.
  const [created, setCreated] = useState<CreatedProject | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const sections = visibleSections(state.restrictions);
  const requested = searchParams.get("section") as SectionId | null;
  const current: SectionId = requested && sections.includes(requested) ? requested : "basics";
  const index = sections.indexOf(current);
  const meta = sectionMeta(current, version);

  const update = (next: FormState) => {
    setState(next);
    setDirty(true);
  };
  const mark = (set: Set<SectionId>, id: SectionId) => new Set(set).add(id);

  const goTo = (id: SectionId) => {
    // Moving forward past a section with mandatory details missing is not allowed: the section is
    // marked, its "Details missing" alert appears, and the form stays put. Going back is always free.
    if (sections.indexOf(id) > index && current !== "review" && !isSectionValid(current, state, version)) {
      setAttempted((a) => mark(a, current));
      return;
    }
    // Leaving a section counts it as visited, so column 2 can show it as complete.
    setVisited((v) => mark(v, current));
    router.push(roleHref(`${BASE_PATH}?section=${id}`));
  };

  const showErrors = attempted.has(current);
  const currentValid = isSectionValid(current, state, version);

  const handleContinue = () => {
    if (!currentValid) {
      setAttempted((a) => mark(a, current));
      return;
    }
    setVisited((v) => mark(v, current));
    router.push(roleHref(`${BASE_PATH}?section=${sections[index + 1]}`));
  };

  const handleCreate = () => {
    if (!isFormValid(state, version)) {
      const missing = sections.filter((id) => id !== "review" && !isSectionValid(id, state, version));
      setAttempted((a) => new Set([...a, ...missing]));
      router.push(roleHref(`${BASE_PATH}?section=${missing[0]}`));
      return;
    }
    setCreated(saveCreatedProject(toSavedForm(state, version), role));
  };

  const handleCancel = () => (dirty ? setConfirmCancel(true) : router.push(roleHref("/pages/project-list")));
  const handleSaveDraft = () => toast.brand("Draft saved", { description: "This is a demo build with no real backend - nothing is actually persisted." });

  const role = useUserRole();
  const isGuest = role === "public-user";

  // A fresh key each time the sample goes in or comes out, so fields that keep their own state (the full title's tick,
  // the extent picker's tab) show the new content.
  const sampleKey = useSampleContent({
    value: state,
    onChange: (next) => {
      setState(next);
      setDirty(true);
    },
    sample: sampleProjectForm,
    enabled: !isGuest && !created,
  });

  const sidebar = isGuest ? (
    <div className="flex flex-col gap-1">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Add project</p>
      <p className="px-3 text-sm text-balance text-tertiary">Adding a project needs a BioData SA account. Once you have one, each section of the form is listed here.</p>
    </div>
  ) : (
    (close: () => void) => (
      <RegistrationProgress
        sections={sections}
        current={created ? "review" : current}
        state={state}
        visited={created ? new Set(sections) : visited}
        attempted={attempted}
        version={version}
        onSelect={(id) => {
          close();
          if (!created) goTo(id);
        }}
      />
    )
  );

  let main;
  if (isGuest) main = <GuestPrompt />;
  else if (created) {
    main = (
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <SuccessScreen projectName={state.details.shortTitle || "Untitled project"} onGoToProject={() => router.push(roleHref(createdProjectHref(created.id)))} />
      </div>
    );
  } else {
    main = (
      <FormPage
        eyebrow={meta.step ? `Step ${meta.step} of 3 - ${STEP_TITLES[meta.step]}` : undefined}
        title={meta.title}
        subtitle={meta.description}
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
        onBack={index > 0 ? () => goTo(sections[index - 1]) : undefined}
        problems={
          current === "review"
            ? { items: missingFields("review", state, version), extra: "Use Edit on a row below to fix them." }
            : showErrors && !currentValid
              ? { items: missingFields(current, state, version) }
              : undefined
        }
        primaryLabel={current === "review" ? "Create project" : "Continue"}
        primaryIsContinue={current !== "review"}
        onPrimary={current === "review" ? handleCreate : handleContinue}
      >
        {current === "review" ? <ReviewSection state={state} onEdit={goTo} version={version} /> : <SectionFields key={sampleKey} id={current} state={state} onChange={update} showErrors={showErrors} version={version} />}
      </FormPage>
    );
  }

  return (
    <>
      <RegistrationShell sidebar={sidebar}>{main}</RegistrationShell>
      <DestructiveModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Discard this project?"
        description="You have unsaved details. Save a draft to keep them, or discard them."
        confirmLabel="Discard project"
        cancelLabel="Keep editing"
        secondaryLabel="Save draft"
        onSecondary={() => {
          setConfirmCancel(false);
          handleSaveDraft();
        }}
        onConfirm={() => {
          setConfirmCancel(false);
          router.push(roleHref("/pages/project-list"));
        }}
      />
    </>
  );
}
