"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 39:555 ("Type=Password email") - "check your email"
// confirmation after requesting a reset link. Figma's own design has no in-app continue button
// here at all - it assumes the user clicks a real emailed link, which this no-backend build can't
// send. Added one honestly-labelled dev-only link below (not part of the Figma copy) so the flow
// stays navigable in this preview, same "say what's not real" convention as `GuestActionButton`'s
// toast and `DisabledQuickAction`'s tooltip elsewhere in this codebase.
function CheckEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <AuthShell>
      <AuthHeader
        title="Check your email"
        description={
          <>
            We sent a password reset link to:
            <br />
            <span className="font-semibold">{email || "your email address"}</span>
          </>
        }
      />
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex items-baseline justify-center gap-1 text-sm">
          <p className="text-tertiary">Didn&rsquo;t receive a code?</p>
          <Button color="link-gray" size="sm">
            Resend
          </Button>
        </div>
        <Button color="link-gray" size="sm" iconLeading={ArrowLeft} href="/pages/auth/login">
          Back to Sign in
        </Button>
        <div className="flex w-full flex-col items-center gap-1 rounded-lg border border-secondary bg-secondary p-3 text-center">
          <p className="text-xs text-tertiary">This preview has no real email delivery.</p>
          <Button color="link-color" size="sm" href={`/pages/auth/reset-password?email=${encodeURIComponent(email)}`}>
            Continue to reset your password
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailForm />
    </Suspense>
  );
}
