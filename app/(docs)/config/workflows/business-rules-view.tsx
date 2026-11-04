"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, GitBranch01, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SegmentedControl } from "@/components/scaffold/controls";
import { agreementStatusMeta } from "@/app/pages/_shared/agreement-status";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { DLA_MOVES, DLA_RULES, type BusinessRule, type RuleVerdict } from "@/config/workflows/dla-workflow";
import { FlowDiagram, MOVE_EDGES } from "./flow-diagram";
import { runRuleChecks } from "./rule-checks";

// The business rules, each placed on the flow. The rules are `DLA_RULES` (`config/workflows/dla-workflow.ts`), kept as they were recorded with who
// gave them and the decision that holds them. Pressing "Show on the flow" lights the statuses and lines a rule governs. Where the page can run a rule
// it does (`rule-checks.ts`), and each check says whether it ran the product's own code or only this page's rules.

const VERDICT: Record<RuleVerdict, { label: string; color: "success" | "warning" | "brand" }> = {
  met: { label: "Met", color: "success" },
  partly: { label: "Partly met", color: "warning" },
  open: { label: "Open question", color: "brand" },
};

type Show = "all" | "notmet";

const moveLabel = (id: string) => DLA_MOVES.find((m) => m.id === id)?.label ?? id;

function RuleCard({ rule, checks, active, onShow }: { rule: BusinessRule; checks: { ok: boolean; text: string; basis: string }[]; active: boolean; onShow: () => void }) {
  const verdict = VERDICT[rule.verdict];
  return (
    <li className={active ? "flex flex-col gap-3 rounded-xl border-2 border-brand bg-primary p-4" : "flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color="gray">
            {rule.id}
          </Badge>
          <p className="m-0 text-sm font-semibold text-primary">{rule.title}</p>
          <Badge size="sm" color={verdict.color}>
            {verdict.label}
          </Badge>
        </div>
        <Button size="sm" color="secondary" iconLeading={GitBranch01} aria-pressed={active} onPress={onShow}>
          {active ? "Showing on the flow" : "Show on the flow"}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="m-0 border-l-2 border-secondary pl-3 text-sm text-balance text-secondary">{rule.given}</p>
        <p className="m-0 text-xs text-quaternary">
          {rule.source}. Decision {rule.decision}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-tertiary">Governs</span>
        {rule.governs.states.map((s) => (
          <Badge key={s} size="sm" color={agreementStatusMeta[s].badgeColor}>
            {agreementStatusMeta[s].label}
          </Badge>
        ))}
        {rule.governs.moves.map((m) => (
          <Badge key={m} size="sm" color="gray">
            {moveLabel(m)}
          </Badge>
        ))}
      </div>

      <p className="m-0 text-sm text-balance text-tertiary">
        <span className="font-medium text-secondary">In the prototype: </span>
        {rule.note}
      </p>

      {checks.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-sm text-secondary">
              {c.ok ? <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-primary" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />}
              <span className="text-balance">
                {c.text} <span className="text-xs text-quaternary">Ran against: {c.basis === "Product" ? "the product's own code" : "this page's rules"}.</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-xs text-quaternary">Not run: this rule is in a form or a modal, and was read from the decision that records it.</p>
      )}

      {rule.gaps && rule.gaps.length > 0 && (
        <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-tertiary">
          Related gaps
          {rule.gaps.map((g) => (
            <Badge key={g} size="sm" color="gray">
              {g}
            </Badge>
          ))}
        </p>
      )}
    </li>
  );
}

export function BusinessRulesView() {
  const notifications = useNotifications();
  const checks = useMemo(() => runRuleChecks(notifications), [notifications]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [show, setShow] = useState<Show>("all");
  const diagram = useRef<HTMLDivElement>(null);
  const active = DLA_RULES.find((r) => r.id === activeId) ?? null;
  const lit = active ? { states: active.governs.states, edges: [...new Set(active.governs.moves.flatMap((m) => MOVE_EDGES[m] ?? []))] } : undefined;
  const count = (v: RuleVerdict) => DLA_RULES.filter((r) => r.verdict === v).length;
  const rules = show === "all" ? DLA_RULES : DLA_RULES.filter((r) => r.verdict !== "met");
  const covered = new Set(DLA_RULES.flatMap((r) => r.governs.moves));
  const uncovered = DLA_MOVES.filter((m) => !covered.has(m.id));

  const showOnFlow = (id: string) => {
    setActiveId((now) => (now === id ? null : id));
    diagram.current?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-3">
        <h2 className="mt-0!">The business rules, on the flow</h2>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          The rules the business and the designer have given, kept as they were recorded, each with who gave it and where. Each is read for how the prototype treats it and,
          where it can be run, checked. The BR numbers are this page&apos;s, not the sheet&apos;s.
        </p>
        <p className="m-0 text-sm text-secondary">
          {DLA_RULES.length} rules: {count("met")} met, {count("partly")} partly met, {count("open")} open {count("open") === 1 ? "question" : "questions"} for the business.
        </p>
        <div ref={diagram} className="flex flex-col gap-3">
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm text-tertiary">
              {active ? (
                <>
                  <span className="font-medium text-secondary">{active.id}</span> lights the statuses and moves it governs.
                </>
              ) : (
                "Choose a rule below to light what it governs."
              )}
            </p>
            {active && (
              <Button size="sm" color="secondary" iconLeading={XClose} onPress={() => setActiveId(null)}>
                Clear
              </Button>
            )}
          </div>
          <FlowDiagram lit={lit} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>Rules</h2>
          <SegmentedControl
            options={[
              { key: "all" as const, label: "Every rule" },
              { key: "notmet" as const, label: "Not fully met" },
            ]}
            value={show}
            onChange={setShow}
          />
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} checks={checks[rule.id] ?? []} active={rule.id === activeId} onShow={() => showOnFlow(rule.id)} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>In the prototype with no rule behind it</h2>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          Moves that no rule above governs. They are the build&apos;s own choices, for the business to confirm or drop. A move that a rule governs is covered only as far as that rule says: Add
          location, for one, is covered for its level and not for whether it needs a review.
        </p>
        {uncovered.length === 0 ? (
          <p className="m-0 text-sm text-tertiary">None.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {uncovered.map((m) => (
              <li key={m.id} className="flex flex-col gap-0.5 rounded-lg border border-secondary bg-secondary px-4 py-3">
                <span className="text-sm font-medium text-primary">{m.label}</span>
                <span className="text-sm text-balance text-tertiary">{m.rule}</span>
                <span className="text-xs text-quaternary">{m.code}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
