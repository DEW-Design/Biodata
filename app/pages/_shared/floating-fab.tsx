"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Button as AriaButton } from "react-aria-components";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";

// The floating dev-tool button behind `RoleSwitcher` and `LayoutOptionSwitcher`: a round FAB that
// opens a menu, and can be dragged anywhere on screen. Fixed corners kept landing on top of page
// controls (a form's Continue button, a table's pagination), and a padding hack on every footer to
// dodge them is the wrong fix - so the person previewing moves the button instead. The position
// (offset from the right and bottom edges, so it survives a window resize) is remembered per FAB
// in localStorage.
//
// z-[10000] (menu popover z-[10001]) - above every Leaflet pane and control (up to z-[1000]/[1001])
// and above the registration flow's full-screen map overlay (z-[9999]), so a map never buries them.
// Modals and slide-over panels sit above these (z-[20000], lib/layers.ts) - a modal covers everything.
export const FAB_Z_INDEX = "z-[10000]";
export const FAB_MENU_Z_INDEX = "z-[10001]";

const FAB_SIZE = 48;
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD_PX = 4;

interface FabPosition {
  right: number;
  bottom: number;
}

const listeners = new Set<() => void>();
const readStored = (key: string) => (typeof window === "undefined" ? null : window.localStorage.getItem(key));
const writeStored = (key: string, value: FabPosition) => {
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

function parse(raw: string | null): FabPosition | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<FabPosition>;
    return typeof value.right === "number" && typeof value.bottom === "number" ? { right: value.right, bottom: value.bottom } : null;
  } catch {
    return null;
  }
}

const clamp = (value: number, max: number) => Math.min(Math.max(EDGE_MARGIN, value), Math.max(EDGE_MARGIN, max));

export function FloatingMenuFab({
  storageKey,
  defaultPosition,
  ariaLabel,
  icon: Icon,
  children,
}: {
  /** Unique per FAB - where its dragged position is remembered. */
  storageKey: string;
  /** Offset in px from the right and bottom edges until the FAB has been moved. */
  defaultPosition: FabPosition;
  ariaLabel: string;
  icon: ComponentType<{ className?: string }>;
  /** The `Dropdown.Menu` to open. */
  children: ReactNode;
}) {
  const key = `fab-position:${storageKey}`;
  const stored = useSyncExternalStore(subscribe, () => readStored(key), () => null);
  const saved = parse(stored);

  const [open, setOpen] = useState(false);
  // While dragging, the live position; otherwise the saved (or default) one.
  const [live, setLive] = useState<FabPosition | null>(null);
  const position = live ?? saved ?? defaultPosition;

  const drag = useRef<{ startX: number; startY: number; startRight: number; startBottom: number; moved: boolean; wasOpen: boolean; last: FabPosition } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  // The menu is portaled, but React still bubbles its events through this wrapper - so every
  // handler checks the real DOM target is the FAB itself, not something inside the open menu.
  const isOnFab = (target: EventTarget) => !!wrapperRef.current && wrapperRef.current.contains(target as Node);

  // Capture phase on both handlers: the trigger's own press handling stops propagation, so a
  // bubble-phase listener on this wrapper would never see the event.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !isOnFab(e.target)) return;
    drag.current = { startX: e.clientX, startY: e.clientY, startRight: position.right, startBottom: position.bottom, moved: false, wasOpen: open, last: position };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      if (!d.moved) {
        d.moved = true;
        setOpen(false);
      }
      d.last = {
        right: clamp(d.startRight - dx, window.innerWidth - FAB_SIZE - EDGE_MARGIN),
        bottom: clamp(d.startBottom - dy, window.innerHeight - FAB_SIZE - EDGE_MARGIN),
      };
      setLive(d.last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (d.moved) {
        writeStored(key, d.last);
        setLive(null);
      } else {
        setOpen(!d.wasOpen);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Opening is handled by the pointer/keyboard logic here, not by the trigger's own press handling,
  // which would open the menu at the start of a drag. Closing (outside click, Escape, picking an
  // item) still comes from the menu itself.
  const onOpenChange = useCallback((next: boolean) => {
    if (!next) setOpen(false);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOnFab(e.target)) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };

  return (
    <div ref={wrapperRef} className={cx("fixed touch-none", FAB_Z_INDEX)} style={{ right: position.right, bottom: position.bottom }} onPointerDownCapture={onPointerDown} onKeyDownCapture={onKeyDown}>
      <Dropdown.Root isOpen={open} onOpenChange={onOpenChange}>
        <AriaButton
          aria-label={ariaLabel}
          className={cx(
            "flex size-12 items-center justify-center rounded-full bg-primary-solid text-white shadow-lg outline-brand transition-transform duration-100 ease-linear select-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2",
            live ? "scale-105 cursor-grabbing" : "cursor-grab active:scale-[0.96]",
          )}
        >
          <Icon className="size-5" />
        </AriaButton>
        <Dropdown.Popover placement="top right" className={FAB_MENU_Z_INDEX}>
          {children}
        </Dropdown.Popover>
      </Dropdown.Root>
    </div>
  );
}
