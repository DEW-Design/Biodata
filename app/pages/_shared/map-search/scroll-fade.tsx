"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ReactNode, type Ref, type TransitionEvent } from "react";
import { cx } from "@/utils/cx";

// A strip or list that scrolls and fades out at its end while there is more to scroll to, so a cut-off tab or row
// reads as "there is more here" instead of as a clipped label. The fade is a mask (not an overlay), so it works on
// any background, and it goes once the strip is scrolled to its end or when everything fits. It does not snap: its length and its clear zone are registered lengths (`--scroll-fade-length`, `--scroll-fade-clear`,
// globals.css) that ease to 0 over 200ms, so the last rows come out of the fade rather than jumping to full strength, and the same on the way in. The mask is only on while there is a fade, or one is easing out.
//
// `axis="x"` (the default) is the tab strip: it fades at its right edge, over 64px. A strip that scrolls would scroll (or clip) the hit area of
// its tabs (`hit-area`, globals.css), which reaches up to 6px beyond a tab, so it has 6px of padding above and below, taken back by an equal margin: it
// takes the same room as it did (a caller that sets its own padding or margin sets all four sides, as the Map visualise card's does). `axis="y"` is a list in a card: it
// fades at its foot, and the caller gives it its height (`min-h-0 flex-1`). A list can ask for a longer fade (`fade`) so
// that its last record is seen going: the fade is never more than 45 per cent of the strip, so a short list keeps its
// rows. Anything that must stay clear of the fade (a pinned button) sits outside it, not in it: a mask fades its
// children too, and `clearEnd` keeps the last stretch of the list fully faded, so nothing of a row shows behind such a
// button.
//
// The scrollbar is not this component's: every scroller in the product draws the one thumb from `app/_scrollbars` (CONTRACTS 2.17; it began here as option D of the Explore lab, 23 Oct 2026), in a layer of its own, so this
// mask does not fade it and the list's parent does not have to be positioned. The fade says there is more; the thumb says where and how much. A strip (`axis="x"`) opts out of the thumb: its fade is its cue.

export function ScrollFade({
  children,
  className,
  axis = "x",
  scrollRef,
  clearEnd = 0,
  fade = 64,
}: {
  children: ReactNode;
  className?: string;
  axis?: "x" | "y";
  /** The scrolling element, for a caller that scrolls it (`scrollTo`) or reads its children. */
  scrollRef?: Ref<HTMLDivElement>;
  /** Pixels at the end that are fully faded, where something is pinned over it; the fade then ends at their edge. */
  clearEnd?: number;
  /** The length of the fade, in pixels. */
  fade?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // How long the fade is now (0 when there is none: the end is in view, or everything fits), and whether the mask is on. It stays on while a fade eases out to 0, then comes off.
  const [length, setLength] = useState(0);
  const [masked, setMasked] = useState(false);
  useImperativeHandle(scrollRef, () => ref.current as HTMLDivElement, []);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const more = axis === "x" ? el.scrollLeft + el.clientWidth < el.scrollWidth - 2 : el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    const next = more ? Math.round(Math.min(fade, (axis === "x" ? el.clientWidth : el.clientHeight) * 0.45)) : 0;
    setLength(next);
    if (next > 0) setMasked(true);
  }, [axis, fade]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    // A list's height changes as rows are added or taken away, which its own box does not report.
    const mutations = new MutationObserver(update);
    if (axis === "y") mutations.observe(el, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [axis, update]);

  const clear = length > 0 ? clearEnd : 0;
  const style = masked
    ? ({
        "--scroll-fade-length": `${length}px`,
        "--scroll-fade-clear": `${clear}px`,
        maskImage: `linear-gradient(to ${axis === "x" ? "right" : "bottom"}, black calc(100% - var(--scroll-fade-length) - var(--scroll-fade-clear)), transparent calc(100% - var(--scroll-fade-clear)))`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      onScroll={update}
      onTransitionEnd={(e: TransitionEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && length === 0) setMasked(false);
      }}
      data-no-drawn-scrollbar={axis === "x" ? "" : undefined}
      style={style}
      className={cx("scroll-fade-ease", axis === "x" ? "-my-1.5 shrink-0 overflow-x-auto py-1.5" : "overflow-y-auto", className)}
    >
      {children}
    </div>
  );
}
