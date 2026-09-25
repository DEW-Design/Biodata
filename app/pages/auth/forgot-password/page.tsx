"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail01, ArrowLeft } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { AuthShell, AuthHeader } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 26:1411 ("Type=Forgot Password").
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/pages/auth/check-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell>
      <AuthHeader title="Forgot Password?" description="Enter your email address to send reset password link" />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <Input label="Email" type="email" icon={Mail01} placeholder="Enter your email" value={email} onChange={setEmail} isRequired />
        <div className="flex flex-col items-center gap-6">
          <Button type="submit" color="primary" size="md" className="w-full">
            Reset password
          </Button>
          <Button color="link-gray" size="sm" iconLeading={ArrowLeft} href="/pages/auth/login">
            Back to Sign in
          </Button>
          <div className="flex items-baseline justify-center gap-1 text-sm">
            <p className="text-tertiary">Forgot email address?</p>
            <Button color="link-gray" size="sm" href="mailto:DEWBioDataSupport@sa.gov.au">
              Contact us
            </Button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
