"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader, AuthDivider } from "@/app/pages/auth/_shared/auth-shell";
import { OtpInput } from "@/app/pages/auth/_shared/otp-input";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 26:2338 ("Type=Enter Code") - step 2 of signup, a
// 6-digit code sent to the email carried forward from /pages/auth/signup.
function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/pages/auth/set-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell>
      <AuthHeader
        title="Check your email"
        description={
          <>
            We&rsquo;ve sent an email with your code to:
            <br />
            <span className="font-semibold">{email || "your email address"}</span>
          </>
        }
      />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <OtpInput value={code} onChange={setCode} />
        <div className="flex flex-col gap-6">
          <Button type="submit" color="primary" size="md" className="w-full" isDisabled={code.length < 6}>
            Continue
          </Button>
          <div className="flex items-baseline justify-center gap-1 text-sm">
            <p className="text-tertiary">Didn&rsquo;t receive a code?</p>
            <Button color="link-gray" size="sm" onClick={() => setCode("")}>
              Resend
            </Button>
          </div>
          <AuthDivider />
          <div className="flex items-baseline justify-center gap-1 text-sm">
            <p className="text-tertiary">Already have an account?</p>
            <Button color="link-gray" size="sm" href="/pages/auth/login">
              Sign in
            </Button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
