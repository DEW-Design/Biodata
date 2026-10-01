"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// "Upload dataset" for one project, wherever it appears (the project card, the Project at a glance
// Datasets cell, the Datasets page). Everyone sees it; a public user gets the sign-up prompt instead
// of the upload page (visible but gated, like the header's Add menu).
export function UploadDatasetButton({
  projectId,
  label = "Upload dataset",
  color = "secondary",
  size = "sm",
  iconOnly = false,
}: {
  projectId: string;
  label?: string;
  color?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md";
  /** Just the icon, with the label as its tooltip and accessible name. */
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState(false);
  const onPress = () => (isGuest ? setGate(true) : router.push(roleHref(`/pages/project-list/${projectId}/upload`)));
  return (
    <>
      {iconOnly ? (
        <Tooltip title={label}>
          <Button color={color} size={size} iconLeading={Upload01} aria-label={label} onPress={onPress} />
        </Tooltip>
      ) : (
        <Button color={color} size={size} iconLeading={Upload01} onPress={onPress}>
          {label}
        </Button>
      )}
      <SignUpPromptModal
        isOpen={gate}
        onOpenChange={setGate}
        icon={Upload01}
        title="Sign up to upload a dataset"
        description="Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record."
      />
    </>
  );
}
