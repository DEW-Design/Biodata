"use client";

// Editing a survey record, and adding a new one. Same drawer and `FormPage` as editing a project
// section (edit-drawer.tsx, project-edit.tsx), so every edit on the page works the same way:
// Save changes applies, Cancel asks before discarding, and missing essentials show the same
// "Details missing" alert with the fields marked.
//
// Each metadata section is one `FormRow` (label and description on the left, its fields on the
// right), in the order the record shows them. Lists grow and shrink in place: observers,
// measurements (MeasurementOrFact), custom properties and attachments. Values the system sets (IDs,
// record type, parent, datum) are shown locked. A new record uses the same form, started from the
// defaults for its type (record-rules.ts); only its name and date (and, for an occurrence, the
// scientific name) are required, the rest can be filled in later.

import { useEffect, useRef, useState } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { Lock01, Plus, Trash01, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { toast } from "@/components/application/toast/toast";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import { artefactTypeMeta, type ArtefactType } from "@/app/pages/_shared/artefact-lightbox";
import { EditDrawer } from "./edit-drawer";
import { useEditStore, type SurveyArtefact } from "./edit-store";
import { nameRow } from "./record-rules";
import { formatDate, type MetaRow, type MetaSection, type SurveyRecord } from "./survey-data";

import { LOCKED, LONG, boundaryCentre, ibraFor, nsxSpecies, trapMissing, type TrapEntry } from "./field-schema";
import type { GeoExtentValue } from "@/app/pages/project-registration/types";
export { LOCKED, LONG };
const DATE_TERMS = new Set(["eventDate", "measurementDeterminedDate"]);
export const SELECTS: Record<string, string[]> = {
  "Basis of record": ["HumanObservation", "PreservedSpecimen", "MachineObservation"],
  "Occurrence status": ["Present", "Absent"],
  "Establishment means": ["Native", "Introduced", "Uncertain"],
  "Verification status": ["Verified by expert", "Unverified", "Needs review"],
  "Photopoint marker present": ["Yes", "No"],
  Kingdom: ["Animalia", "Plantae", "Fungi"],
  Season: ["Spring", "Summer", "Autumn", "Winter"],
};
export const EMPTY = new Set(["Not provided", "None recorded"]);
export const SECTION_HINT: Record<string, string> = {
  details: "What this record is and how it was sampled.",
  temporal: "When it happened.",
  observers: "Everyone who recorded it.",
  location: "Where it was, in GDA2020.",
  photopoint: "The fixed photo point, if there is one.",
  occurrence: "What was found, in Darwin Core terms.",
  taxon: "The species, as identified.",
  identification: "Who identified it, and how sure.",
  voucher: "The specimen or sample kept, if any.",
  observation: "Who measured what, and how.",
  measurements: "One row per measurement or fact.",
  custom: "Anything the standard fields don't cover.",
};

let nextLocalId = 1;
export const localId = () => nextLocalId++;

export interface Draft {
  record: SurveyRecord;
  name: string;
  scientificName: string;
  date: CalendarDate | null;
  lat: string;
  lon: string;
  observers: { id: number; name: string }[];
  measurements: { id: number; type: string; value: string; unit: string; method: string }[];
  properties: { id: number; name: string; value: string }[];
  /** A trap's trap types, in order; each line is an Effort or Specs line. */
  trapEffort: TrapEntryDraft[];
  attachments: SurveyArtefact[];
  /** Where the record is, as chosen in the location picker. */
  location: GeoExtentValue;
}

export interface TrapEntryDraft extends TrapEntry {
  id: number;
}

export function toDraft(record: SurveyRecord, attachments: SurveyArtefact[]): Draft {
  const observerRow = record.sections.find((s) => s.id === "observers")?.rows?.[0];
  const customRows = (record.sections.find((s) => s.id === "custom")?.rows ?? []).filter((r) => r.label !== "Custom properties");
  return {
    record: { ...record, sections: record.sections.map((s) => ({ ...s, rows: s.rows?.map((r) => ({ ...r })) })) },
    name: record.name,
    scientificName: record.scientificName ?? "",
    date: record.date ? parseDate(record.date) : null,
    lat: String(record.lat),
    lon: String(record.lon),
    observers: (observerRow?.value ?? "")
      .split("|")
      .map((n) => n.trim())
      .filter((n) => n && !EMPTY.has(n))
      .map((name) => ({ id: localId(), name })),
    measurements: (record.sections.find((s) => s.measurements)?.measurements ?? []).map((m) => ({ id: localId(), ...m })),
    properties: customRows.map((r) => ({ id: localId(), name: r.label, value: r.value })),
    trapEffort: (record.sections.find((s) => s.id === "trapEffort")?.trapEffort ?? []).map((e) => ({ id: localId(), trapType: e.trapType, values: { ...e.values }, durations: (e.durations ?? []).filter((d, i, all) => all.findIndex((x) => x.unit === d.unit) === i).map((d) => ({ ...d, rid: localId() })), specs: (e.specs ?? []).map((x) => ({ ...x, rid: localId() })) })),
    attachments,
    location: record.location ?? { method: "coordinates", boundary: { id: `pt-${record.id}`, kind: "circle", center: [record.lat, record.lon], radiusKm: 0.1 } },
  };
}

/** Rows edited as ordinary fields (not the name, dates, observers or custom list, which have their own controls). */
export function isPlainRow(record: SurveyRecord, section: MetaSection, row: MetaRow): boolean {
  if (section.id === "observers" || section.id === "custom") return false;
  const nr = nameRow(record);
  if (nr && nr.section === section.id && nr.label === row.label) return false;
  if (row.term && DATE_TERMS.has(row.term)) return false;
  if (row.label === "Established" || (record.kind === "occurrence" && row.label === "Scientific name")) return false;
  // The Measurements placeholder row stands for the section's measurement list, which has its own control.
  if (row.type === "measurements") return false;
  return true;
}

export function fromDraft(d: Draft): SurveyRecord {
  const iso = d.date ? d.date.toString() : d.record.date;
  const nr = nameRow(d.record);
  const observers = d.observers.map((o) => o.name.trim()).filter(Boolean);
  const sections = d.record.sections.map((s): MetaSection => {
    const measurements = s.measurements ? d.measurements.filter((m) => m.type.trim()).map(({ type, value, unit, method }) => ({ type, value, unit, method })) : undefined;
    if (s.measurements && !s.rows) return { ...s, measurements };
    if (s.id === "trapEffort")
      return {
        ...s,
        trapEffort: d.trapEffort.map(({ trapType, values, durations, specs }) => ({ trapType, values, durations: durations.map(({ value, unit }) => ({ value, unit })), specs: specs.map(({ field, value }) => ({ field, value })) })),
      };
    if (s.id === "observers") return { ...s, rows: [{ label: "Recorded by", term: "recordedBy", value: observers.join(" | ") || "Not provided" }] };
    if (s.id === "custom") return { ...s, rows: d.properties.filter((p) => p.name.trim()).map((p) => ({ label: p.name.trim(), value: p.value })) };
    return {
      ...s,
      ...(measurements ? { measurements } : {}),
      rows: s.rows?.map((r) => {
        if (nr && nr.section === s.id && nr.label === r.label) return { ...r, value: d.name };
        if ((r.term && DATE_TERMS.has(r.term)) || r.label === "Established") return { ...r, value: formatDate(iso) };
        if (d.record.kind === "occurrence" && r.label === "Scientific name") return { ...r, value: d.scientificName };
        return r;
      }),
    };
  });
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  const finalLat = Number.isFinite(lat) ? lat : d.record.lat;
  const finalLon = Number.isFinite(lon) ? lon : d.record.lon;
  // The picked shape stays as long as it still matches the coordinates (the drawer edits latitude and
  // longitude directly; then the location becomes a point there).
  const centre = d.location.boundary ? boundaryCentre(d.location.boundary) : null;
  const location: GeoExtentValue =
    centre && Math.abs(centre[0] - finalLat) < 1e-6 && Math.abs(centre[1] - finalLon) < 1e-6
      ? d.location
      : { method: "coordinates", boundary: { id: `pt-${d.record.id}`, kind: "circle", center: [finalLat, finalLon], radiusKm: 0.1 } };
  // IBRA region and subregion are worked out from the location, never typed.
  const ibra = ibraFor(finalLat, finalLon);
  const withIbra = sections.map((s) => ({
    ...s,
    rows: s.rows?.map((r) => (r.label === "IBRA region" ? { ...r, value: ibra.region } : r.label === "IBRA subregion" ? { ...r, value: ibra.subregion } : r)),
  }));
  return {
    ...d.record,
    location,
    name: d.name.trim(),
    scientificName: d.record.kind === "occurrence" ? speciesOf(withIbra) ?? d.scientificName.trim() : d.record.scientificName,
    date: iso,
    lat: finalLat,
    lon: finalLon,
    sections: withIbra,
  };
}

/** An occurrence's scientific name, from its "NSX code & species" row. */
function speciesOf(sections: MetaSection[]): string | undefined {
  const row = sections.flatMap((s) => s.rows ?? []).find((r) => r.type === "species");
  return row ? nsxSpecies(row.value)?.scientific : undefined;
}

export function missingFor(d: Draft): string[] {
  const out: string[] = [];
  if (!d.name.trim()) out.push(d.record.kind === "occurrence" ? "Occurrence name" : d.record.kind === "observation" ? "Observation name" : "Name");
  if (d.record.kind === "occurrence" && !(speciesOf(d.record.sections) ?? d.scientificName.trim())) out.push("Species");
  if (!d.date) out.push("Date");
  if (!d.record.locationNote && (!Number.isFinite(Number(d.lat)) || !Number.isFinite(Number(d.lon)) || d.lat.trim() === "" || d.lon.trim() === "")) out.push("Latitude and longitude");
  if (d.measurements.some((m) => (m.type.trim() || m.value.trim()) && !(m.type.trim() && m.value.trim()))) out.push("A name and value for each measurement");
  if (d.properties.some((p) => p.value.trim() && !p.name.trim())) out.push("A name for each custom property");
  if (d.trapEffort.some((e) => trapMissing(e).length > 0)) out.push("A value for every trap effort field and spec");
  return out;
}

export function artefactTypeFor(fileName: string): ArtefactType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "tif", "tiff"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["mp4", "mov", "mp3", "wav", "m4a"].includes(ext)) return "video";
  return null;
}
export const sizeLabel = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

/** A picked file as an attachment of `record` (no real upload in this preview), or null for an unsupported type. */
export function attachmentFromFile(file: File, record: SurveyRecord): SurveyArtefact | null {
  const type = artefactTypeFor(file.name);
  if (!type) return null;
  return {
    id: `upload-${Date.now()}`,
    recordId: record.id,
    title: file.name,
    type,
    size: sizeLabel(file.size),
    recordLabel: `${record.type} ${record.code}`,
    metaTitle: file.name,
    created: formatDate(new Date().toISOString().slice(0, 10)),
    creator: "You",
    objectId: `AHL:${record.code}:${file.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`,
    description: "Uploaded in this session.",
    format: file.type || "application/octet-stream",
    identifierUrl: "https://data.environment.sa.gov.au",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    publisher: "Adelaide Hills Landcare",
    rightsHolder: "Adelaide Hills Landcare",
    dcType: type === "image" ? "StillImage" : type === "video" ? "MovingImage" : type === "spreadsheet" ? "Dataset" : "Text",
    bioDataId: "Assigned on save",
  };
}

export function RecordDrawer({
  record,
  mode,
  focusSection,
  onClose,
  onSaved,
}: {
  record: SurveyRecord;
  mode: "edit" | "create";
  /** The section whose card's Edit was pressed: the form opens scrolled to it. */
  focusSection?: string;
  onClose: () => void;
  onSaved: (record: SurveyRecord) => void;
}) {
  const store = useEditStore();
  const [draft, setDraft] = useState<Draft>(() => toDraft(record, mode === "edit" ? store.artefactsFor(record.id) : []));
  const [dirty, setDirty] = useState(mode === "create");
  const [attempted, setAttempted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const missing = missingFor(draft);
  useEffect(() => {
    if (!focusSection) return;
    const t = setTimeout(() => document.getElementById(`edit-section-${focusSection}`)?.scrollIntoView({ block: "start" }), 50);
    return () => clearTimeout(t);
  }, [focusSection]);
  const kindLabel = record.kind === "event" ? record.type : `${record.type} ${record.kind}`;
  const showErr = attempted;

  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  };
  const setRow = (sectionId: string, label: string, value: string) =>
    patch({ record: { ...draft.record, sections: draft.record.sections.map((s) => (s.id === sectionId ? { ...s, rows: s.rows?.map((r) => (r.label === label ? { ...r, value } : r)) } : s)) } });

  const save = () => {
    if (missing.length > 0) {
      setAttempted(true);
      return;
    }
    const next = fromDraft(draft);
    if (mode === "create") store.addRecord(next);
    else store.saveRecord(next);
    store.setArtefactsFor(next.id, draft.attachments.map((a) => ({ ...a, recordId: next.id, recordLabel: `${next.type} ${next.code}` })));
    toast.success(mode === "create" ? `${kindLabel} added` : `${next.name} saved`, { description: "Changes are kept for this session only. This preview has no backend." });
    onSaved(next);
  };

  const addFile = (file: File) => {
    const attachment = attachmentFromFile(file, record);
    if (!attachment) {
      setFileError("Use an image, PDF, spreadsheet, audio or video file.");
      return;
    }
    setFileError(null);
    patch({ attachments: [...draft.attachments, attachment] });
  };

  const eventDateLabel = record.kind === "event" && record.type === "Site" ? "Established" : "Date";

  return (
    <EditDrawer isOpen title={mode === "create" ? `Add ${kindLabel}` : `Edit ${record.name}`} context={`${kindLabel} ${record.code}`} isDirty={dirty} onClose={onClose}>
      {(requestClose) => (
        <FormPage
          eyebrow={mode === "create" ? `Add · ${record.kind}` : `Edit · ${record.kind}`}
          title={mode === "create" ? `New ${kindLabel.toLowerCase()}` : record.name}
          subtitle={mode === "create" ? "Only the name and date are needed now. Everything else can be added later." : `${kindLabel} ${record.code}`}
          onCancel={requestClose}
          problems={showErr && missing.length > 0 ? { items: missing } : undefined}
          primaryLabel={mode === "create" ? `Add ${kindLabel.toLowerCase()}` : "Save changes"}
          onPrimary={save}
        >
          <div className="flex flex-col">
            <FormRow title={record.kind === "occurrence" ? "Species" : "Name"} required description={record.kind === "occurrence" ? "The species as recorded." : "What people will call this record."}>
              <Input
                label={record.kind === "occurrence" ? "Occurrence name" : "Name"}
                isRequired
                value={draft.name}
                onChange={(name) => patch({ name })}
                isInvalid={showErr && !draft.name.trim()}
                hint={showErr && !draft.name.trim() ? "This field is required" : undefined}
              />
              {record.kind === "occurrence" && (
                <Input
                  label="Scientific name"
                  isRequired
                  placeholder="E.g., Isoodon obesulus"
                  value={draft.scientificName}
                  onChange={(scientificName) => patch({ scientificName })}
                  isInvalid={showErr && !draft.scientificName.trim()}
                  hint={showErr && !draft.scientificName.trim() ? "This field is required" : "dwc:scientificName"}
                />
              )}
            </FormRow>

            <FormRow title={eventDateLabel} required description="dwc:eventDate">
              <InputDatePicker aria-label={eventDateLabel} value={draft.date} onChange={(date) => patch({ date: date as CalendarDate | null })} isInvalid={showErr && !draft.date} hint={showErr && !draft.date ? "Choose a date" : undefined} />
            </FormRow>

            {draft.record.sections.map((section) => {
              if (section.id === "observers") {
                return (
                  <div key={section.id} id={`edit-section-${section.id}`} className="scroll-mt-4">
                  <FormRow title={section.title} description={SECTION_HINT.observers}>
                    {draft.observers.map((o, i) => (
                      <div key={o.id} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input label={i === 0 ? "Name" : undefined} aria-label={`Observer ${i + 1}`} value={o.name} onChange={(v) => patch({ observers: draft.observers.map((x) => (x.id === o.id ? { ...x, name: v } : x)) })} />
                        </div>
                        <Button color="secondary" size="md" iconLeading={Trash01} aria-label={`Remove observer ${i + 1}`} onClick={() => patch({ observers: draft.observers.filter((x) => x.id !== o.id) })} />
                      </div>
                    ))}
                    <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patch({ observers: [...draft.observers, { id: localId(), name: "" }] })}>
                      Add observer
                    </Button>
                  </FormRow>
                  </div>
                );
              }
              if (section.measurements && !section.rows) {
                return (
                  <div key={section.id} id={`edit-section-${section.id}`} className="scroll-mt-4">
                  <FormRow title={section.title} description={SECTION_HINT.measurements}>
                    {draft.measurements.length === 0 && <p className="text-sm text-tertiary">No measurements yet.</p>}
                    {draft.measurements.map((m, i) => {
                      const set = (p: Partial<typeof m>) => patch({ measurements: draft.measurements.map((x) => (x.id === m.id ? { ...x, ...p } : x)) });
                      const incomplete = showErr && (m.type.trim() || m.value.trim()) && !(m.type.trim() && m.value.trim());
                      return (
                        <div key={m.id} className="flex flex-col gap-3 rounded-lg border border-secondary p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary">Measurement {i + 1}</p>
                            <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove measurement ${i + 1}`} onClick={() => patch({ measurements: draft.measurements.filter((x) => x.id !== m.id) })} />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input label="Measurement" hint="dwc:measurementType" value={m.type} onChange={(v) => set({ type: v })} isInvalid={!!incomplete && !m.type.trim()} />
                            <Input label="Value" hint="dwc:measurementValue" value={m.value} onChange={(v) => set({ value: v })} isInvalid={!!incomplete && !m.value.trim()} />
                            <Input label="Unit" hint="dwc:measurementUnit" value={m.unit} onChange={(v) => set({ unit: v })} />
                            <Input label="Method" hint="dwc:measurementMethod" value={m.method} onChange={(v) => set({ method: v })} />
                          </div>
                        </div>
                      );
                    })}
                    <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patch({ measurements: [...draft.measurements, { id: localId(), type: "", value: "", unit: "", method: "" }] })}>
                      Add measurement
                    </Button>
                  </FormRow>
                  </div>
                );
              }
              if (section.id === "custom") {
                return (
                  <div key={section.id} id={`edit-section-${section.id}`} className="scroll-mt-4">
                  <FormRow title={section.title} description={SECTION_HINT.custom}>
                    {draft.properties.length === 0 && <p className="text-sm text-tertiary">No custom properties.</p>}
                    {draft.properties.map((p, i) => (
                      <div key={p.id} className="flex items-end gap-2">
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <Input label={i === 0 ? "Property" : undefined} aria-label={`Property ${i + 1} name`} value={p.name} onChange={(v) => patch({ properties: draft.properties.map((x) => (x.id === p.id ? { ...x, name: v } : x)) })} />
                          <Input label={i === 0 ? "Value" : undefined} aria-label={`Property ${i + 1} value`} value={p.value} onChange={(v) => patch({ properties: draft.properties.map((x) => (x.id === p.id ? { ...x, value: v } : x)) })} />
                        </div>
                        <Button color="secondary" size="md" iconLeading={Trash01} aria-label={`Remove property ${i + 1}`} onClick={() => patch({ properties: draft.properties.filter((x) => x.id !== p.id) })} />
                      </div>
                    ))}
                    <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => patch({ properties: [...draft.properties, { id: localId(), name: "", value: "" }] })}>
                      Add property
                    </Button>
                  </FormRow>
                  </div>
                );
              }
              const rows = (section.rows ?? []).filter((r) => isPlainRow(draft.record, section, r));
              if (rows.length === 0 && !section.withMap) return null;
              return (
                <div key={section.id} id={`edit-section-${section.id}`} className="scroll-mt-4">
                <FormRow title={section.title} description={SECTION_HINT[section.id]}>
                  {section.withMap &&
                    (draft.record.locationNote ? (
                      <p className="flex items-center gap-1.5 text-sm text-tertiary">
                        <Lock01 className="size-3.5 shrink-0" /> Coordinates are generalised for this restricted species and can&apos;t be edited here.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input label="Latitude" isRequired hint="dwc:decimalLatitude" value={draft.lat} onChange={(lat) => patch({ lat })} />
                        <Input label="Longitude" isRequired hint="dwc:decimalLongitude" value={draft.lon} onChange={(lon) => patch({ lon })} />
                      </div>
                    ))}
                  {rows.map((row) => {
                    const hint = row.term ? `dwc:${row.term}` : undefined;
                    const value = EMPTY.has(row.value) ? "" : row.value;
                    if (LOCKED.test(row.label))
                      return (
                        <div key={row.label} className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-secondary">{row.label}</p>
                          <p className="flex items-center gap-1.5 text-sm text-tertiary" title="Set by the system">
                            <Lock01 className="size-3.5 shrink-0" />
                            {row.value}
                          </p>
                        </div>
                      );
                    const options = SELECTS[row.label];
                    if (options)
                      return (
                        <Select key={row.label} label={row.label} hint={hint} items={options.map((o) => ({ id: o, label: o }))} selectedKey={options.includes(row.value) ? row.value : null} onSelectionChange={(k) => setRow(section.id, row.label, k ? String(k) : "Not provided")}>
                          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                        </Select>
                      );
                    if (LONG.test(row.label)) return <TextArea key={row.label} label={row.label} hint={hint} rows={3} value={value} onChange={(v) => setRow(section.id, row.label, v || "Not provided")} />;
                    return <Input key={row.label} label={row.label} hint={hint} value={value} onChange={(v) => setRow(section.id, row.label, v || "Not provided")} />;
                  })}
                </FormRow>
                </div>
              );
            })}

            <FormRow title="Attachments" description="Photos, recordings and files that belong to this record.">
              {draft.attachments.length === 0 && <p className="text-sm text-tertiary">No attachments.</p>}
              {draft.attachments.map((a) => {
                const Icon = artefactTypeMeta[a.type].icon;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-secondary px-3 py-2">
                    <Icon className="size-4 shrink-0 text-fg-quaternary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-primary">{a.title}</span>
                    <span className="shrink-0 text-xs text-quaternary">{a.size}</span>
                    <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${a.title}`} onClick={() => patch({ attachments: draft.attachments.filter((x) => x.id !== a.id) })} />
                  </div>
                );
              })}
              <input
                ref={fileInput}
                type="file"
                className="sr-only"
                accept="image/*,.pdf,.xls,.xlsx,.csv,audio/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addFile(f);
                  e.target.value = "";
                }}
              />
              <Button color="secondary" size="sm" iconLeading={Upload01} className="w-max" onClick={() => fileInput.current?.click()}>
                Add attachment
              </Button>
              {fileError && <p className="text-sm text-error-primary">{fileError}</p>}
            </FormRow>
          </div>
        </FormPage>
      )}
    </EditDrawer>
  );
}
