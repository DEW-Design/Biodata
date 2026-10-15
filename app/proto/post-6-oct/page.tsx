"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutLeft } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { PostSixOctShell } from "./shell";
import { RAIL_PARAM } from "./params";

// PROTOTYPE LAB (12 Oct 2026, strictly proto: not for production, so no line in production-routes.ts).
// Exploring a Linear-style layout, drawn by the designer in Figma (HI-FI Dashboard Explorations, node 435:62) after looking
// at Linear on Mobbin. The aim is less top heaviness: what you came to see is on screen at first look instead of a header, a
// Back link, a hero and a tab row above it. First on the project page; then for the largest scope, the BioData Super Admin
// (every rail section as a tab, column 2 folded into the bar), to be worked down to the smaller roles with the Prototype
// tools bar. The lab opens as the Super Admin when the address names no role.
// The layout is locked at step 1 of the subtraction we explored (designer, 13 Oct 2026: "we can't fundamentally violate the design
// system by changing how a component looks, so let's go as far as subtraction step 1, lock that layout, and refine from there"). Steps 2
// to 5 (the tab strip hidden, list headers hidden, grouped rows, a Linear-style project page) are removed; they hid or restyled design
// system components, or replaced them. context/decisions/2026-10-12-07-* keeps the record of what they were.
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
  // The left rail: nested (Notion's pattern, the default) or flat (as it was).
  const nestedRail = params.get(RAIL_PARAM) !== "flat";
  useEffect(() => {
    if (!hasRole) router.replace(`${pathname}?userRole=biodata-super-admin`);
  }, [hasRole, pathname, router]);

  useRegisterTool({
    id: "rail",
    label: "Left rail to show",
    barLabel: "Rail",
    barValue: nestedRail ? "Nested" : "Flat",
    icon: LayoutLeft,
    options: [
      { id: "nested", label: "Nested", description: "Notion's pattern: the icon turns into a chevron when pointed at and opens the row's children in place" },
      { id: "flat", label: "Flat", description: "One row per section, as it was" },
    ],
    value: nestedRail ? "nested" : "flat",
    onChange: (id) => {
      const next = new URLSearchParams(window.location.search);
      next.set(RAIL_PARAM, id);
      router.replace(`${pathname}?${next.toString()}`);
    },
  });

  if (!hasRole) return null;
  return (
    <>
      <PrototypeTools />
      <PostSixOctShell nestedRail={nestedRail} />
    </>
  );
}
