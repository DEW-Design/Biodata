"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns03 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { PostSixOctShell } from "./shell";
import { STEPS, STEP_PARAM, parseStep } from "./steps";

// PROTOTYPE LAB (12 Oct 2026, strictly proto: not for production, so no line in production-routes.ts).
// Exploring a Linear-style layout, drawn by the designer in Figma (HI-FI Dashboard Explorations, node 435:62) after looking
// at Linear on Mobbin. The aim is less top heaviness: what you came to see is on screen at first look instead of a header, a
// Back link, a hero and a tab row above it. First on the project page; then for the largest scope, the BioData Super Admin
// (every rail section as a tab, column 2 folded into the bar), to be worked down to the smaller roles with the Prototype
// tools bar. The lab opens as the Super Admin when the address names no role.
// Then the process of subtraction: the "Subtraction" control on the Prototype tools bar (steps.ts) takes things away one step at a
// time, from today's lab (0) to a Linear-simple one (5), on the same real content.
// Everything in the shell is in shell.tsx; the project's content in project-workspace.tsx; what each section shows in
// sections.tsx; what needs attention in attention.tsx. The role is changed from the Prototype tools bar, as on every lab.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.
export default function PostSixOctPage() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

function Lab() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const hasRole = params.has("userRole");
  const step = parseStep(params.get(STEP_PARAM));
  useEffect(() => {
    if (!hasRole) router.replace(`${pathname}?userRole=biodata-super-admin`);
  }, [hasRole, pathname, router]);

  useRegisterTool({
    id: "layout",
    label: "Subtraction step to show",
    barLabel: "Subtraction",
    barValue: STEPS[step].short,
    icon: Columns03,
    options: STEPS.map(({ id, label, description }) => ({ id: String(id), label, description })),
    value: String(step),
    onChange: (id) => {
      const next = new URLSearchParams(window.location.search);
      next.set(STEP_PARAM, id);
      router.replace(`${pathname}?${next.toString()}`);
    },
  });

  if (!hasRole) return null;
  return (
    <>
      <PrototypeTools />
      <PostSixOctShell step={step} />
    </>
  );
}
