"use client";

// The branch: the project's records as a tree (Site, Visit, Transect, Occurrence ...), opened by the branch button in the
// panel's bar (designer, 12 Oct 2026: "clicking on the tree/branch icon opens the branch bit on the projects"). It slides
// over the page from the left, under the bar, so it takes no width from the content or from "On this page", and any view of the
// project can open it. Picking a record opens it in Project records with that record selected, and closes the tree; picking the
// project at the top opens Project records with nothing selected. Escape or a click outside closes it.
// Same records, order and icons as the tree in Project records (`recordIcon`), from the same store.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Folder, XClose } from "@untitledui/icons";
import { recordIcon } from "@/app/pages/_shared/record-icons";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { cx } from "@/utils/cx";

export function BranchDrawer({ selectedId, onPick, onClose }: { selectedId: string | null; onPick: (id: string | null) => void; onClose: () => void }) {
  const { records, childrenOf, project, meta } = useEditStore();
  const ref = useRef<HTMLElement>(null);
  // The first two levels (a site, its visits) are open; deeper ones open when asked.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const open = new Set<string>();
    const walk = (parent: string | null, depth: number) => {
      for (const r of childrenOf(parent)) {
        if (depth < 2 && childrenOf(r.id).length > 0) open.add(r.id);
        walk(r.id, depth + 1);
      }
    };
    walk(null, 0);
    return open;
  });
  useEffect(() => ref.current?.focus(), []);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // A function, not a component: a component declared here would be a new type each render and remount the tree (losing focus) on every toggle.
  const branch = (parent: string | null, depth: number) => (
    <ul className="m-0 flex list-none flex-col gap-px p-0">
      {childrenOf(parent).map((r) => {
        const kids = childrenOf(r.id).length > 0;
        const isOpen = expanded.has(r.id);
        const RowIcon = recordIcon(r);
        return (
          <li key={r.id}>
            <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
              {kids ? (
                <button
                  type="button"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${r.name}`}
                  aria-expanded={isOpen}
                  onClick={() => toggle(r.id)}
                  className="grid size-6 shrink-0 place-items-center rounded text-quaternary outline-focus-ring hover:text-primary focus-visible:outline-2"
                >
                  <ChevronRight className={cx("size-3.5 transition-transform duration-100 ease-out", isOpen && "rotate-90")} />
                </button>
              ) : (
                <span aria-hidden className="size-6 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => onPick(r.id)}
                aria-current={selectedId === r.id ? "true" : undefined}
                className={cx(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left outline-focus-ring focus-visible:outline-2",
                  selectedId === r.id ? "bg-tertiary" : "hover:bg-secondary",
                )}
              >
                <RowIcon className="size-4 shrink-0 text-quaternary" />
                <span className="truncate text-sm text-primary">{r.name}</span>
                <span className="ml-auto shrink-0 pl-2 text-xs text-quaternary tabular-nums">{r.code}</span>
              </button>
            </div>
            {kids && isOpen && branch(r.id, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* A click outside the tree closes it. */}
      <div aria-hidden className="absolute inset-x-0 top-10 bottom-0 z-10" onClick={onClose} />
      <aside
        ref={ref}
        tabIndex={-1}
        aria-label="Project records"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="absolute top-10 bottom-0 left-0 z-20 flex w-80 flex-col border-r border-secondary bg-primary shadow-lg outline-hidden"
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-secondary pr-2 pl-4">
          <p className="m-0 text-sm font-semibold text-primary">
            Records <span className="font-normal text-tertiary tabular-nums">{records.length}</span>
          </p>
          <button type="button" aria-label="Close records tree" onClick={onClose} className="grid size-7 place-items-center rounded-md text-quaternary outline-focus-ring hover:bg-secondary hover:text-primary focus-visible:outline-2">
            <XClose className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => onPick(null)}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left outline-focus-ring hover:bg-secondary focus-visible:outline-2"
          >
            <Folder className="ml-6 size-4 shrink-0 text-quaternary" />
            <span className="truncate text-sm font-medium text-primary">{project.details.shortTitle}</span>
            <span className="ml-auto shrink-0 pl-2 text-xs text-quaternary tabular-nums">{meta.code}</span>
          </button>
          {branch(null, 0)}
        </div>
      </aside>
    </>
  );
}
