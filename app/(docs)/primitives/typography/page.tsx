import { PageHeader } from "@/components/PageHeader";

const typeScale = [
  { name: "Display 2xl", token: "text-display-2xl", size: "72px", lineHeight: "90px", weight: "600", tracking: "-2%" },
  { name: "Display xl",  token: "text-display-xl",  size: "60px", lineHeight: "72px", weight: "600", tracking: "-2%" },
  { name: "Display lg",  token: "text-display-lg",  size: "48px", lineHeight: "60px", weight: "600", tracking: "-2%" },
  { name: "Display md",  token: "text-display-md",  size: "36px", lineHeight: "44px", weight: "600", tracking: "-2%" },
  { name: "Display sm",  token: "text-display-sm",  size: "30px", lineHeight: "38px", weight: "600", tracking: "-1%" },
  { name: "Display xs",  token: "text-display-xs",  size: "24px", lineHeight: "32px", weight: "600", tracking: "-1%" },
  { name: "Text xl",     token: "text-xl",           size: "20px", lineHeight: "30px", weight: "400–600", tracking: "0%" },
  { name: "Text lg",     token: "text-lg",           size: "18px", lineHeight: "28px", weight: "400–600", tracking: "0%" },
  { name: "Text md",     token: "text-md",           size: "16px", lineHeight: "24px", weight: "400–600", tracking: "0%" },
  { name: "Text sm",     token: "text-sm",           size: "14px", lineHeight: "20px", weight: "400–600", tracking: "0%" },
  { name: "Text xs",     token: "text-xs",           size: "12px", lineHeight: "18px", weight: "400–600", tracking: "0%" },
];

const fontWeights = [
  { name: "Regular", value: "400", usage: "Body copy, descriptions" },
  { name: "Medium",  value: "500", usage: "Labels, nav items, captions" },
  { name: "Semibold",value: "600", usage: "Headings, button labels, emphasis" },
  { name: "Bold",    value: "700", usage: "Display type, marketing headers" },
];

export default function TypographyPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Primitives"
        title="Typography"
        description="Type scale and weight system based on Untitled UI conventions. Heading sizes use negative letter-spacing for optical tightening."
      />

      <h2 className="text-balance">Type scale</h2>
      <p className="text-balance">Sizes follow a modular scale. Display sizes are for headings, text sizes for body and UI copy.</p>

      <div className="flex flex-col gap-1 mt-6">
        {typeScale.map((t) => (
          <div
            key={t.token}
            className="flex items-baseline gap-8 py-3"
            style={{ borderBottom: "1px solid var(--color-gray-100)" }}
          >
            <div style={{ width: "200px", flexShrink: 0 }}>
              <p className="font-barlow text-balance" style={{
                fontSize: t.size,
                lineHeight: t.lineHeight,
                fontWeight: parseInt(t.weight) || 600,
                color: "var(--color-gray-900)",
                letterSpacing: t.tracking === "-2%" ? "-0.02em" : t.tracking === "-1%" ? "-0.01em" : "0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                Dew
              </p>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
              <div>
                <p className="text-xs mb-0.5 text-balance" style={{ color: "var(--color-gray-400)" }}>Name</p>
                <p className="text-sm font-medium text-balance" style={{ color: "var(--color-gray-700)" }}>{t.name}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-balance" style={{ color: "var(--color-gray-400)" }}>Size</p>
                <code className="text-xs">{t.size}</code>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-balance" style={{ color: "var(--color-gray-400)" }}>Line height</p>
                <code className="text-xs">{t.lineHeight}</code>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-balance" style={{ color: "var(--color-gray-400)" }}>Tracking</p>
                <code className="text-xs">{t.tracking}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-balance">Font weights</h2>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Example</th>
            <th>Name</th>
            <th>Value</th>
            <th>Usage</th>
          </tr>
        </thead>
        <tbody>
          {fontWeights.map((w) => (
            <tr key={w.name}>
              <td>
                <span className="font-barlow text-balance" style={{ fontWeight: parseInt(w.value), fontSize: "16px", color: "var(--color-gray-900)" }}>
                  The quick brown fox
                </span>
              </td>
              <td className="text-balance" style={{ color: "var(--color-gray-700)" }}>{w.name}</td>
              <td><code>{w.value}</code></td>
              <td className="text-balance" style={{ color: "var(--color-gray-500)" }}>{w.usage}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Text wrapping</h2>
      <p className="text-balance">
        Any component copy that can wrap to two or more lines (a Modal, Alert, Toast or Tooltip title or
        description, a SectionHeader heading or subheading, an Accordion item title, a Checkbox, RadioButton or Toggle
        label or hint, a RadioGroup card&apos;s title or description) carries Tailwind&apos;s{" "}
        <code>text-balance</code> utility (<code>text-wrap: balance</code>). It evens out the line lengths of a
        wrapped heading or short paragraph, so the last line is never a single orphan word. Text that never wraps (a
        Badge or Tag label, a Button label, a Table header cell) doesn&apos;t need it.
      </p>
      <p className="text-balance">
        This documentation site&apos;s own prose (every heading and paragraph inside <code>.prose-doc</code>) already
        used the utility. This section states the convention and extends it to <code>components/base/**</code> and{" "}
        <code>components/application/**</code>.
      </p>

      <h2 className="text-balance">Font family</h2>
      <p className="text-balance">
        <code>--font-barlow</code> is set to <strong>Barlow</strong>, the primary typeface of the DEW design system. The type
        scale above previews in Barlow, and every component&apos;s root element sets it (Button, Input, Badge, Checkbox, Tag,
        Tooltip…), so components keep it wherever they&apos;re used, whatever the surrounding page font.
      </p>
      <p className="text-balance">
        <code>--font-sans</code> is set to <strong>Geist</strong> and is scoped to this documentation site&apos;s own UI (sidebar, headings, body
        copy), not the design system.
      </p>
      <p className="text-balance">
        <code>--font-mono</code> is set to <strong>Geist Mono</strong> for code snippets and token values across the documentation UI.
      </p>
    </div>
  );
}
