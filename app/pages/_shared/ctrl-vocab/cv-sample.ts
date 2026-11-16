import { parseDate } from "@internationalized/date";
import { OPTIONAL_FIELDS, newId, todayIso, withDerivedOrder, type Cv, type CvDraft, type CvEntry } from "@/app/pages/_shared/ctrl-vocab/cv-data";

// The vocabulary form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch of the form (the designer, 10 Nov 2026): a Reference vocabulary, whose entries are typed in across every column,
// where a Descriptive one only picks rows of a table. Its entries are identified by a code the admin types (an automatic ID asks for less), it
// uses all four optional columns (Order, Title, Description, Value) and two of its own, and it has an end date. Four entries, each filled in every
// column, so the grid shows what each column is for.
// Honest (CONTRACTS 0.3): the values are the Darwin Core "sex" terms the vocabulary is named for; the category is one the build already has.

const NAME = "Sex";

/** The name, numbered when another vocabulary already has it, so a sample saved once does not refuse the next. */
function freeName(all: Cv[]): string {
  const taken = new Set(all.map((cv) => cv.name.trim().toLowerCase()));
  let name = NAME;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${NAME} ${i}`;
  return name;
}

const inDays = (days: number) => parseDate(todayIso()).add({ days }).toString();

export function sampleCv(all: Cv[]): CvDraft {
  const fieldSheet = newId("custom");
  const appliesTo = newId("custom");
  // code, name, title, description, value, field sheet label, applies to
  const rows: [string, string, string, string, string, string, string][] = [
    ["male", "Male", "Male", "The individual was recorded as male.", "M", "M", "Birds, mammals and reptiles"],
    ["female", "Female", "Female", "The individual was recorded as female.", "F", "F", "Birds, mammals and reptiles"],
    ["hermaphrodite", "Hermaphrodite", "Hermaphrodite", "The individual has both male and female parts, as many plants do.", "H", "H", "Plants and invertebrates"],
    ["unknown", "Unknown", "Unknown", "The sex was not checked or could not be told.", "U", "U", "All species"],
  ];
  const entries: CvEntry[] = withDerivedOrder(
    rows.map(([code, name, title, description, value, sheet, applies]) => ({
      id: newId("entry"),
      code,
      name,
      title,
      description,
      value,
      order: "",
      status: "active",
      custom: { [fieldSheet]: sheet, [appliesTo]: applies },
    })),
  );
  return {
    name: freeName(all),
    category: "Occurrence",
    type: "reference",
    idKind: "code",
    startDate: todayIso(),
    endDate: inDays(365),
    description: "The sex of the individual that was recorded, as Darwin Core names it.",
    fields: [...OPTIONAL_FIELDS],
    customColumns: [
      { id: fieldSheet, label: "Field sheet label" },
      { id: appliesTo, label: "Applies to" },
    ],
    entries,
    sourceTable: "",
    mapping: {},
  };
}
