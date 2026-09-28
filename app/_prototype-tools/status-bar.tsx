"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ChevronUp, DotsGrid, Sliders01, XClose } from "@untitledui/icons";
import { Button as AriaButton, Toolbar } from "react-aria-components";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, type Transition } from "motion/react";
import { cx } from "@/utils/cx";
import { ToolMenu } from "./tool-menu";
import { barValue, type Tool } from "./tools";
import { useDragPosition } from "./use-drag-position";

// The Prototype tools bar (designed in /proto/tools, approved 29 Sept 2026). Every tool the screen
// has, each read as a plain phrase of what you are looking at ("Viewing as Registered User",
// "Layout Option 2 of 2", "Upload result Succeeds"). Folds to a small "Prototype tools" tab; a
// forced outcome adds a dot there, and the tab's name says what is forced.
//
// Colour: Flinders Violet (dark), a Figma Foundations palette ingested for this bar only, so it
// reads as a tool on top of the product, never part of it. Scaffold, so Geist (CONTRACTS 1.5).
//
// Motion is kept to the one moment you ask for it. Changing a value is instant. Hiding and showing
// ease the surface's width over 200ms (ease-out, no bounce) with its right edge fixed while the
// content cross-fades; a tool that arrives after the first paint fades in over 150ms. Reduced
// motion turns it all off. Width, not scale, is animated on purpose: the bar is position: fixed,
// so its layout touches nothing else, and a scale-based morph stretches the text.

// Above every map pane and the full-screen takeovers; below modals (lib/layers.ts, CONTRACTS 3.8).
const TOOLS_Z = "z-[10000]";
const DEFAULT_POSITION = { right: 20, bottom: 88 };
const focusRing =
  "outline-none outline-[var(--tool-fg)] data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2";

// The bar's colours, all tokens (Flinders Violet and the error scale in app/globals.css).
const VARS = {
  "--tool-bg": "var(--color-flinders-violet-800)",
  "--tool-ring": "var(--color-flinders-violet-600)",
  "--tool-fg": "var(--color-flinders-violet-25)",
  "--tool-label": "var(--color-flinders-violet-200)",
  "--tool-muted": "var(--color-flinders-violet-300)",
  "--tool-hover": "var(--color-flinders-violet-700)",
  "--tool-divider": "var(--color-flinders-violet-600)",
  "--tool-override": "var(--color-error-300)",
} as CSSProperties;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const MORPH: Transition = { duration: 0.2, ease: EASE_OUT };
const FADE_IN: Transition = { duration: 0.15, ease: EASE_OUT };
const FADE_OUT: Transition = { duration: 0.1, ease: "easeIn" };
const INSTANT: Transition = { duration: 0 };

// Folded or not, remembered across screens (each screen mounts its own bar).
const COLLAPSED_KEY = "prototype-tools-collapsed";
const collapsedListeners = new Set<() => void>();
function useCollapsed() {
  const collapsed = useSyncExternalStore(
    (l) => {
      collapsedListeners.add(l);
      return () => collapsedListeners.delete(l);
    },
    () => window.localStorage.getItem(COLLAPSED_KEY) === "1",
    () => false,
  );
  const set = (next: boolean) => {
    window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    collapsedListeners.forEach((l) => l());
  };
  return [collapsed, set] as const;
}

export function StatusBar({ tools }: { tools: Tool[] }) {
  const reduce = useReducedMotion() ?? false;
  const t = (transition: Transition) => (reduce ? INSTANT : transition);

  const [dragEpoch, setDragEpoch] = useState(0);
  const drag = useDragPosition("status-bar", DEFAULT_POSITION, () =>
    setDragEpoch((n) => n + 1),
  );
  const [collapsed, setCollapsed] = useCollapsed();
  // Tools already there when the bar first paints don't fade in; only ones that arrive later do.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  // Folded, the bar is one small tab. A forced override (a failing upload) adds a dot, and says so
  // in the tab's name, so folding never hides that the page is not showing the normal case.
  const overriding = tools.filter((tool) => tool.override);

  // The surface follows its content's width. It only animates for hide and show (the one change
  // you asked to see); every other change snaps.
  const width = useMotionValue<number | "auto">("auto");
  const morphNext = useRef(false);
  // Where the surface is heading. A size it is already heading to is never re-applied, so a second
  // report (the observer's first callback, React attaching the ref twice in development, an exiting
  // element lifted out of the flow) can't cancel the hide/show ease.
  const target = useRef(-1);
  // Only the content that is showing sets the width; the one fading out keeps quiet.
  const active = useRef<HTMLDivElement | null>(null);
  const measureContent = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      active.current = el;
      const apply = () => {
        if (el !== active.current || !el.isConnected) return;
        const next = el.offsetWidth;
        if (next === target.current) return;
        target.current = next;
        const still = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (morphNext.current && !still) {
          morphNext.current = false;
          animate(width, next, MORPH);
        } else {
          width.stop();
          width.set(next);
        }
      };
      apply();
      const observer = new ResizeObserver(apply);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [width],
  );
  const toggle = (next: boolean) => {
    if (drag.wasDrag()) return;
    morphNext.current = true;
    setCollapsed(next);
  };

  return (
    <div
      className={cx("fixed touch-none select-none", TOOLS_Z)}
      style={{ ...drag.style, ...VARS }}
      onPointerDownCapture={drag.onPointerDown}
    >
      <motion.div
        style={{ width }}
        className={cx(
          "relative flex justify-end overflow-hidden rounded-xl bg-[var(--tool-bg)] font-sans text-[var(--tool-fg)] ring-1 ring-[var(--tool-ring)] transition-shadow duration-150 ease-out",
          drag.isDragging
            ? "cursor-grabbing shadow-2xl"
            : "cursor-grab shadow-xl",
        )}
      >
        <AnimatePresence mode="popLayout" anchorX="right" initial={false}>
          {collapsed ? (
            <motion.div
              key="tab"
              ref={measureContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: t(FADE_IN) }}
              exit={{ opacity: 0, transition: t(FADE_OUT) }}
              className="shrink-0 p-1"
            >
              <AriaButton
                aria-label={
                  overriding.length
                    ? `Show prototype tools. ${overriding
                        .map((tool) => `${tool.barLabel} ${barValue(tool)}`)
                        .join(". ")}`
                    : "Show prototype tools"
                }
                onPress={() => toggle(false)}
                className={cx(
                  "flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-[background-color,scale] duration-150 ease-out hover:bg-[var(--tool-hover)] active:scale-[0.96]",
                  focusRing,
                )}
              >
                <Sliders01
                  className="size-4 shrink-0 text-[var(--tool-muted)]"
                  aria-hidden="true"
                />
                Prototype tools
                {overriding.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[var(--tool-override)]"
                  />
                )}
                <ChevronUp
                  className="size-4 shrink-0 text-[var(--tool-muted)]"
                  aria-hidden="true"
                />
              </AriaButton>
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              ref={measureContent}
              className="shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: t(FADE_IN) }}
              exit={{ opacity: 0, transition: t(FADE_OUT) }}
            >
              <Toolbar
                aria-label="Preview tools"
                className="flex h-11 items-center gap-1 p-1"
              >
                <DotsGrid
                  className="mx-0.5 size-4 shrink-0 text-[var(--tool-muted)]"
                  aria-hidden="true"
                />
                <AnimatePresence initial={false}>
                  {tools.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={settled ? { opacity: 0 } : false}
                      animate={{ opacity: 1, transition: t(FADE_IN) }}
                      exit={{ opacity: 0, transition: INSTANT }}
                      className="flex items-center gap-1"
                    >
                      {i > 0 && (
                        <span aria-hidden="true" className="h-5 w-px bg-[var(--tool-divider)]" />
                      )}
                      <ToolChip
                        tool={tool}
                        wasDrag={drag.wasDrag}
                        closeKey={dragEpoch}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <span aria-hidden="true" className="h-5 w-px bg-[var(--tool-divider)]" />
                <AriaButton
                  aria-label="Hide preview tools"
                  onPress={() => toggle(true)}
                  className={cx(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--tool-muted)] transition-[background-color,color,scale] duration-150 ease-out hover:bg-[var(--tool-hover)] hover:text-[var(--tool-fg)] active:scale-[0.96]",
                    focusRing,
                  )}
                >
                  <XClose className="size-4" aria-hidden="true" />
                </AriaButton>
              </Toolbar>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ToolChip({
  tool,
  wasDrag,
  closeKey,
}: {
  tool: Tool;
  wasDrag: () => boolean;
  closeKey: number;
}) {
  const Icon = tool.icon;
  const value = barValue(tool);
  return (
    <ToolMenu
      tool={tool}
      vars={VARS}
      wasDrag={wasDrag}
      closeKey={closeKey}
      triggerLabel={`${tool.barLabel} ${value}`}
      triggerClassName={(open) =>
        cx(
          "flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm whitespace-nowrap transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]",
          open ? "bg-[var(--tool-hover)]" : "hover:bg-[var(--tool-hover)]",
          focusRing,
        )
      }
    >
      <Icon className="size-4 shrink-0 text-[var(--tool-muted)]" aria-hidden="true" />
      <span className="text-[var(--tool-label)]">{tool.barLabel}</span>
      <span
        title={value}
        className={cx(
          "max-w-44 truncate font-medium",
          tool.override ? "text-[var(--tool-override)]" : "text-[var(--tool-fg)]",
        )}
      >
        {value}
      </span>
      <ChevronUp
        className="size-3.5 shrink-0 text-[var(--tool-muted)]"
        aria-hidden="true"
      />
    </ToolMenu>
  );
}
