"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { ChevronDown } from "@untitledui/icons";
import type { PressEvent } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { MAP_SURFACE_SCROLL } from "@/app/pages/_shared/map-search/map-surface";
import { ScrollFade } from "@/app/pages/_shared/map-search/scroll-fade";
import { cx } from "@/utils/cx";

// The list on a card that floats over the map (Explore's results, Map visualise's errors): a few rows at a time, then "Show N more". Documented at /patterns/map-list-card.
//
// The button is there whenever the list fades, so a fade is never left without a way on and a number to say how far: while there are rows that have not been drawn yet it says how many the press will draw (up to
// 25); once every row is drawn it says how many are not yet fully in view, and the press scrolls to them. It goes when the end of the list is in view.
//
// It is the rows and nothing else, so every such card reads the same:
//   - the list fades out at its foot while there is more below, as the tabs above it fade at their right edge (`ScrollFade`), over about a row and a half (a row is 76px), so the last record on view
//     is half gone, a row going, and not a whole row with its last line faint;
//   - the scrollbar is the product's one, a thin thumb with no track drawn over the right edge (`app/_scrollbars`), and a scroll that reaches the end does not carry on into the map (`MAP_SURFACE_SCROLL`);
//   - "Show N more" is a secondary Button pinned over the foot, 16px up from the card's edge and lifted on the card's largest shadow. It is outside the scroller, because a mask fades its children too, and
//     the list is faded clear under it, so no row shows behind it; the list is padded below its last row so that row can scroll clear of it (16px above the button, as it is 16px above the card's foot);
//   - pressing it scrolls the new rows into view (the rows not yet in view, when every row is drawn), a heading that starts them first, and for a keyboard press focus goes to the first new row (the button is after
//     the list in the page, so focus would be left behind the rows it added).
// The rows are the list's direct children, buttons (a `ResultCard`), with an optional `h3` heading before the first of a group; the pinned button is not one of them.

const MORE_ZONE = 52; // from the card's edge up: the 16px the button is up from the foot, and its 36px
const FADE = 120;

export const LIST_STEP = 25;

export function MapResultList({
  children,
  total,
  shown,
  step = LIST_STEP,
  onShowMore,
  scrollRef,
  className,
}: {
  children: ReactNode;
  /** How many rows there are in all. */
  total: number;
  /** How many are on view now. The caller holds this, and adds `step` in `onShowMore`. */
  shown: number;
  step?: number;
  onShowMore: () => void;
  /** The scrolling element, for a caller that scrolls it itself (to the top when the list changes, back to where it was when the card unfolds). */
  scrollRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  useImperativeHandle(scrollRef, () => list.current as HTMLDivElement, []);
  const reveal = useRef<{ from: number; focus: boolean } | null>(null);
  // Rows that are drawn but not fully in view (cut off by the fade, or under the button, or below), counted from the list's own scroll.
  const [below, setBelow] = useState(0);
  const unrendered = total > shown;
  const more = unrendered || below > 0;
  const moreRef = useRef(more);

  const hiddenRows = useCallback(() => {
    const el = list.current;
    if (!el) return [];
    // While the button is up the last stretch of the list is faded clear under it, so a row there is not in view.
    const limit = el.getBoundingClientRect().bottom - (moreRef.current ? MORE_ZONE : 0) + 1;
    return ([...el.children].filter((child) => child.tagName === "BUTTON") as HTMLElement[]).filter((row) => row.getBoundingClientRect().bottom > limit);
  }, []);
  const measure = useCallback(() => setBelow(hiddenRows().length), [hiddenRows]);

  useLayoutEffect(() => {
    moreRef.current = more;
  });
  // Measured a frame after every render (the rows, the card's height or the button itself may have changed what is in view) and on every scroll and resize.
  useEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  });
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const mutations = new MutationObserver(measure);
    mutations.observe(el, { childList: true });
    return () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [measure]);

  // Scroll a row to the top of the list; a heading that starts its group is scrolled to instead, so the group's name is not left above the fold.
  const scrollToRow = (row: HTMLElement) => {
    const el = list.current;
    if (!el) return;
    const start = row.previousElementSibling?.tagName === "H3" ? row.previousElementSibling : row;
    const top = el.scrollTop + start.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const press = (e: PressEvent) => {
    const focus = e.pointerType === "keyboard" || e.pointerType === "virtual";
    if (unrendered) {
      reveal.current = { from: shown, focus };
      onShowMore();
      return;
    }
    const first = hiddenRows()[0];
    if (!first) return;
    scrollToRow(first);
    if (focus) first.focus({ preventScroll: true });
  };

  useEffect(() => {
    const pending = reveal.current;
    const el = list.current;
    if (!pending || !el) return;
    reveal.current = null;
    // The first new row is the one at the old limit among the rows.
    const first = [...el.children].filter((child) => child.tagName === "BUTTON")[pending.from] as HTMLElement | undefined;
    if (!first) return;
    scrollToRow(first);
    if (pending.focus) first.focus({ preventScroll: true });
  }, [shown]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollFade axis="y" scrollRef={list} clearEnd={more ? MORE_ZONE : 0} fade={FADE} className={cx("mt-0.5 min-h-0 flex-1 px-2", more ? "pb-17" : "pb-3", MAP_SURFACE_SCROLL, className)}>
        {children}
      </ScrollFade>
      {more && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
          <div className="pointer-events-auto rounded-lg shadow-2xl">
            <Button color="secondary" size="sm" iconLeading={ChevronDown} onPress={press}>
              Show {unrendered ? Math.min(step, total - shown) : below} more
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
