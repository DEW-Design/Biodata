"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader, AuthDivider } from "@/app/pages/auth/_shared/auth-shell";
import { PasswordChecklist, passwordMeetsRules } from "@/app/pages/auth/_shared/password-checklist";

const MIN_LENGTH = 12;

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 32:153 ("Type=Set Password") - step 3 of signup, a
// disabled email field (carried forward, read-only) plus a live password-rules checklist.
function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");

  const rules = passwordMeetsRules(password, MIN_LENGTH);
  const isValid = rules.length && rules.special;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/pages/auth/account-created");
  };

  return (
    <AuthShell>
      <AuthHeader title="Set Password" />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} isDisabled />
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} isRequired />
        </div>
        <PasswordChecklist password={password} minLength={MIN_LENGTH} />
        <div className="flex flex-col gap-6">
          <Button type="submit" color="primary" size="md" className="w-full" isDisabled={!isValid}>
            Continue
          </Button>
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
