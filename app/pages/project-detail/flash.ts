// The "here it is" highlight: scroll a field into the middle of its scroll area and flash it once in
// the brand tint. One helper, so every jump to a field (an artefact's "Go to record", a note in the
// notes list, an edit started from the details panel) looks the same. A Web Animation, so there is
// nothing to clean up.
export function flashElement(
  el: HTMLElement | null | undefined,
  { scroll = true }: { scroll?: boolean } = {},
) {
  if (!el) return;
  if (scroll) el.scrollIntoView({ block: "center", behavior: "smooth" });
  const tint = "var(--color-brand-100)";
  const ring = "var(--color-brand-500)";
  el.animate(
    [
      { backgroundColor: tint, boxShadow: `inset 0 0 0 1px ${ring}` },
      {
        backgroundColor: tint,
        boxShadow: `inset 0 0 0 1px ${ring}`,
        offset: 0.6,
      },
      {
        backgroundColor: "transparent",
        boxShadow: "inset 0 0 0 1px transparent",
      },
    ],
    { duration: 2200, easing: "ease-out" },
  );
}
