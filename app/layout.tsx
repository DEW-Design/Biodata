import type { Metadata } from "next";
import { Barlow, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Agentation } from "agentation";
import { Toaster } from "@/components/application/toast/toast";
import { ConfigProvider } from "@/lib/config-context";
import { AppRouterProvider } from "@/components/app-router-provider";

// Geist dresses the docs site chrome (sidebar, headings, prose).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Geist Mono is the docs UI's monospace face (code snippets, token values).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Barlow is the DEW component typeface - applied directly on component
// roots (see `font-barlow` usages in components/base/**) so components
// render in Barlow regardless of the page font around them. Both styles are
// loaded (not just normal) so a scientific name (species.tsx uses `italic`
// throughout Explore, the record pages and the nomination form) renders a
// real italic instead of a browser-synthesised slant - see the type audit's
// D5, `font-synthesis: none` in globals.css pairs with this so a missing
// weight or style surfaces as a visible gap instead of a faked-up one.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "DEW Design System",
  description: "DEW - design tokens, components, and patterns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${barlow.variable} font-sans`} suppressHydrationWarning>
        <AppRouterProvider>
          <ConfigProvider>
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && <Agentation />}
          </ConfigProvider>
        </AppRouterProvider>
      </body>
    </html>
  );
}
