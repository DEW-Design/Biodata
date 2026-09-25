"use client";

import { useRef } from "react";
import { cx } from "@/utils/cx";

// Matches the Figma "Enter Code" screen (node 26:2338) - 6 individual 40x40 boxes split 3-3 by a
// "-" separator. No DEW OTP/code-input component exists yet (per CONTEXT.md's "no match, no
// substitute" rule) - built here from plain, individually-controlled <input>s rather than a
// fabricated component, with auto-advance on type, backspace-to-previous, and paste-to-fill.
// Kept page-local rather than promoted to components/custom/** since its API isn't settled yet.
const LENGTH = 6;

export function OtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, "");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(LENGTH, "").slice(0, LENGTH).replace(/\s/g, ""));
    inputRefs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <p className="text-sm font-medium text-secondary">Enter 6-digit code</p>
      <div className="flex w-full items-center justify-center gap-2">
        {digits.slice(0, 3).map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Code digit ${i + 1}`}
            className={cx(
              "size-10 rounded-lg border border-primary bg-primary text-center text-lg font-medium text-primary shadow-xs outline-hidden",
              "focus:ring-2 focus:ring-brand",
            )}
          />
        ))}
        <p className="text-sm font-medium text-[var(--color-gray-300)]">-</p>
        {digits.slice(3, 6).map((digit, i) => (
          <input
            key={i + 3}
            ref={(el) => {
              inputRefs.current[i + 3] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i + 3, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i + 3, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Code digit ${i + 4}`}
            className={cx(
              "size-10 rounded-lg border border-primary bg-primary text-center text-lg font-medium text-primary shadow-xs outline-hidden",
              "focus:ring-2 focus:ring-brand",
            )}
          />
        ))}
      </div>
    </div>
  );
}
