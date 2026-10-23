"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronDown, ChevronUp } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

// Hide or show the list on a card that floats over the map (Explore's results, Map visualise's errors), so the map can be seen whole. Documented at /patterns/map-list-card.
//
// The card folds to the rest of itself (its header, or Explore's count line) and stays the same object in the same place; it is not a separate button. The list is unmounted while it is folded, so the
// scroll position is kept here and put back when it unfolds. It is a labelled link, not an icon alone, so what it does is stated. It sits at a card's right edge, so its fill's edge (not its text's) lines up with the content (`mr-0!`).

export function useListToggle(listRef: RefObject<HTMLDivElement | null>) {
  const [open, setOpen] = useState(true);
  const savedScroll = useRef(0);
  // Unfolding puts the list back where it was left.
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: savedScroll.current });
  }, [open, listRef]);
  const toggle = () => {
    if (open) savedScroll.current = listRef.current?.scrollTop ?? 0;
    setOpen((o) => !o);
  };
  /** The list is a different one now (another tab, another search): it unfolds at its top, not where the last one was left. */
  const forgetScroll = useCallback(() => {
    savedScroll.current = 0;
  }, []);
  return { open, toggle, forgetScroll };
}

export function ListToggleButton({ open, onToggle, controls }: { open: boolean; onToggle: () => void; controls: string }) {
  return (
    <Button color="link-gray" size="sm" iconTrailing={open ? ChevronUp : ChevronDown} aria-expanded={open} aria-controls={controls} className="mr-0! shrink-0" onPress={onToggle}>
      {open ? "Hide list" : "Show list"}
    </Button>
  );
}
