"use client";

// Add Project - the 3-step project registration wizard reached from the "Add project" header
// button on every real page (dashboard, project-list, project-detail, observation-detail,
// observations - see app/pages/_shared/guest-action-gate.tsx's `GuestActionButton`, which now
// navigates here for a signed-in user instead of doing nothing).
//
// Figma: https://www.figma.com/design/YMproGZfrFB5jUqPHPxMhk (Biodata Wireframe Presentation - the
// same file already treated as this build's ground truth for the real BDBSA data model, see
// .claude/rules/ref-domain.md, "BDBSA domain research"), node 2298:179004 - a plain wireframe, not a styled
// reference, read for its own real IA (3 steps: Project Identification / Data Collection and
// Storage / Privacy and Restrictions; the 5 restriction types nested in step 3) rather than for any
// pixel/colour choice - the same "extract patterns, not pixels" treatment this file's own
// "BDBSA domain research"/`/pages/observations` sections already apply to this exact
// source. Every visual decision (the single-card wizard shell, the boxed-Accordion restriction
// list, the shared species/location picker panels) is this session's own design call, per the
// user's explicit request for "the design must come from you."
//
// No icon rail / contextual sidebar - a focused, single-purpose flow benefits from one clear focal
// point (see CONTEXT.md's cognitive-load design principles), not the double-sidebar shell every
// other /pages/** screen uses for open-ended browsing. Still carries the real persistent header
// (wordmark, breadcrumb, profile menu) so wayfinding/logout stay reachable, and still requires a
// real userRole (guests are gated inline below, same honesty convention as everywhere else in this
// build - a guest can still type this URL directly even though no real entry point ever sends one
// here).
//
// No real backend anywhere in this build - "Create Project" keeps the project in this browser's
// localStorage (created-projects-store.ts), shows the same real success screen Figma's own wireframe
// ends on, and "Go to Project" opens the project's page (/pages/project-detail/created?project=<id>).

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn01, Save01, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/application/toast/toast";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { RegistrationStepper } from "./stepper";
import { Step1ProjectDetails } from "./step-1-project-details";
import { Step2DataCollection } from "./step-2-data-collection";
import { Step3PrivacyRestrictions, isStep3Valid } from "./step-3-privacy-restrictions";
import { SuccessScreen } from "./success-screen";
import { createdProjectHref, saveCreatedProject, type CreatedProject } from "@/app/pages/_shared/created-projects-store";
import { initialProjectDetails, initialDataCollection, initialRestrictions } from "./types";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { RegistrationLayoutSwitcher } from "./layout-switcher";

function GuestGate() {
    const router = useRouter();
    const roleHref = useRoleHref();
    return (
        <div className="font-barlow flex min-h-screen w-full flex-col bg-secondary">
            <AppHeader
                section={
                    <Link href={roleHref("/pages/project-list")} className="hover:text-primary">
                        Projects
                    </Link>
                }
                current="Add project"
            />
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-lg font-semibold text-primary">Sign up to add a project</p>
                <p className="max-w-sm text-sm text-tertiary">Create a free BioData SA account to start contributing projects to South Australia&apos;s biodiversity record.</p>
                <div className="mt-2 flex gap-3">
                    <Button color="secondary" iconLeading={LogIn01} onClick={() => router.push("/pages/auth/login")}>
                        Log in
                    </Button>
                    <Button color="primary" iconLeading={UserPlus01} onClick={() => router.push("/pages/auth/signup")}>
                        Sign up
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ProjectRegistrationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = useUserRole();
    const roleHref = useRoleHref();
    const isPublicUser = role === "public-user";

    const stepParam = Number(searchParams.get("step"));
    const step = (stepParam === 2 ? 2 : stepParam === 3 ? 3 : 1) as 1 | 2 | 3;

    const [projectDetails, setProjectDetails] = useState(initialProjectDetails);
    const [dataCollection, setDataCollection] = useState(initialDataCollection);
    const [restrictions, setRestrictions] = useState(initialRestrictions);
    // The project once it is created: kept in localStorage, and where "Go to Project" leads.
    const [created, setCreated] = useState<CreatedProject | null>(null);
    // Set only by `RegistrationStepper`'s own onStepClick (jumping back to an already-completed
    // step) - `goToStep`'s normal forward callers (each step's own `onComplete`) never pass this,
    // so Step 2 still opens fresh at Question 1 the first time it's reached, exactly as before.
    // Consumed once as each step component's own `startAtReview` initial-state value; since that
    // component fully unmounts/remounts every time `step` changes away from and back to it, a
    // fresh read here on the next stepper click is all that's needed - no reset required.
    const [reviewOnEntry, setReviewOnEntry] = useState(false);

    if (isPublicUser)
        return (
            <>
                <GuestGate />
                <PrototypeTools />
                <RegistrationLayoutSwitcher current="option-1" />
            </>
        );

    const goToStep = (next: 1 | 2 | 3, opts?: { review?: boolean }) => {
        setReviewOnEntry(!!opts?.review);
        router.push(`/pages/project-registration?step=${next}&userRole=${role}`);
    };

    // Every step now owns its own per-question Back/Continue nav - Step 3's review card calls
    // this as its "Create Project" action.
    const handleSaveDraft = () => toast.brand("Draft saved", { description: "This is a demo build with no real backend - nothing is actually persisted." });
    const handleCreateProject = () => {
        if (!isStep3Valid(restrictions)) return;
        setCreated(saveCreatedProject({ details: projectDetails, collection: dataCollection, restrictions }));
    };

    return (
        <div className="font-barlow min-h-screen w-full bg-secondary">
            <PrototypeTools />
            <RegistrationLayoutSwitcher current="option-1" />
            <AppHeader
              section={
                <Link href={roleHref("/pages/project-list")} className="hover:text-primary">
                  Projects
                </Link>
              }
              current="Add project"
            />

            <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                {created ? (
                    <div className="rounded-2xl border border-secondary bg-primary p-8">
                        <SuccessScreen
                            projectName={projectDetails.shortTitle || "Untitled project"}
                            onGoToProject={() => router.push(roleHref(createdProjectHref(created.id)))}
                        />
                    </div>
                ) : (
                    <>
                        {/* Cancel/Save Draft stay reachable on every step, like a Typeform-style
                            flow's persistent exit/save affordance. */}
                        <div className="flex items-center justify-end gap-3">
                            <Button color="link-gray" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button iconLeading={Save01} color="secondary" onClick={handleSaveDraft}>
                                Save Draft
                            </Button>
                        </div>
                        <div className="rounded-2xl border border-secondary bg-primary p-6">
                            <RegistrationStepper currentStep={step} onStepClick={(target) => goToStep(target, { review: true })} />
                        </div>

                        <div className="rounded-2xl border border-secondary bg-primary p-8 sm:p-12">
                            {step === 1 && <Step1ProjectDetails value={projectDetails} onChange={setProjectDetails} onComplete={() => goToStep(2)} startAtReview={reviewOnEntry} />}
                            {step === 2 && <Step2DataCollection value={dataCollection} onChange={setDataCollection} onComplete={() => goToStep(3)} startAtReview={reviewOnEntry} />}
                            {step === 3 && <Step3PrivacyRestrictions value={restrictions} onChange={setRestrictions} onBackToPreviousStep={() => goToStep(2, { review: true })} onComplete={handleCreateProject} />}

                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default function ProjectRegistrationPage() {
    return (
        <Suspense fallback={null}>
            <ProjectRegistrationForm />
        </Suspense>
    );
}
