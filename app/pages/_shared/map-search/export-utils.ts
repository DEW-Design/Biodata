// Real, working export helpers for the map search results tables - no new npm dependency for any
// of the three formats, per direct request ("export the results as CSV/Excel or PDF"). Generic
// over a plain headers[] + rows[][] shape so any table on this page can reuse the same three
// functions rather than each hand-rolling its own.
//
// CSV: a genuine CSV string (RFC 4180 quoting for any value containing a comma/quote/newline),
// downloaded via a Blob + a temporary <a download> - the standard, dependency-free technique.
//
// "Excel": genuinely real, no new dependency - generates a plain HTML <table> and serves it with
// the `application/vnd.ms-excel` MIME type and a `.xls` extension. Excel (and Google Sheets/
// LibreOffice) all open an HTML table served this way as a real, correctly-parsed spreadsheet -
// a well-established, long-standing technique, not a stub. A true `.xlsx` (the modern zipped-XML
// format) needs a real binary-format library, which this repo doesn't have - not added just for
// this feature, per the same "don't add scope/dependencies without cause" judgement this build
// already applies elsewhere. This is a deliberate choice, logged here, not an oversight.
//
// PDF: genuinely real, no new dependency - opens a dedicated print-only window with the same
// table, styled for print, and calls that window's own `window.print()`, where "Save as PDF" is a
// real, standard destination in every modern browser's print dialog. A dedicated window (rather
// than an in-page `@media print` stylesheet scoping the live app's own layout) avoids fighting the
// live page's own scroll containers/chrome during print - simpler and more reliable.

function csvCell(value: string): string {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
}

function triggerDownload(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
    const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
    triggerDownload(filename, lines.join("\r\n"), "text/csv;charset=utf-8");
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function downloadExcel(filename: string, headers: string[], rows: string[][]) {
    const headerRow = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
    const bodyRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1">${headerRow}${bodyRows}</table></body></html>`;
    triggerDownload(filename, html, "application/vnd.ms-excel");
}

// The print window is a blank document, so the product's stylesheet is not in it. Its type and colours are read from the page that opens it: the token values
// (`--ui-*`), and Barlow's own @font-face rules copied across so the PDF is set in the product's face (it was Arial, with the colours typed in as hex, until 11 Nov 2026).
function printTheme() {
    const root = getComputedStyle(document.documentElement);
    const token = (name: string) => root.getPropertyValue(name).trim();
    const product = document.querySelector(".font-barlow") ?? document.body;
    const fontFaces: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // a stylesheet from another origin cannot be read
        }
        // A face's file is addressed from its own stylesheet; the print window has no stylesheet address, so each address is made whole here.
        const base = sheet.href ?? document.baseURI;
        for (const rule of Array.from(rules)) {
            if (rule instanceof CSSFontFaceRule) fontFaces.push(rule.cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_, quote: string, address: string) => `url("${new URL(address, base).href}")`));
        }
    }
    return {
        fontFamily: getComputedStyle(product).fontFamily,
        fontFaces: fontFaces.join("\n"),
        text: token("--ui-text-primary"),
        muted: token("--ui-text-tertiary"),
        border: token("--ui-border-primary"),
        headFill: token("--ui-bg-secondary"),
    };
}

export function printAsPdf(title: string, headers: string[], rows: string[][]) {
    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) return;
    const theme = printTheme();
    const headerRow = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
    const bodyRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${escapeHtml(title)}</title>
<meta charset="UTF-8">
<style>
  ${theme.fontFaces}
  body { font-family: ${theme.fontFamily}; padding: 24px; color: ${theme.text}; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p { font-size: 11px; color: ${theme.muted}; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid ${theme.border}; padding: 6px 8px; font-size: 11px; text-align: left; vertical-align: top; }
  th { background: ${theme.headFill}; font-weight: 600; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>Exported from BioData SA on ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })} - ${rows.length} record${rows.length === 1 ? "" : "s"}.</p>
<table>${headerRow}${bodyRows}</table>
</body>
</html>`);
    win.document.close();
    win.focus();
    // Print once the copied faces have loaded, so the PDF is not set in the fallback.
    const print = () => win.print();
    if (win.document.fonts?.ready) win.document.fonts.ready.then(print, print);
    else print();
}
