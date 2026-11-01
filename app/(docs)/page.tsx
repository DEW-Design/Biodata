"use client";

import Link from "next/link";
import { useNav } from "@/lib/use-nav";

export default function OverviewPage() {
  const nav = useNav();
  const stats = nav.map((section) => ({ label: section.title, value: String(section.items.length) }));

  return (
    <div>
      <div className="mb-16 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-balance"
          style={{ color: "var(--color-gray-400)" }}
        >
          Design System
        </p>
        <h1 className="text-4xl font-semibold mb-4 text-balance"
          style={{ color: "var(--color-gray-900)", letterSpacing: "-0.04em", lineHeight: 1.1 }}
        >
          DEW
        </h1>
        <p className="text-base mb-8 text-balance"
          style={{ color: "var(--color-gray-500)", maxWidth: "520px", lineHeight: "1.75" }}
        >
          The tokens, components and patterns of the DEW product. Token naming, scale
          and component APIs follow Untitled UI.
        </p>

        <div className="flex gap-8 mb-8">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold tracking-tight text-balance"
                style={{ color: "var(--color-gray-900)", letterSpacing: "-0.03em" }}
              >
                {s.value}
              </p>
              <p className="text-sm text-balance" style={{ color: "var(--color-gray-400)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm rounded-lg px-3 py-2 group"
            style={{ border: "1px solid var(--color-gray-200)", color: "var(--color-gray-600)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--color-gray-400)" }}>
              <path d="M9 2H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5L9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M9 2v3.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M6 9h4M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="group-hover:underline underline-offset-2 font-medium text-balance" style={{ color: "var(--color-gray-700)" }}>
              llms.txt
            </span>
            <span className="text-balance" style={{ color: "var(--color-gray-400)" }}>- machine-readable summary for AI agents</span>
          </a>
        </div>
      </div>

      <hr style={{ borderColor: "var(--color-gray-200)" }} className="mb-12" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {nav.map((section) => (
          <div
            key={section.title}
            className="rounded-xl p-5"
            style={{
              border: "1px solid var(--color-gray-200)",
              background: "var(--color-gray-25)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-balance"
              style={{ color: "var(--color-gray-400)" }}
            >
              {section.title}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between text-sm py-1.5 group"
                    style={{ color: "var(--color-gray-700)" }}
                  >
                    <span className="group-hover:underline underline-offset-2 text-balance">
                      {item.title}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-gray-400)" }}
                    >
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
