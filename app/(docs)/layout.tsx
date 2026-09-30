import Link from "next/link";
import { Play } from "@untitledui/icons";
import { Sidebar } from "@/components/Sidebar";

// This is the doc site's own shell (Sidebar + constrained content column),
// scoped to the `(docs)` route group so it applies to every documented
// page (primitives, components, patterns, /test-*, home, llms.txt) without
// affecting routes outside the group, e.g. /pages/<page-name> full-screen
// previews - see app/pages/**, which intentionally render with no sidebar.
//
// "Launch prototype" sits top right in its own bar, not floating: a fixed button there would cover
// a page header's own top-right action (the "Config" button) on narrower windows (CONTRACTS 2.8).
// It opens the prototype at its public front door. Doc-site chrome is Scaffold, so a styled `Link`
// in Geist, not a DEW `Button` (CONTRACTS 1.5).
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="ml-56 flex justify-end px-6 pt-4">
        <Link
          href="/pages/biodata-home"
          className="flex items-center gap-2 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white shadow-xs transition-[background-color,scale] duration-150 ease-out hover:bg-brand-solid_hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Play className="size-4" aria-hidden="true" />
          Launch prototype
        </Link>
      </div>
      {/* The bar is 3.25rem tall (16px top padding + a 36px button), so main fills the rest. */}
      <main className="ml-56 min-h-[calc(100vh-3.25rem)] max-w-5xl px-12 pt-2 pb-10">{children}</main>
    </>
  );
}
