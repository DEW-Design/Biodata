"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

// Text that gives way where a cut reads well, not wherever its box runs out (the designer, 23 Oct 2026, on the truncation strategy: "a name truncated mid-character is worse than one cut at a word
// boundary; titles, labels and descriptions each need their own truncation logic"). CSS can only cut at a character and only at the end (`text-overflow: ellipsis`), so "kangaroo_island_bushland_assessment_02.xlsx"
// became "kangaroo_island_bus...", losing the extension and the number that tell one file from the next, and "511 km outside the project extent" became "511 km outside the proj...". Two strategies:
//   - "words" (titles, labels, descriptions): cut after the last whole word that fits, then "…". A first word that does not fit on its own is left to CSS, which cuts it at a character.
//   - "name" (file names): keep the end, the last segment and the extension, and cut the middle at a separator: "kangaroo_island_bushland…_02.xlsx". Where no separator fits, the head is cut at a character.
// While it is cut the full text is the element's tooltip and its accessible name, so nothing is lost to a screen reader or a pointer. The room is measured, not guessed: the text's own font on a canvas, against the
// width the element is given, again whenever either changes (and once the fonts have loaded). Until it has been measured the text is simply clipped, as it was before.
// Selecting or copying the text takes the whole of it (the drawn, cut copy is not selectable), and so does finding it on the page.

export type FitStrategy = "words" | "name";

const ELLIPSIS = "…";
const SEPARATOR = /[_\-\s]/;

let canvas: CanvasRenderingContext2D | null = null;
function widthOf(font: string, text: string) {
  canvas ??= document.createElement("canvas").getContext("2d");
  if (!canvas) return 0;
  canvas.font = font;
  return canvas.measureText(text).width;
}

/** A file name as what can give way and what is kept: the extension and the last segment ("kangaroo_island_bushland_assessment" and "_02.xlsx"). */
export function splitName(name: string): [head: string, tail: string] {
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 && name.length - dot <= 6 ? name.slice(dot) : "";
  const stem = extension ? name.slice(0, dot) : name;
  const cut = Math.max(stem.lastIndexOf("_"), stem.lastIndexOf("-"), stem.lastIndexOf(" "));
  return cut > 0 ? [stem.slice(0, cut), stem.slice(cut) + extension] : [stem, extension];
}

/** `text` (known not to fit) cut to fit `width` at `font`, by `strategy`; `text` itself when no good cut exists. */
export function fit(text: string, strategy: FitStrategy, width: number, font: string): string {
  if (width <= 0) return text;
  if (strategy === "words") {
    const words = text.split(" ");
    for (let k = words.length - 1; k >= 1; k--) {
      const head = words.slice(0, k).join(" ").replace(/[\s,;:\-\u2013]+$/, "");
      if (widthOf(font, head + ELLIPSIS) <= width) return head + ELLIPSIS;
    }
    return text;
  }
  const [head, tail] = splitName(text);
  // At a separator first: the longest head that ends before one.
  for (let i = head.length - 1; i > 0; i--) {
    if (SEPARATOR.test(head[i]) && widthOf(font, head.slice(0, i) + ELLIPSIS + tail) <= width) return head.slice(0, i) + ELLIPSIS + tail;
  }
  // Otherwise at a character, the longest head that fits.
  for (let n = head.length - 1; n > 0; n--) {
    if (widthOf(font, head.slice(0, n) + ELLIPSIS + tail) <= width) return head.slice(0, n) + ELLIPSIS + tail;
  }
  return text;
}

/**
 * `tail` is text that belongs to the end of the string and is never cut, so the text gives way before it and it stays next to the ellipsis: a project's code, " (BD-5137)", after its name.
 * The whole of `text` plus `tail` is the tooltip and what a screen reader reads.
 */
export function FittedText({ text, strategy = "words", tail = "", className }: { text: string; strategy?: FitStrategy; tail?: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  // `clip` is set only when there is no good cut (a first word wider than the room): the CSS ellipsis is then the fallback.
  const [{ shown, clip }, setState] = useState({ shown: text, clip: false });

  useLayoutEffect(() => {
    const el = root.current;
    const sizer = el?.firstElementChild;
    if (!el || !sizer) return;
    const update = () => {
      // The whole text fits when the box is as wide as the text asks for (fractional widths: a whole-pixel `clientWidth` cut a name 0.2px too wide). Otherwise cut it, leaving a pixel of room, since the canvas
      // and the page can differ by a little.
      const room = el.getBoundingClientRect().width;
      let next = { shown: text, clip: false };
      if (sizer.getBoundingClientRect().width > room + 0.5) {
        const style = getComputedStyle(el);
        const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        // The tail is kept whole, so the text is cut to what is left of the room after it.
        const cut = fit(text, strategy, room - 1 - (tail ? widthOf(font, tail) : 0), font);
        next = { shown: cut, clip: cut === text };
      }
      setState((prev) => (prev.shown === next.shown && prev.clip === next.clip ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    void document.fonts?.ready.then(update);
    return () => observer.disconnect();
  }, [text, strategy, tail]);

  // The full text sits in the flow, invisible, so the box asks for the room the whole text would take and is given what there is (it can shrink: `min-w-0`); the cut text is drawn over it.
  return (
    <span ref={root} className={cx("relative block min-w-0 overflow-hidden whitespace-nowrap", className)} title={shown !== text ? text + tail : undefined}>
      <span className="opacity-0">
        {text}
        {tail}
      </span>
      <span aria-hidden className={cx("absolute inset-0 overflow-hidden text-left select-none", clip && "text-ellipsis")}>
        {shown}
        {tail}
      </span>
    </span>
  );
}
