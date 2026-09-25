"use client";

import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

// Shared full-screen shell for every /pages/auth/** screen, matching the Figma "Onboarding" frame
// (file wer8CgO1UoCH3aQw2jQkdy, node 26:1410) - a centred card with no border/shadow of its own,
// just the BiodataSA wordmark + heading stack above a form. `wide` switches to the 640px card used
// by the 3-step "Setup your Profile" wizard (nodes 49:744 / 62:794 / 65:3159); every other screen
// uses the narrower 388px card (e.g. node 8:6183).
export function AuthShell({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4 font-barlow">
      <div className={cx("flex w-full flex-col items-center gap-10 p-4", wide ? "max-w-[640px]" : "max-w-[480px] min-w-[320px] sm:w-[388px]")}>
        {children}
      </div>
    </div>
  );
}

export function AuthWordmark() {
  return <p className="text-display-sm font-bold text-brand-tertiary">Biodata SA</p>;
}

export function AuthHeader({ title, description, eyebrowIcon }: { title: string; description?: ReactNode; eyebrowIcon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <AuthWordmark />
      {eyebrowIcon}
      <p className="text-xl font-semibold text-primary">{title}</p>
      {description && <p className="text-base text-secondary">{description}</p>}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-px flex-1 bg-[var(--ui-border-secondary)]" />
      <p className="text-sm font-medium text-tertiary">or</p>
      <div className="h-px flex-1 bg-[var(--ui-border-secondary)]" />
    </div>
  );
}
