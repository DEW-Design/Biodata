"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/utils/cx";

// A horizontally scrolling strip that fades out at its right edge while there is more to scroll to,
// so the cut-off tab reads as "there is more here" instead of as a clipped label. The fade is a
// mask (not an overlay), so it works on any background, and it disappears once the strip is
// scrolled to its end or when everything fits. The scrollbar stays hidden.
export function ScrollFade({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (el) setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);

  return (
    <div
      ref={ref}
      onScroll={update}
      style={moreRight ? { maskImage: "linear-gradient(to right, black calc(100% - 64px), transparent)" } : undefined}
      className={cx("shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {children}
    </div>
  );
}
