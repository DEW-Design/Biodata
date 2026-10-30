"use client";

import { useFeatureAccess } from "@/lib/use-feature-access";
import { RegistrationFlow } from "../option-2/registration-flow";
import { useDatasetStep } from "./dataset-step";

// Add Project option 2: option 1's flow with a Datasets step after the geographic extent. The step's state (the file queue and the answers) is
// kept here, above the flow, so it survives going to another section and coming back. A role that cannot upload a dataset
// (`datasetUpload`) has no Dataset step and gets option 1's sections, at this route.
export function DatasetRegistrationFlow() {
  const datasetStep = useDatasetStep();
  const canUpload = useFeatureAccess("datasetUpload");
  return <RegistrationFlow datasetStep={canUpload ? datasetStep : undefined} basePath="/pages/project-registration/option-2" />;
}
