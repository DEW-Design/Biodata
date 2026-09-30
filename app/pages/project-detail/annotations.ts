// VERSION 3: notes on individual fields of a record. Any field (a metadata row, or a measurement) can
// carry a flag (the value is questionable), comments, attached files, or any mix of the three.
//
// Example notes, written for this prototype so every combination can be seen; the people are the
// placeholder cast. Kept here, beside version 3, rather than in the shared survey data.
// Key: `${sectionId}:${field label or measurement type}`.

export interface FieldFlag {
  reason: string;
  by: string;
  date: string;
}
export interface FieldComment {
  author: string;
  date: string;
  text: string;
}
export interface FieldFile {
  name: string;
  size: string;
  kind: "image" | "pdf" | "spreadsheet";
}
export interface FieldNotes {
  flag?: FieldFlag;
  comments?: FieldComment[];
  files?: FieldFile[];
}

const NOTES: Record<string, Record<string, FieldNotes>> = {
  // Cleland Stringybark Woodland (Site)
  su1: {
    "details:Description": {
      files: [
        { name: "Autumn 2024 burn extent.pdf", size: "1.1 MB", kind: "pdf" },
      ],
    },
    "details:Site grouping": {
      comments: [
        {
          author: "Maya Dewitt",
          date: "3 Nov 2025",
          text: "Grouped with the other fire-recovery sites so they report together.",
        },
      ],
    },
    "location:Reliability": {
      flag: {
        reason:
          "GPS drift under dense canopy; the true error may be more than 5 m.",
        by: "Phoenix Baker",
        date: "14 Oct 2025",
      },
      comments: [
        {
          author: "Olivia Wyatt",
          date: "15 Oct 2025",
          text: "Re-take the fix from the fire break on the next visit.",
        },
      ],
    },
  },
  // Ridge-top bird transect
  tr1: {
    "details:Sampling effort": {
      comments: [
        {
          author: "Maya Dewitt",
          date: "14 Oct 2025",
          text: "Started 10 minutes late because of fog.",
        },
      ],
    },
  },
  // Superb Fairywren (Population occurrence)
  oc1: {
    "occurrence:Quantity": {
      comments: [
        {
          author: "Phoenix Baker",
          date: "14 Oct 2025",
          text: "Two more birds heard but not seen; not counted.",
        },
      ],
      files: [{ name: "Fairywren group.jpg", size: "2.8 MB", kind: "image" }],
    },
  },
  // Southern Brown Bandicoot (Individual occurrence): all three on one field
  oc4: {
    "occurrence:Sex": {
      flag: {
        reason:
          "Pouch check done in poor light; sex should be confirmed on recapture.",
        by: "Olivia Wyatt",
        date: "16 Oct 2025",
      },
      comments: [
        {
          author: "Phoenix Baker",
          date: "15 Oct 2025",
          text: "Pouch young seen, so recorded as female.",
        },
        {
          author: "Olivia Wyatt",
          date: "16 Oct 2025",
          text: "Agreed, but flag it until the next trapping round.",
        },
      ],
      files: [{ name: "Pouch check photo.jpg", size: "3.4 MB", kind: "image" }],
    },
    "identification:Identified by": {
      comments: [
        {
          author: "Lana Steiner",
          date: "20 Oct 2025",
          text: "Hair sample sent to the museum to confirm.",
        },
      ],
    },
  },
  // Bandicoot capture measurements (Individual observation)
  ob6: {
    "measurements:Body mass": {
      flag: {
        reason: "Spring balance was not calibrated that morning.",
        by: "Phoenix Baker",
        date: "15 Oct 2025",
      },
      files: [
        { name: "Capture sheet.xlsx", size: "38 KB", kind: "spreadsheet" },
      ],
    },
  },
};

export function notesFor(
  recordId: string,
  key: string,
): FieldNotes | undefined {
  return NOTES[recordId]?.[key];
}

/** What a section holds, for a summary on its (closed) header. */
export function sectionNoteSummary(
  recordId: string,
  sectionId: string,
): { flags: number; comments: number; files: number } {
  const entries = Object.entries(NOTES[recordId] ?? {}).filter(([k]) =>
    k.startsWith(`${sectionId}:`),
  );
  return {
    flags: entries.filter(([, n]) => n.flag).length,
    comments: entries.reduce(
      (sum, [, n]) => sum + (n.comments?.length ?? 0),
      0,
    ),
    files: entries.reduce((sum, [, n]) => sum + (n.files?.length ?? 0), 0),
  };
}

export function hasNotes(n: FieldNotes | undefined): n is FieldNotes {
  return (
    !!n &&
    (!!n.flag || (n.comments?.length ?? 0) > 0 || (n.files?.length ?? 0) > 0)
  );
}
