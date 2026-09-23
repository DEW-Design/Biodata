"use client";

import { CheckCircle, ArrowRight } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthWordmark } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 39:601 ("Type=Account created") - signup's completion
// screen, leading into the 3-step profile wizard at /pages/auth/setup-profile.
export default function AccountCreatedPage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-2 text-center">
        <AuthWordmark />
        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
        <p className="text-xl font-semibold text-primary">Account Created!</p>
        <p className="text-base text-secondary">
          Your account has been successfully created.
          <br />
          Setup your profile details to access Biodata SA
        </p>
      </div>
      <Button color="primary" size="md" className="w-full" iconTrailing={ArrowRight} href="/pages/auth/setup-profile">
        Setup your profile
      </Button>
    </AuthShell>
  );
}
