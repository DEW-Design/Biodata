"use client";

import { Suspense, type ReactNode } from "react";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";

// The page the newsletter sits on: the canvas, the "paper" it is drawn on (960px, where the infographic lays out in rows), and
// the Prototype tools bar for the role (CONTRACTS 3.8). Nothing here is part of the newsletter.
export function NewsletterFrame({ children }: { children: ReactNode }) {
  return (
    <div className="font-barlow flex min-h-screen flex-col items-center bg-secondary px-4 py-10">
      <Suspense fallback={null}>
        <PrototypeTools />
      </Suspense>
      <article aria-label="DEW newsletter" className="w-full max-w-[960px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs">
        {children}
      </article>
    </div>
  );
}
