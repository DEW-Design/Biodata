"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { cx } from "@/utils/cx";
import { ABOUT, SENSITIVITY, aboutOf, effectiveTo, formatBytes, ntTemplate, recipientsSummary, sampleValues, variablesFor, type NtDraft, type RecipientLabel } from "@/app/pages/_shared/notifications/nt-data";

// The email as it lands in an inbox: the envelope (From, To, Subject), then the message inside its
// template, with the security classification marked at the top and bottom. Used on the list's preview
// pane, the notification's Preview tab and beside the form's Message section, so all three show the
// same thing.
//
// Composed, not a real component (CONTRACTS 1.2): an email preview is content, built from tokens.
// The template sets the banner; the admin's text sets everything else (the designer, 1 Oct 2026:
// "Template owns the look"). Two plain-text marks: **bold**, and a line starting "- " is a list item.
//
// Variables show their sample values, or the variables themselves with `showVariables`. A variable
// the trigger doesn't provide is marked in the error colour either way, so a typo is visible before
// anything is sent. Type layers are taken from RecordHero (the banner heading), RecordRow (the
// envelope and body text) and FormSectionList's group title (the classification marking).

const TOKEN = /(\*\*.+?\*\*|\{\{\s*[\w.]+\s*\}\})/g;

function Inline({ text, samples, known, showVariables }: { text: string; samples: Map<string, string>; known: Set<string>; showVariables: boolean }): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return (
        <strong key={i} className="font-semibold text-primary">
          <Inline text={part.slice(2, -2)} samples={samples} known={known} showVariables={showVariables} />
        </strong>
      );
    const variable = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(part);
    if (variable) {
      const key = variable[1];
      if (!known.has(key))
        return (
          <mark key={i} className="rounded-sm bg-error-secondary px-1 text-error-primary" title="Not available for this trigger">
            {part}
          </mark>
        );
      return showVariables ? (
        <mark key={i} className="rounded-sm bg-brand-secondary px-1 font-medium text-brand-secondary">
          {part}
        </mark>
      ) : (
        <span key={i}>{samples.get(key)}</span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Paragraphs from blank lines; a run of "- " lines is a list; other line breaks are kept. */
function Body({ text, ...rest }: { text: string; samples: Map<string, string>; known: Set<string>; showVariables: boolean }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        const out: ReactNode[] = [];
        let list: string[] = [];
        let para: string[] = [];
        const flushPara = () => {
          if (para.length)
            out.push(
              <p key={`p${out.length}`} className="m-0">
                {para.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    <Inline text={line} {...rest} />
                  </span>
                ))}
              </p>,
            );
          para = [];
        };
        const flushList = () => {
          if (list.length)
            out.push(
              <ul key={`l${out.length}`} className="m-0 list-disc pl-5">
                {list.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} {...rest} />
                  </li>
                ))}
              </ul>,
            );
          list = [];
        };
        for (const line of lines) {
          if (/^\s*-\s+/.test(line)) {
            flushPara();
            list.push(line.replace(/^\s*-\s+/, ""));
          } else {
            flushList();
            para.push(line);
          }
        }
        flushPara();
        flushList();
        return (
          <div key={b} className="flex flex-col gap-2">
            {out}
          </div>
        );
      })}
    </>
  );
}

const banner: Record<string, { root: string; eyebrow: string; heading: string }> = {
  basic: { root: "bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700", eyebrow: "text-white/70", heading: "text-white" },
  urgent: { root: "bg-error-solid", eyebrow: "text-white/70", heading: "text-white" },
  informational: { root: "bg-brand-secondary", eyebrow: "text-brand-tertiary", heading: "text-primary" },
  maintenance: { root: "bg-warning-secondary", eyebrow: "text-tertiary", heading: "text-primary" },
};

function Marking({ label }: { label: string }) {
  return <p className="m-0 py-2 text-center text-xs font-semibold tracking-wide text-tertiary">{label}</p>;
}

export function EmailPreview({
  draft,
  labelOf,
  showVariables = false,
  onRemoveAttachment,
  className,
}: {
  draft: NtDraft;
  labelOf: RecipientLabel;
  showVariables?: boolean;
  /** In the form: each attachment gets a remove button, so a wrong file is taken off where it is seen. */
  onRemoveAttachment?: (id: string) => void;
  className?: string;
}) {
  const samples = sampleValues(draft.trigger);
  const known = new Set(variablesFor(draft.trigger).flatMap((g) => g.items.map((i) => i.key)));
  const look = banner[draft.template] ?? banner.basic;
  const marking = SENSITIVITY[draft.sensitivity].label;
  const rest = { samples, known, showVariables };
  const to = effectiveTo(draft);
  const about = to.includes(ABOUT) ? aboutOf(draft.trigger) : undefined;
  // The envelope's To: the sample person, and why they get it.
  const toLine = !showVariables && about ? `Olivia Wyatt (${about})` : recipientsSummary(to, labelOf);

  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <dl className="m-0 flex flex-col gap-1 text-sm">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-tertiary">From</dt>
          <dd className="m-0 min-w-0 text-primary">{draft.fromName.trim() || "BioData SA"}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-tertiary">To</dt>
          <dd className="m-0 min-w-0 text-primary">{toLine}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-tertiary">Subject</dt>
          <dd className="m-0 min-w-0 font-medium text-primary">{draft.subject.trim() ? <Inline text={draft.subject} {...rest} /> : <span className="font-normal text-quaternary">No subject yet</span>}</dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
        <Marking label={marking} />
        <div className={cx("flex flex-col gap-1 px-8 py-7", look.root)}>
          <p className={cx("m-0 text-xs font-semibold tracking-wide uppercase", look.eyebrow)}>BioData SA</p>
          <h2 className={cx("m-0 text-2xl font-semibold text-balance", look.heading)}>{draft.heading.trim() || draft.subject.trim() ? <Inline text={draft.heading.trim() || draft.subject} {...rest} /> : ntTemplate(draft.template).name}</h2>
        </div>
        <div className="flex flex-col gap-4 px-8 py-7 text-sm text-secondary">
          {draft.body.trim() ? <Body text={draft.body} {...rest} /> : <p className="m-0 text-quaternary">No message yet.</p>}
          {draft.signOff.trim() && (
            <p className="m-0 whitespace-pre-line">
              <Inline text={draft.signOff} {...rest} />
            </p>
          )}
          {draft.attachments.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Attachments">
              {draft.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-lg border border-secondary py-2 pr-2 pl-3 text-sm">
                  <span className="max-w-60 truncate text-primary" title={a.name}>
                    {a.name}
                  </span>
                  <span className="text-tertiary tabular-nums">{formatBytes(a.size)}</span>
                  {onRemoveAttachment && <CloseButton size="xs" slot={null} label={`Remove ${a.name}`} onPress={() => onRemoveAttachment(a.id)} />}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-1 border-t border-secondary bg-secondary px-8 py-5 text-xs text-tertiary">
          <p className="m-0">
            <Inline text="Need help? Contact us at {{support_email}} or visit {{help_center_link}}." {...rest} />
          </p>
          <p className="m-0">
            <Inline text="© {{year}} BioData SA. All rights reserved." {...rest} />
          </p>
        </div>
        <Marking label={marking} />
      </div>
    </div>
  );
}
