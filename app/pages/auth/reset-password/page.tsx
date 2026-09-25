"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader, AuthDivider } from "@/app/pages/auth/_shared/auth-shell";
import { PasswordChecklist, passwordMeetsRules } from "@/app/pages/auth/_shared/password-checklist";

const MIN_LENGTH = 12;

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 39:630 ("Type=Set new password").
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const rules = passwordMeetsRules(password, MIN_LENGTH);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isValid = rules.length && rules.special && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/pages/auth/reset-success?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell>
      <AuthHeader title="Set New Password" />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} isRequired />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            isRequired
            isInvalid={confirmPassword.length > 0 && !passwordsMatch}
            hint={confirmPassword.length > 0 && !passwordsMatch ? "Passwords don't match" : undefined}
          />
        </div>
        <PasswordChecklist password={password} minLength={MIN_LENGTH} />
        <div className="flex flex-col items-center gap-6">
          <Button type="submit" color="primary" size="md" className="w-full" isDisabled={!isValid}>
            Reset password
          </Button>
          <AuthDivider />
          <Button color="link-gray" size="sm" iconLeading={ArrowLeft} href="/pages/auth/login">
            Back to Sign in
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
