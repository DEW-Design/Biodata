"use client";

import { Focusable } from "react-aria-components";
import { CheckCircle, Download01, Upload01, Database01, FileSearch02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tooltip } from "@/components/base/tooltip/tooltip";

const NEXT_STEPS = [
    { icon: Download01, title: "Download recommended Standard Templates", description: "Access pre-configured templates and standards to help you quickly set up biodiversity monitoring activities and maintain consistency." },
    { icon: Upload01, title: "Upload Dataset", description: "Import field observations, survey data, and existing records into your project from supported file formats." },
    { icon: Database01, title: "Data Access and Management", description: "View, organise, edit, and manage your project datasets, observations, and monitoring activities in one place." },
    { icon: FileSearch02, title: "Data Extraction - Reports", description: "Generate reports and export project data for analysis, sharing, compliance, or stakeholder reporting." },
];

export function SuccessScreen({ projectName, onGoToProjects }: { projectName: string; onGoToProjects: () => void }) {
    return (
        <div className="flex w-full flex-col items-center gap-8 py-6 text-center">
            <div className="flex flex-col items-center gap-3">
                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                <div className="flex max-w-sm flex-col gap-2">
                    <p className="text-xl font-semibold text-primary">Project Created!</p>
                    <p className="text-base text-tertiary">
                        Your project &lsquo;<span className="font-semibold">{projectName}</span>&rsquo; has been successfully created.
                    </p>
                </div>
            </div>

            <div className="flex w-full max-w-lg flex-col gap-6 text-left">
                <p className="text-xl font-semibold text-secondary">What can you do Next?</p>
                <div className="flex flex-col gap-6 border-t border-secondary pt-6">
                    {NEXT_STEPS.map((step, i) => (
                        <div key={step.title} className="flex items-start gap-4">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-secondary text-base font-semibold text-secondary">{i + 1}</span>
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-semibold text-secondary">{step.title}</p>
                                <p className="text-base text-secondary">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex w-full max-w-lg flex-col items-center gap-4 border-t border-secondary pt-6">
                <Tooltip title="Guided walkthroughs aren't built yet - coming soon.">
                    <Focusable>
                        <span className="inline-flex w-full">
                            <Button color="primary" size="md" className="w-full" isDisabled>
                                Learn How
                            </Button>
                        </span>
                    </Focusable>
                </Tooltip>
                <Button color="link-gray" size="sm" onClick={onGoToProjects}>
                    Skip and Go to Project
                </Button>
            </div>
        </div>
    );
}
