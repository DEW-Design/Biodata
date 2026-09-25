"use client";

import type { ReactNode } from "react";
import { ArrowNarrowLeft, ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { SectionHeader } from "@/components/application/section-headers/section-headers";

// THE form page. Every create/edit form in the product (Add Project, DSA, DLA) renders this
// instead of laying out its own header and footer - see CONTRACTS.md section 4 and the Forms pattern
// page (/patterns/forms). It fixes the parts that must not differ between forms:
//
//   header  - optional eyebrow, the title (with an optional status badge), a subtitle, and the two
//             actions every form has: Cancel and Save draft (both optional)
//   column 2 - the section list (`FormSectionList`, rendered into the shell through `FormSidebar`):
//             where you are, what is done, what needs attention. Sections are NEVER tabs or a stepper
//   body    - the scrolling area; fields are laid out with `FormRow` (label left, fields right)
//   footer  - "Back a step" (secondary, left arrow) on the left, an optional message, and the
//             primary action on the right: "Continue" (right arrow) to move on, or the final action
//             ("Submit", "Create project", "Save changes") on the last section
//
// Required fields are marked * and explain themselves inline only after the person tried to move
// on. Buttons are always the real `Button`; arrows are real icons, never characters.
export function FormPage({
  eyebrow,
  title,
  badge,
  subtitle,
  onCancel,
  onSaveDraft,
  children,
  onBack,
  message,
  problems,
  primaryLabel,
  onPrimary,
  primaryIsContinue = false,
}: {
  eyebrow?: string;
  title: string;
  /** A status `Badge` shown beside the title (an existing record's status). */
  badge?: ReactNode;
  subtitle?: string;
  /** Shows "Cancel" in the header. The caller decides whether to ask before discarding. */
  onCancel?: () => void;
  /** Shows "Save draft" in the header. Omit where a draft makes no sense (editing a live record). */
  onSaveDraft?: () => void;
  children: ReactNode;
  /** "Back a step": shown when there is a previous section. Omit on the first. */
  onBack?: () => void;
  /** A short status in the footer, e.g. "2 fields need attention". */
  message?: string;
  /** Mandatory details that are missing: shown as an error alert above the fields, and the reason Continue did not move on. Omit when nothing is missing. */
  problems?: { items: string[]; extra?: string };
  primaryLabel: string;
  onPrimary: () => void;
  /** True when the primary action just moves to the next section: adds the right arrow. */
  primaryIsContinue?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 px-6 pt-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            {eyebrow && <p className="text-xs font-semibold tracking-wide text-brand-tertiary uppercase">{eyebrow}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              {badge}
            </div>
            {subtitle && <SectionHeader.Subheading>{subtitle}</SectionHeader.Subheading>}
          </div>
          {(onCancel || onSaveDraft) && (
            <SectionHeader.Actions className="items-center">
              {onCancel && (
                <Button color="link-gray" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {onSaveDraft && (
                <Button color="secondary" onClick={onSaveDraft}>
                  Save draft
                </Button>
              )}
            </SectionHeader.Actions>
          )}
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {problems && problems.items.length > 0 && (
          <div className="mb-6" role="alert">
            <AlertFullWidth
              contained
              tintedBackground
              wrap
              color="error"
              className="max-w-none rounded-lg border border-error-300 bg-error-50"
              title="Details missing"
              description={`Complete these to continue: ${problems.items.join(", ")}.${problems.extra ? ` ${problems.extra}` : ""}`}
              confirmLabel="OK"
            />
          </div>
        )}
        {children}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary px-6 py-4">
        {onBack ? (
          <Button color="secondary" iconLeading={ArrowNarrowLeft} onClick={onBack}>
            Back a step
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-3">
          {message && <p className="text-sm text-error-primary">{message}</p>}
          <Button color="primary" iconTrailing={primaryIsContinue ? ArrowNarrowRight : undefined} onClick={onPrimary}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
