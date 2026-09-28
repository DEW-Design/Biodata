"use client";

import { useRef, useState, useSyncExternalStore } from "react";

// Drag-anywhere positioning for the tool clusters, the same model as FloatingMenuFab: the position
// is an offset from the right and bottom edges (so it survives a window resize), remembered per
// storage key in localStorage. A press that moves less than 4px is a click, not a drag: callers
// read `wasDrag()` in their press handler and ignore the press when it returns true.

export interface EdgeOffset {
  right: number;
  bottom: number;
}

const EDGE_MARGIN = 8;
const DRAG_THRESHOLD_PX = 4;

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

function parse(raw: string | null): EdgeOffset | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<EdgeOffset>;
    return typeof v.right === "number" && typeof v.bottom === "number"
      ? { right: v.right, bottom: v.bottom }
      : null;
  } catch {
    return null;
  }
}

export function useDragPosition(
  storageKey: string,
  fallback: EdgeOffset,
  onDragStart?: () => void,
) {
  const key = `proto-tools-position:${storageKey}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );
  const [live, setLive] = useState<EdgeOffset | null>(null);
  const position = live ?? parse(raw) ?? fallback;
  const dragged = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    dragged.current = false;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const start = {
      x: e.clientX,
      y: e.clientY,
      right: position.right,
      bottom: position.bottom,
    };
    let last = position;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      // react-aria opens a menu on press start, so a drag that began on a tool button has already
      // opened its menu; the caller closes it here.
      if (!dragged.current) onDragStart?.();
      dragged.current = true;
      last = {
        right: Math.min(
          Math.max(EDGE_MARGIN, start.right - dx),
          window.innerWidth - rect.width - EDGE_MARGIN,
        ),
        bottom: Math.min(
          Math.max(EDGE_MARGIN, start.bottom - dy),
          window.innerHeight - rect.height - EDGE_MARGIN,
        ),
      };
      setLive(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (dragged.current) {
        window.localStorage.setItem(key, JSON.stringify(last));
        listeners.forEach((l) => l());
      }
      setLive(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return {
    style: { right: position.right, bottom: position.bottom },
    isDragging: live !== null,
    /** Attach with onPointerDownCapture, so a drag can start from any button inside. */
    onPointerDown,
    wasDrag: () => dragged.current,
  };
}
