"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { AuthShell, AuthHeader } from "@/app/pages/auth/_shared/auth-shell";

// Figma: file wer8CgO1UoCH3aQw2jQkdy, node 8:6183 ("Type=Sign in") for the default email+password
// view, node 41:324 ("Type=Existing account") for the password-only variant shown when an email
// is already known (e.g. arriving from reset-success's "Sign in with new password") - triggered
// here by a `?email=` query param rather than a separate route, since it's the same screen minus
// one field.
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const knownEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(knownEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/pages/dashboard?userRole=registered-user");
  };

  return (
    <AuthShell>
      <AuthHeader title="Sign in to your account" />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4">
          {!knownEmail && <Input label="Email" type="email" icon={Mail01} placeholder="Enter your email" value={email} onChange={setEmail} isRequired />}
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} isRequired />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Checkbox size="sm" label="Remember for 30 days" isSelected={remember} onChange={setRemember} />
            <Button color="link-gray" size="sm" href="/pages/auth/forgot-password">
              Forgot Password
            </Button>
          </div>
          <Button type="submit" color="primary" size="md" className="w-full">
            Sign in
          </Button>
          <div className="flex items-baseline justify-center gap-1 text-sm">
            <p className="text-tertiary">Don&rsquo;t have an account?</p>
            <Button color="link-gray" size="sm" href="/pages/auth/signup">
              Sign up
            </Button>
          </div>
          {!knownEmail && (
            <div className="flex items-baseline justify-center gap-1 text-sm">
              <p className="text-tertiary">Forgot email address?</p>
              <Button color="link-gray" size="sm" href="mailto:DEWBioDataSupport@sa.gov.au">
                Contact us
              </Button>
            </div>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
