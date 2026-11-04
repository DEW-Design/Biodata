import type { ReactNode } from "react";
import { CountBadge } from "@/components/base/badges/badges";

// Steps in a list, each numbered in a primary-fill circle (designer, 2 Nov 2026), for the instructions of a form or a modal: the upload
// form's "Data upload instructions" and the Upload attachments modal. It stays an ordered list (`role="list"`, since `list-none`
// takes the role away in Safari) and the circles are hidden from a screen reader, which reads the list and its length once and would
// otherwise read every number twice. The circle is the design system's `CountBadge`, 20px, the height of a 14px line, so it sits on the
// first line of a step that wraps.
export function NumberedSteps({ steps }: { steps: ReactNode[] }) {
  return (
    <ol role="list" className="m-0 flex list-none flex-col gap-3 p-0 text-sm text-secondary">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span aria-hidden="true">
            <CountBadge count={i + 1} color="brand-solid" />
          </span>
          <div className="min-w-0 text-balance">{step}</div>
        </li>
      ))}
    </ol>
  );
}
