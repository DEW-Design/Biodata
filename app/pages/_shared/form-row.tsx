import type { ReactNode } from "react";

// The label-left / fields-right row every long form here is built from (DSA, DLA, and the second
// Add Project layout). One source so a form row reads identically on every create/edit screen.
export function FormRow({ title, description, required, error, children }: { title: string; description?: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-secondary py-6 first:pt-0 last:border-b-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">
          {title}
          {required && <span className="text-brand-tertiary"> *</span>}
        </p>
        {description && <p className="text-sm text-balance text-tertiary">{description}</p>}
      </div>
      <div className="flex max-w-[720px] flex-col gap-4">
        {children}
        {error && <p className="text-sm text-error-primary">{error}</p>}
      </div>
    </div>
  );
}
