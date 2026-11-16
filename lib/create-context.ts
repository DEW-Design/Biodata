"use client";

import { useEffect, type FC } from "react";
import { create } from "zustand";
import type { CreateItemId } from "@/lib/create-menu";

// What the header's "Add" menu offers for the page you are on (the designer, 11 Nov 2026: "Can we make the + Add button contextual? Add on the project
// page would be: Add a dataset, event, occ, obs, add restrictions"). The header is the one shared header (CONTRACTS 3.1) and has the one Add button
// (3.5), so a page does not draw its own: it tells the menu what can be added here (`useCreateContext`), and the menu lists that first, under the
// page's own heading, with the things that can be added anywhere after it. A page that says nothing gets the menu as it always was.
//
// The page decides what its role may add before it registers (the same checks its own buttons use), so nothing is listed that would be refused.

export interface CreateContextItem {
  id: string;
  label: string;
  icon: FC<{ className?: string }>;
  /** A second list beside the item (the types of event, occurrence or observation). An item with one is not picked itself. */
  children?: { id: string; label: string }[];
}

export interface CreateContext {
  /** The heading over the page's own items, e.g. "This project". */
  title: string;
  items: CreateContextItem[];
  /** Picking an item, or one of an item's `children` (then `childId` is set). */
  onAction: (itemId: string, childId?: string) => void;
  /** Items of the general list that this page's own items stand in for (the project's own "Dataset" for the general one, which asks which project). */
  replaces?: CreateItemId[];
}

const useStore = create<{ context: CreateContext | null }>(() => ({ context: null }));

/** What the page you are on adds to the Add menu, or `null`. Read by `CreateMenu`. */
export function useCurrentCreateContext(): CreateContext | null {
  return useStore((s) => s.context);
}

/** Tells the header's Add menu what can be added on this page, while the page is on screen. Pass a memoised value (it is set when it changes), or
 *  `null` for nothing. */
export function useCreateContext(context: CreateContext | null) {
  useEffect(() => {
    useStore.setState({ context });
    // Cleared only if it is still this page's: the next page may already have set its own.
    return () => {
      if (useStore.getState().context === context) useStore.setState({ context: null });
    };
  }, [context]);
}
