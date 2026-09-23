"use client";

// Add Project - the 3-step project registration wizard reached from the "Add project" header
// button on every real page (dashboard, project-list, project-detail, observation-detail,
// observations - see app/pages/_shared/guest-action-gate.tsx's `GuestActionButton`, which now
// navigates here for a signed-in user instead of doing nothing).
//
// Figma: https://www.figma.com/design/YMproGZfrFB5jUqPHPxMhk (Biodata Wireframe Presentation - the
// same file already treated as this build's ground truth for the real BDBSA data model, see
// CONTEXT.md's "BDBSA domain research"), node 2298:179004 - a plain wireframe, not a styled
// reference, read for its own real IA (3 steps: Project Identification / Data Collection and
// Storage / Privacy and Restrictions; the 5 restriction types nested in step 3) rather than for any
// pixel/colour choice - the same "extract patterns, not pixels" treatment this file's own
// "BDBSA domain research"/`/pages/observations/option-1` sections already apply to this exact
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
// No real backend anywhere in this build - "Create Project" doesn't persist anything. It shows the
// same real success screen Figma's own wireframe ends on, and "Skip and Go to Project" honestly
// routes to the real Projects list (there's no new detail page to send it to - same "no match, no
// substitute" call this build already makes for e.g. the map search's own "Go to project" action).

import { Suspense, useState } from "react";
import { Button as AriaButton, Dialog, DialogTrigger } from "react-aria-components";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LogIn01, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Popover } from "@/components/base/select/popover";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { toast } from "@/components/application/toast/toast";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { registeredUserAccountMenu } from "@/lib/registered-user-nav";
import { RegistrationStepper } from "./stepper";
import { Step1ProjectDetails } from "./step-1-project-details";
import { Step2DataCollection } from "./step-2-data-collection";
import { Step3PrivacyRestrictions, isStep3Valid } from "./step-3-privacy-restrictions";
import { SuccessScreen } from "./success-screen";
import { initialProjectDetails, initialDataCollection, initialRestrictions } from "./types";
import { cx } from "@/utils/cx";

function ProfileMenu() {
    const [open, setOpen] = useState(false);
    return (
        <DialogTrigger onOpenChange={setOpen}>
            <AriaButton className="flex items-center gap-1 rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">
                <Avatar size="md" initials="OW" alt="Olivia Wyatt" />
                <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
            </AriaButton>
            <Popover size="sm" className="w-48 p-1">
                <Dialog className="outline-hidden">
                    <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
                    {registeredUserAccountMenu.map((item) => (
                        <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
                            {item}
                        </p>
                    ))}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
}

function GuestGate() {
    const router = useRouter();
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-secondary p-6 text-center">
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
    const [created, setCreated] = useState(false);
    // Set only by `RegistrationStepper`'s own onStepClick (jumping back to an already-completed
    // step) - `goToStep`'s normal forward callers (each step's own `onComplete`) never pass this,
    // so Step 2 still opens fresh at Question 1 the first time it's reached, exactly as before.
    // Consumed once as each step component's own `startAtReview` initial-state value; since that
    // component fully unmounts/remounts every time `step` changes away from and back to it, a
    // fresh read here on the next stepper click is all that's needed - no reset required.
    const [reviewOnEntry, setReviewOnEntry] = useState(false);

    if (isPublicUser) return <GuestGate />;

    const goToStep = (next: 1 | 2 | 3, opts?: { review?: boolean }) => {
        setReviewOnEntry(!!opts?.review);
        router.push(`/pages/project-registration?step=${next}&userRole=${role}`);
    };

    // Every step now owns its own per-question Back/Continue nav - Step 3's review card calls
    // this as its "Create Project" action.
    const handleSaveDraft = () => toast.brand("Draft saved", { description: "This is a demo build with no real backend - nothing is actually persisted." });
    const handleCreateProject = () => {
        if (!isStep3Valid(restrictions)) return;
        setCreated(true);
    };

    return (
        <div className="min-h-screen w-full bg-secondary">
            <header className="flex h-[90px] items-center justify-between border-b border-secondary bg-primary px-8">
                <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/pages/dashboard/gov-sa-dew-lockup.png" alt="Government of South Australia, Department for Environment and Water" className="h-[37px] w-auto" />
                    <div className="h-6 w-px bg-secondary" />
                    <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
                    <Breadcrumb section="Projects" current="Add Project" />
                </div>
                <div className="flex items-center gap-3">
                    {/* All 3 steps own their own per-card Back/Continue nav (see
                        Step1ProjectDetails/Step2DataCollection/Step3PrivacyRestrictions) - no
                        standard footer renders for any of them, so Cancel/Save Draft stay reachable here instead, the same way a
                        Typeform-style flow keeps a persistent exit/save affordance rather than
                        burying it behind the last screen of a sequence. */}
                    {!created && (
                        <>
                            <Button color="link-gray" size="sm" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button color="secondary" size="sm" onClick={handleSaveDraft}>
                                Save Draft
                            </Button>
                        </>
                    )}
                    <ProfileMenu />
                </div>
            </header>

            <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                {created ? (
                    <div className="rounded-2xl border border-secondary bg-primary p-8">
                        <SuccessScreen
                            projectName={projectDetails.shortTitle || "Untitled project"}
                            onGoToProjects={() => router.push(roleHref("/pages/project-list/option-1"))}
                        />
                    </div>
                ) : (
                    <>
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
