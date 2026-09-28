"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowNarrowLeft } from "@untitledui/icons";

// The top of every record page, taken from the project page (project-detail): a Back link on its own,
// then the gradient identity card with the eyebrow, the title, the record's actions at its top right
// (RecordActionBar `onDark`: one white button and a "..." menu, like the project's Upload dataset),
// and a row of label/value facts. Tabs and content follow on the page itself.

export function RecordBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="shrink-0 px-6 pt-6">
      <Link
        href={href}
        className="flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowNarrowLeft className="size-4" />
        {children}
      </Link>
    </div>
  );
}

export function HeroMeta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-xs font-semibold tracking-wide text-white/70 uppercase">{label}</p>
      <div className="text-sm text-white">{children}</div>
    </div>
  );
}

export function RecordHero({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  /** A second line under the title (a scientific name). */
  subtitle?: ReactNode;
  /** A sentence about the record, under the title. */
  description?: string;
  /** The record's actions: `<RecordActionBar onDark ... />`. */
  actions?: ReactNode;
  /** `HeroMeta` facts. */
  children?: ReactNode;
}) {
  return (
    <div className="shrink-0 px-6 pt-4">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-xs font-semibold tracking-wide text-white/70 uppercase">{eyebrow}</p>
            <h1 className="m-0 text-2xl font-medium text-balance text-white">{title}</h1>
            {subtitle && <div className="text-sm text-white/80">{subtitle}</div>}
            {description && <p className="m-0 max-w-3xl text-sm text-balance text-white/80">{description}</p>}
          </div>
          {actions}
        </div>
        {children && <div className="flex flex-wrap items-start gap-x-8 gap-y-4">{children}</div>}
      </div>
    </div>
  );
}

/** A label/value row inside a bordered card, as on the project page's Overview tab. */
export function RecordRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-secondary px-4 py-3 last:border-b-0 sm:flex-row sm:gap-6">
      <p className="m-0 shrink-0 text-sm text-secondary sm:w-44">{label}</p>
      <div className="min-w-0 flex-1 text-sm text-primary">{children}</div>
    </div>
  );
}
