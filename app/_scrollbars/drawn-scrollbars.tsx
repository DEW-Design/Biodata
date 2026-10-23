"use client";

import { useEffect, useRef, useState } from "react";
import { SCROLLBAR_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

// The one scrollbar of the product (designer, 23 Oct 2026: "the scroll bar logic we added on the explore screens, let's make that consistent across the webapp"; the treatment is option D of the Explore lab,
// `2026-10-23-53`). The browser's bar is off everywhere (`app/globals.css`) and a thin thumb is drawn over the scroller's own edge: 6px, no track, 2px in from the edge, so it takes no width from the content whatever
// the system's "Show scroll bars" setting is, and nothing moves when it comes and goes (the old `scrollbar-gutter` reserve is no longer needed). It shows while the scroller scrolls and for 0.9s after, while the pointer is
// over the scroller or the thumb, and while the thumb is dragged (the scroller then follows by the ratio of the lengths); it stops 8px short of each end so it clears a card's rounded corner. On a touch screen it is an
// indicator only and takes no pointer events. Wheel, touch and keyboard scrolling are the browser's, as before.
//
// It is built once, here, and not at each of the scrollers (about 120 of them, in tables, menus, modals, page columns and lists): any element that scrolls is found when it scrolls or is pointed at, so a new scroller
// has it without being asked. The thumbs are drawn in one fixed layer above everything (`SCROLLBAR_Z_INDEX`), not inside the scroller, so no parent has to be positioned, a mask on the scroller (`ScrollFade`'s fade)
// does not fade it, and nothing clips it. A thumb is drawn only where its scroller is what is under it (a modal, a menu or the Prototype tools bar over the scroller hides it).
//
// What does not get one: a box under 64px across either way (a tab strip, a row of chips: the fade at its end says there is more), and anything marked `data-no-drawn-scrollbar` (a photo carousel, which has its own
// arrows). Where only the nearest scroller to the pointer is shown on hover, every scroller that is itself scrolling is shown, so a table inside a page, both scrolling, has two thumbs.

const STRIP = 16; // the thumb's grab area across: 6px of thumb, 2px from the edge, and room to take hold of it
const INSET = 8; // the thumb stops this short of each end of the scroller, clear of a rounded corner
const THUMB_MIN = 28;
const MIN_BOX = 64; // a scroller smaller than this either way is a strip, and keeps to its fade
const HIDE_AFTER = 900; // ms the thumb stays after the last scroll
const GONE_AFTER = 400; // ms after that it is kept (fading out) before it is forgotten

type Axis = "y" | "x";

const RELEASED = -1;

interface Tracked {
  /** When it stops being shown after a scroll (ms on the page clock); `RELEASED` until the next frame says when. */
  until: number;
  overThumb: boolean;
  dragging: boolean;
}

interface Thumb {
  /** Which scroller, and which axis of it. */
  key: string;
  el: HTMLElement;
  axis: Axis;
  left: number;
  top: number;
  width: number;
  height: number;
  shown: boolean;
  /** Pointed at or being dragged: drawn a shade darker. */
  hot: boolean;
}

const rootOf = () => document.scrollingElement as HTMLElement | null;

/** Whether `el` scrolls along `axis` and is big enough to draw a thumb for. */
function scrolls(el: HTMLElement, axis: Axis): boolean {
  if (el.hasAttribute("data-no-drawn-scrollbar")) return false;
  const style = getComputedStyle(el);
  const overflow = axis === "y" ? style.overflowY : style.overflowX;
  // The page itself scrolls whatever its own overflow says (`visible` on the viewport scrolls); anything else must ask to.
  if (el !== rootOf() && overflow !== "auto" && overflow !== "scroll") return false;
  const along = axis === "y" ? el.clientHeight : el.clientWidth;
  const across = axis === "y" ? el.clientWidth : el.clientHeight;
  const total = axis === "y" ? el.scrollHeight : el.scrollWidth;
  return total > along + 1 && along >= MIN_BOX && across >= MIN_BOX;
}

const scrollsAny = (el: HTMLElement) => scrolls(el, "y") || scrolls(el, "x");

/** The nearest element around `target` that scrolls, or none. */
function scrollerAround(target: Element | null): HTMLElement | null {
  for (let el = target as HTMLElement | null; el; el = el.parentElement) {
    if (el === document.body || el === document.documentElement) break;
    if (scrollsAny(el)) return el;
  }
  const root = rootOf();
  return root && scrollsAny(root) ? root : null;
}

/** Where a thumb of `el` is drawn, in the window. */
function thumbOf(el: HTMLElement, axis: Axis): Pick<Thumb, "axis" | "left" | "top" | "width" | "height"> | null {
  const root = el === rootOf();
  const rect = root ? { left: 0, top: 0 } : el.getBoundingClientRect();
  const left = rect.left + (root ? 0 : el.clientLeft);
  const top = rect.top + (root ? 0 : el.clientTop);
  const cw = el.clientWidth;
  const ch = el.clientHeight;
  // Only the part of the scroller that is in the window carries the thumb, so a tall one that runs off the screen still has its thumb on it.
  const from = axis === "y" ? Math.max(top, 0) : Math.max(left, 0);
  const to = axis === "y" ? Math.min(top + ch, window.innerHeight) : Math.min(left + cw, window.innerWidth);
  const track = to - from - INSET * 2;
  const total = axis === "y" ? el.scrollHeight : el.scrollWidth;
  const along = axis === "y" ? ch : cw;
  if (track < THUMB_MIN) return null;
  const length = Math.max(THUMB_MIN, (track * along) / total);
  const range = total - along;
  const offset = axis === "y" ? el.scrollTop : el.scrollLeft;
  const pos = from + INSET + (range > 0 ? offset / range : 0) * (track - length);
  return axis === "y" ? { axis, left: left + cw - STRIP, top: pos, width: STRIP, height: length } : { axis, left: pos, top: top + ch - STRIP, width: length, height: STRIP };
}

export function DrawnScrollbars() {
  const layer = useRef<HTMLDivElement>(null);
  const tracked = useRef(new Map<HTMLElement, Tracked>());
  const hover = useRef<HTMLElement | null>(null);
  const frame = useRef(0);
  const idle = useRef<number | undefined>(undefined);
  const ids = useRef({ of: new WeakMap<HTMLElement, number>(), next: 0 });
  const drag = useRef<{ el: HTMLElement; axis: Axis; from: number; scroll: number; room: number; range: number } | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const track = (el: HTMLElement) => {
      let entry = tracked.current.get(el);
      if (!entry) tracked.current.set(el, (entry = { until: 0, overThumb: false, dragging: false }));
      return entry;
    };

    const idOf = (el: HTMLElement) => {
      let id = ids.current.of.get(el);
      if (id === undefined) ids.current.of.set(el, (id = ids.current.next++));
      return id;
    };

    const tick = () => {
      frame.current = 0;
      window.clearTimeout(idle.current);
      const now = performance.now();
      let moving = false;
      const next: Thumb[] = [];
      for (const [el, entry] of tracked.current) {
        if (entry.until === RELEASED) entry.until = now + HIDE_AFTER;
        const live = now < entry.until || el === hover.current || entry.overThumb || entry.dragging;
        if (!el.isConnected || (!live && now > entry.until + GONE_AFTER)) {
          tracked.current.delete(el);
          continue;
        }
        if (now < entry.until + GONE_AFTER || entry.dragging) moving = true;
        for (const axis of ["y", "x"] as const) {
          if (!scrolls(el, axis)) continue;
          const box = thumbOf(el, axis);
          if (!box) continue;
          let shown = live;
          // Drawn only where the scroller is what is there: a modal, a menu or the tools bar over it, or a clip around it, hides the thumb.
          if (shown && el !== rootOf() && !entry.dragging) {
            // At both ends and the middle, not at one point: a long thumb can run under something that only covers part of it (the tools bar over a table's foot).
            const along = box.axis === "y" ? box.height : box.width;
            shown = [4, along / 2, along - 4].every((at) => {
              const hit = document.elementFromPoint(box.axis === "y" ? box.left + box.width / 2 : box.left + at, box.axis === "y" ? box.top + at : box.top + box.height / 2);
              return !!hit && (el.contains(hit) || !!layer.current?.contains(hit));
            });
          }
          next.push({ ...box, key: `${idOf(el)}${axis}`, shown, el, hot: entry.dragging || entry.overThumb });
        }
      }
      setThumbs((prev) =>
        prev.length === next.length &&
        prev.every((p, i) => p.key === next[i].key && p.shown === next[i].shown && p.hot === next[i].hot && p.left === next[i].left && p.top === next[i].top && p.width === next[i].width && p.height === next[i].height)
          ? prev
          : next,
      );
      // Every frame while something scrolls, fades or is dragged; while a scroller is only being pointed at, a few times a second is enough to follow its content growing.
      if (moving) frame.current = requestAnimationFrame(tick);
      else if (tracked.current.size) idle.current = window.setTimeout(tick, 300);
    };
    const wake = () => {
      window.clearTimeout(idle.current);
      if (!frame.current) frame.current = requestAnimationFrame(tick);
    };

    const onScroll = (e: Event) => {
      const el = e.target === document ? rootOf() : (e.target as HTMLElement);
      if (!(el instanceof HTMLElement) || layer.current?.contains(el) || !scrollsAny(el)) return;
      track(el).until = performance.now() + HIDE_AFTER;
      wake();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !(e.target instanceof Element) || layer.current?.contains(e.target)) return;
      hover.current = scrollerAround(e.target);
      if (hover.current) track(hover.current);
      wake();
    };
    const onLeaveWindow = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      hover.current = null;
      wake();
    };

    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onLeaveWindow, true);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onLeaveWindow, true);
      cancelAnimationFrame(frame.current);
      window.clearTimeout(idle.current);
      frame.current = 0;
    };
  }, []);

  const grab = (e: React.PointerEvent<HTMLDivElement>, thumb: Thumb) => {
    const { el, axis } = thumb;
    const entry = tracked.current.get(el);
    if (!entry) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const along = axis === "y" ? el.clientHeight : el.clientWidth;
    const total = axis === "y" ? el.scrollHeight : el.scrollWidth;
    const length = axis === "y" ? thumb.height : thumb.width;
    const visible = axis === "y" ? Math.min(el.getBoundingClientRect().height, window.innerHeight) : Math.min(el.getBoundingClientRect().width, window.innerWidth);
    drag.current = { el, axis, from: axis === "y" ? e.clientY : e.clientX, scroll: axis === "y" ? el.scrollTop : el.scrollLeft, room: Math.max(1, Math.min(along, visible) - INSET * 2 - length), range: total - along };
    entry.dragging = true;
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const by = ((d.axis === "y" ? e.clientY : e.clientX) - d.from) * (d.range / d.room);
    if (d.axis === "y") d.el.scrollTop = d.scroll + by;
    else d.el.scrollLeft = d.scroll + by;
  };
  const release = () => {
    const d = drag.current;
    if (d) {
      const entry = tracked.current.get(d.el);
      if (entry) {
        entry.dragging = false;
        entry.until = RELEASED; // the next frame stamps the time: the clock is not read while rendering
      }
    }
    drag.current = null;
  };
  const overThumb = (el: HTMLElement, over: boolean) => {
    const entry = tracked.current.get(el);
    if (entry) entry.overThumb = over;
  };

  return (
    <div ref={layer} aria-hidden="true" className={cx("pointer-events-none fixed inset-0", SCROLLBAR_Z_INDEX)}>
      {thumbs.map((thumb) => (
        <div
          key={thumb.key}
          className={cx("absolute transition-opacity duration-150 motion-reduce:transition-none", thumb.shown ? "opacity-100" : "opacity-0")}
          // The grab area takes the pointer only while the thumb is shown, and never on a touch screen, where the thumb only says how far the scroller has gone.
          style={{ left: thumb.left, top: thumb.top, width: thumb.width, height: thumb.height, pointerEvents: thumb.shown && !coarse ? "auto" : "none", touchAction: "none", cursor: "default" }}
          onPointerEnter={() => overThumb(thumb.el, true)}
          onPointerLeave={() => overThumb(thumb.el, false)}
          onPointerDown={(e) => grab(e, thumb)}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <div
            className={cx(
              "absolute rounded-full transition-colors duration-100",
              thumb.axis === "y" ? "inset-y-0 right-0.5 w-1.5" : "inset-x-0 bottom-0.5 h-1.5",
              thumb.hot ? "bg-gray-500" : "bg-gray-400",
            )}
          />
        </div>
      ))}
    </div>
  );
}
