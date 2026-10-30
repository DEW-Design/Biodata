"use client";

import { ArrowNarrowRight, LogIn01, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// What main says when the viewed role cannot use a page (CONTRACTS 3.7: the shell keeps all three columns and the restriction is
// stated in main). Until now every shell drew its own copy of this, each offering only "Go to Home" even where its line said "create
// an account" (the phase 1 sweep, P1-06). This is the one: the section's name, one line that says why and what to do, and then, for
// a signed-out visitor, the two ways in (Log in, Sign up: the same two the sign-up dialog of an action offers) with "Go to Home"
// as the quiet third; a signed-in role that lacks the feature only has the way out.
//
// First used by the Data ingestion stress test; the other shells move to it when the designer approves the rest of P1-06.
export function RestrictedState({ title, description }: { title: string; description: string }) {
  const roleHref = useRoleHref();
  const role = useUserRole();
  const signedOut = role === "public-user";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{title}</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">{description}</p>
      {signedOut && (
        <div className="flex items-center gap-3 pt-1">
          <Button color="secondary" size="md" href={roleHref("/pages/auth/login")} iconLeading={LogIn01}>
            Log in
          </Button>
          <Button color="primary" size="md" href={roleHref("/pages/auth/signup")} iconLeading={UserPlus01}>
            Sign up
          </Button>
        </div>
      )}
      <Button color="link-color" size="sm" href={roleHref("/pages/dashboard")} iconTrailing={ArrowNarrowRight}>
        Go to Home
      </Button>
    </div>
  );
}
