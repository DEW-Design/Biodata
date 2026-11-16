"use client";

import { ArrowNarrowRight, BarChart01, CheckCircle, Database01, Download01, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

// What can be done next, in any order: each is marked with what it is, not a number, so it does not read as a sequence (the
// designer, 25 Oct 2026). Reports take the Reports icon, as in the rail (nav-icons.ts).
// The confirmation after Create project. Laid out as the shared empty state is (`ListEmptyState`: a featured icon, a heading, one line, the action)
// at the flow's own type sizes (it was 20px and 16px, with a full-width button, until 11 Nov 2026), then what can be done next as a plain list.
// Sentence case throughout.
const NEXT_STEPS = [
    { icon: Download01, title: "Download recommended standard templates", description: "Access pre-configured templates and standards to help you quickly set up biodiversity monitoring activities and maintain consistency." },
    { icon: Upload01, title: "Upload dataset", description: "Import field observations, survey data, and existing records into your project from supported file formats." },
    { icon: Database01, title: "Data access and management", description: "View, organise, edit, and manage your project datasets, observations, and monitoring activities in one place." },
    { icon: BarChart01, title: "Data extraction - reports", description: "Generate reports and export project data for analysis, sharing, compliance, or stakeholder reporting." },
];

export function SuccessScreen({ projectName, onGoToProject }: { projectName: string; onGoToProject: () => void }) {
    return (
        <div className="flex w-full flex-col items-center gap-8 py-6">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex max-w-md flex-col items-center gap-4">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                    <div className="flex flex-col gap-2">
                        <h1 className="m-0 text-lg font-semibold text-primary">Project created!</h1>
                        <p className="m-0 text-sm text-balance text-tertiary">
                            Your project &lsquo;<span className="font-semibold text-secondary">{projectName}</span>&rsquo; has been successfully created.
                        </p>
                    </div>
                </div>
                <Button iconTrailing={ArrowNarrowRight} color="primary" size="md" onClick={onGoToProject}>
                    Go to project
                </Button>
            </div>

            <div className="flex w-full max-w-lg flex-col gap-4 border-t border-secondary pt-6">
                <h2 className="m-0 text-sm font-semibold text-primary">What can you do next?</h2>
                <ul className="m-0 flex list-none flex-col gap-4 p-0">
                    {NEXT_STEPS.map((step) => (
                        <li key={step.title} className="flex items-start gap-3">
                            <FeaturedIcon icon={step.icon} theme="modern" color="gray" size="md" className="shrink-0" />
                            <div className="flex flex-col gap-0.5">
                                <p className="m-0 text-sm font-medium text-primary">{step.title}</p>
                                <p className="m-0 text-sm text-balance text-tertiary">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
