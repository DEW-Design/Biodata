"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthWordmark } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 39:704 ("Type=Password reset success"). "Sign in with
// new password" carries the email forward so /pages/auth/login renders its password-only
// "Existing account" variant (node 41:324) instead of asking for the email again.
function ResetSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-2 text-center">
        <AuthWordmark />
        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
        <p className="text-xl font-semibold text-primary">Password Reset</p>
        <p className="text-base text-secondary">Your password has been successfully reset.</p>
      </div>
      <Button color="primary" size="md" className="w-full" href={`/pages/auth/login?email=${encodeURIComponent(email)}`}>
        Sign in with new password
      </Button>
    </AuthShell>
  );
}

export default function ResetSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ResetSuccessContent />
    </Suspense>
  );
}
