"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { MapEngineProvider } from "@/app/pages/_shared/map-search/map-engine";
import { PostSixOctShell } from "./shell";

// Mapbox GL touches `window` on import, so it is loaded in the browser only, as the Leaflet map is.
const MapboxMap = dynamic(() => import("./mapbox-map"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-secondary" /> });

// PROTOTYPE LAB (12 Oct 2026, strictly proto: not for production, so no line in production-routes.ts), and the base for further explorations on this layout (the designer, 19 Oct 2026:
// "we've chosen a direction. No need to roll into production just yet"). Nothing of it is in a production file but four opt-in switches of `ProjectTab` (see context/decisions/
// 2026-10-19-33-*); its own copies of the few product parts it needed are in this folder, and nothing outside app/proto imports from it.
// A Linear-style layout, drawn by the designer in Figma (HI-FI Dashboard Explorations, node 435:62) after looking at Linear on Mobbin. The aim is less top heaviness: what you came to see is on
// screen at first look instead of a header, a Back link, a hero and a tab row above it. First on the project page; then for the largest scope, the BioData Super Admin (every rail section a page
// of the one panel, column 2 folded into the page's tabs), to be worked down to the smaller roles with the Prototype tools bar. The lab opens as the Super Admin when the address names no role.
// The layout is locked at step 1 of the subtraction we explored (designer, 13 Oct 2026: "we can't fundamentally violate the design system by changing how a component looks, so let's go as far as
// subtraction step 1, lock that layout, and refine from there"). Steps 2 to 5 are removed; context/decisions/2026-10-12-07-* keeps the record of what they were. On 19 Oct 2026 the designer chose
// the layout (no tabs, the account and the bell at the top left, the production search and Add at the top right, the nested rail) and the other layouts, the flat rail and the other versions of
// the top right were retired; they are in .context/post-6-oct-explorations-2026-10-19/ (the workspace's ignored folder, not in git).
// Everything in the shell is in shell.tsx; the project's content in project-workspace.tsx; what each section shows in sections.tsx; what needs attention in attention.tsx. The role is changed from the
// Prototype tools bar, as on every lab, which also has the Pages tool and, where there is an upload to preview, how it ends.
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
  useEffect(() => {
    if (!hasRole) router.replace(`${pathname}?userRole=biodata-super-admin`);
  }, [hasRole, pathname, router]);

  if (!hasRole) return null;
  return (
    <>
      <PrototypeTools />
      {/* Every read-only map on this page is Mapbox (the designer, 20 Oct 2026); every other page keeps Leaflet. */}
      <MapEngineProvider render={(props) => <MapboxMap {...props} />}>
        <PostSixOctShell />
      </MapEngineProvider>
    </>
  );
}
