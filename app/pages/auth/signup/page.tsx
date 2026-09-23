"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader, AuthDivider } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 26:1471 ("Type=Create your account") - step 1 of
// signup, email only. Continue carries the email forward to verify-email via a query param.
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/pages/auth/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell>
      <AuthHeader title="Create your account" />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <Input label="Email" type="email" icon={Mail01} placeholder="Enter your email" value={email} onChange={setEmail} isRequired />
        <div className="flex flex-col gap-6">
          <Button type="submit" color="primary" size="md" className="w-full">
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
