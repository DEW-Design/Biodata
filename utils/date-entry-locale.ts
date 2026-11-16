/**
 * The locale every date field is entered in. Dates are entered as DD/MM/YYYY, always (designer, 11 Nov 2026), and the field's segment order comes from its
 * locale, so it is fixed here and not read from the browser: an en-US browser would otherwise draw MM/DD/YYYY. Also sets the calendar's week to start on Monday.
 */
export const DATE_ENTRY_LOCALE = "en-AU";
