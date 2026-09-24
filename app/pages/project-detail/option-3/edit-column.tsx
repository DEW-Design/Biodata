"use client";

// A real docked column, not an overlay - per direct feedback with a real Jira screenshot: "In
// Jira it is appearing as a new column. I want a new column to the right." Rendered once, as a
// genuine flex sibling of the page's own `<main>` content (see page.tsx), so opening it shrinks
// the main content area the way Jira's own work-item panel does - it never covers anything with a
// backdrop the way the earlier `SidePanel`-based version did.
//
// Every card across the About tab (and the project header, for its own Start/End Date/Status
// fields) shares one `activeEdit` slot, lifted to `page.tsx` (the nearest common ancestor) -
// exactly like Jira, which only ever shows one item's panel at a time regardless of how many
// cards exist on the page behind it.
//
// The docked width is now a real drag-to-resize handle, per direct reference to shadcn's own
// react-aria-components-based Resizable (ui.shadcn.com/docs/components/aria/resizable) - dragging
// the handle on the column's own left edge tracks the pointer directly (native `pointermove`, no
// new dependency pulled in for what's a straightforward drag calculation), clamped to a sensible
// min/max, plus left/right arrow keys for the same resize while the handle has focus (the same
// `role="separator"` keyboard affordance a real resizable-panel handle carries). The expand icon
// is a separate, second way to get more room - it switches the column out of the flex row
// entirely into a `fixed inset-0` full-screen overlay, independent of whatever width was last
// dragged to; minimize returns to that same dragged width, not a reset default.

import { useEffect, useState, type ReactNode } from "react";
import { Maximize02, Minimize02, X as XIcon } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export interface EditRequest {
  /** Shown as the column's own small title bar text - a plain label, not the question-style
   *  heading inside (that's the real `TypeformCard` kicker/title every editor renders itself). */
  title: string;
  render: (onDone: () => void) => ReactNode;
}

// 380 clipped the date-picker's own calendar-icon trigger: `FieldRow` (field-editor.tsx) switches
// label-above-control to label-beside-control at Tailwind's `sm:` breakpoint, which is a viewport-
// width media query, not a container query - on a real desktop viewport (always >= 640px here) it
// never actually stacks, so the panel's own minimum has to leave room for the side-by-side layout.
const MIN_WIDTH = 480;
const MAX_WIDTH = 920;
const DEFAULT_WIDTH = 520;
const KEYBOARD_STEP = 24;

// The main content column must never be squeezed thinner than this - per direct feedback ("the
// main content area content is breaking when i resize the right edit panel. Make sure you
// maintain a fixed main column width beyond which the resize will be stopped or float on top").
// `ICON_RAIL_WIDTH` matches the primary nav's own fixed `w-16` in page.tsx - both this and
// `MAIN_MIN_WIDTH` are used purely to bound the docked column's own width against the real
// viewport (there's no ResizeObserver on `<main>` itself; `window.innerWidth` is already the same
// proxy `ResizeHandle`'s own drag math relies on, since the flex row spans the full viewport).
const ICON_RAIL_WIDTH = 64;
const MAIN_MIN_WIDTH = 760;

/** The most the column can be while docked without pushing `<main>` below its own minimum - never
 *  less than `MIN_WIDTH` itself, so a very narrow viewport is handled by `EditColumn` switching to
 *  floating mode entirely (see `canDock` below), not by this clamp alone. */
function dockedMaxWidth(): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - ICON_RAIL_WIDTH - MAIN_MIN_WIDTH));
}

/** Whether the column can dock (shrink `<main>` to make room) at its own minimum width without
 *  already violating `MAIN_MIN_WIDTH` - false only on a viewport too narrow to give the column
 *  `MIN_WIDTH` and still leave `<main>` its own minimum, in which case the column floats over
 *  `<main>` instead of shrinking it further. */
function canDock(): boolean {
  return window.innerWidth - ICON_RAIL_WIDTH - MAIN_MIN_WIDTH >= MIN_WIDTH;
}

function ColumnHeader({ title, isFullScreen, onToggleFullScreen, onClose }: { title: string; isFullScreen: boolean; onToggleFullScreen: () => void; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary p-4">
      <p className="truncate text-sm font-medium text-primary">{title}</p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          color="tertiary"
          size="sm"
          iconLeading={isFullScreen ? Minimize02 : Maximize02}
          aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
          onClick={onToggleFullScreen}
        />
        <Button color="tertiary" size="sm" iconLeading={XIcon} aria-label="Close" onClick={onClose} />
      </div>
    </div>
  );
}

/** The drag-to-resize handle - a thin visible line inside a wider invisible hit area (easier to
 *  grab than a bare 1px line), matching the shadcn Resizable reference's own handle shape.
 *  `onResize` receives the pointer's live distance from the viewport's right edge, which is
 *  exactly the column's own width since it's flush against that edge. `maxWidth` is passed in
 *  rather than read from a constant - docked mode bounds it to `dockedMaxWidth()` (so dragging
 *  can never squeeze `<main>` below its own minimum), floating mode bounds it to the plain
 *  `MAX_WIDTH` (there's no `<main>` to protect once the column isn't sharing the row with it). */
function ResizeHandle({ width, maxWidth, isFloating, onResize }: { width: number; maxWidth: number; isFloating: boolean; onResize: (next: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  // Listeners are attached synchronously inside the pointerdown handler itself, not via a
  // `useEffect` keyed off `isDragging` state - a `useEffect` only runs after React commits and
  // paints, so there's a real gap between pointerdown and the listener actually being live. A fast
  // drag (a real flick, or a scripted/automated one that dispatches its moves in one task with no
  // yield back to the event loop in between) can fire every pointermove before that effect ever
  // attaches, silently dropping the whole gesture. Attaching directly in the handler closes that
  // gap - the browser guarantees pointerdown has already fired by the time this runs, and pointer
  // capture keeps every subsequent move routed here even if the cursor leaves the handle.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    // Re-derived from the window's own live size on every move (not the closed-over `maxWidth`
    // prop) so a window resize mid-drag is honoured immediately rather than only on the next
    // pointerdown.
    const onMove = (moveEvent: PointerEvent) => {
      const liveMax = isFloating ? MAX_WIDTH : dockedMaxWidth();
      onResize(Math.min(liveMax, Math.max(MIN_WIDTH, window.innerWidth - moveEvent.clientX)));
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      aria-valuenow={width}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={maxWidth}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onResize(Math.min(maxWidth, width + KEYBOARD_STEP));
        if (e.key === "ArrowRight") onResize(Math.max(MIN_WIDTH, width - KEYBOARD_STEP));
      }}
      className="group relative w-3.5 shrink-0 cursor-col-resize touch-none select-none outline-hidden"
    >
      <div className={cx("mx-auto h-full w-px bg-secondary transition-colors group-hover:bg-brand-solid", isDragging && "bg-brand-solid")} />
    </div>
  );
}

export function EditColumn({ request, onClose }: { request: EditRequest | null; onClose: () => void }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  // Docked by default (matches the server-rendered/first-paint state, before `window` is read) -
  // corrected in the effect below on mount and kept live across resizes after that.
  const [isFloating, setIsFloating] = useState(false);

  // Recomputes whether the column can still dock without squeezing `<main>` below its own
  // minimum, on mount and on every window resize - so a live browser resize can push an
  // already-open docked panel into floating mode (or back), not just a fresh open. Also
  // re-clamps the current width down to whatever the (possibly now-smaller) docked max allows,
  // so `<main>` is never left thinner than `MAIN_MIN_WIDTH` after a resize either.
  useEffect(() => {
    const sync = () => {
      setIsFloating(!canDock());
      setWidth((w) => Math.min(w, dockedMaxWidth()));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (!request) return null;

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-primary">
        <ColumnHeader title={request.title} isFullScreen onToggleFullScreen={() => setIsFullScreen(false)} onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{request.render(onClose)}</div>
      </div>
    );
  }

  const maxWidth = isFloating ? MAX_WIDTH : dockedMaxWidth();
  const columnBody = (
    <div className="flex min-w-0 flex-1 flex-col border-l border-secondary bg-primary">
      <ColumnHeader title={request.title} isFullScreen={false} onToggleFullScreen={() => setIsFullScreen(true)} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{request.render(onClose)}</div>
    </div>
  );

  if (isFloating) {
    // The viewport is too narrow to dock (shrink `<main>`) without violating its own minimum -
    // the column floats over `<main>`'s right edge instead, leaving it at full width underneath,
    // per direct request ("the resize will be stopped or float on top"). A strong shadow (instead
    // of a backdrop) marks it as detached from the page's own flex row, while still leaving
    // whatever's behind it visible.
    return (
      <div className="fixed inset-y-0 right-0 z-[500] flex shadow-2xl" style={{ width }}>
        <ResizeHandle width={width} maxWidth={maxWidth} isFloating={isFloating} onResize={setWidth} />
        {columnBody}
      </div>
    );
  }

  return (
    <div className="flex shrink-0" style={{ width }}>
      <ResizeHandle width={width} maxWidth={maxWidth} isFloating={isFloating} onResize={setWidth} />
      {columnBody}
    </div>
  );
}
