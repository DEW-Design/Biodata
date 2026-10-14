"use client";

import { TopInfographic } from "../infographic";

// /nltemplate/infographic - the infographic block on its own, at 1040px wide, the width it is exported at (the block lays out in
// rows from 768px; at 600px it is the email's stacked version). Nothing else on the page, so it can be captured as it is.
export default function InfographicPage() {
  return (
    <div className="font-barlow flex min-h-screen items-start justify-center bg-secondary p-10">
      <div className="w-full max-w-[1040px]">
        <TopInfographic />
      </div>
    </div>
  );
}
