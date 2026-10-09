"use client";

import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { RecordRow } from "@/app/pages/_shared/record-hero";
import { AreaList, AreasEditor } from "@/app/pages/_shared/nominations/nomination-areas";
import { attributeLabel, attributeValueLabel, fromEditorRows, toEditorRows, type NominationArea } from "@/app/pages/_shared/nominations/nomination-data";
import { AccessSelect, RiskBadge, RiskSelect } from "@/app/pages/_shared/nominations/species-sensitivity-fields";
import { OPEN, SENSITIVITY_ATTRIBUTES, STANDARD_ACCESS, accessLevelMeta, ratingSummary, releaseRiskMeta, type Rating, type SpeciesRating } from "@/app/pages/_shared/nominations/species-sensitivity";
import { ConceptRows, isConceptRowsValid } from "@/app/pages/project-registration/concept-rows";
import type { ConceptValueRow } from "@/app/pages/project-registration/types";

// The data release editor, shared by a species' page and the bulk change page, and the read-only view of a rating.
// - Applies to: Whole species (one risk and level) or Specific attributes.
// - Specific attributes reuses the nomination form's attribute editor (`ConceptRows`, CONTRACTS 0.9): each attribute is a card
//   with the attribute, then its value in that attribute's own control (Location: the areas, through `AreasEditor`;
//   Activity: Nesting ...), then, labelled, the Data release risk and the User access level that apply to it. A rating can so
//   say "this species, in this place only".
// - Every risk shows its treatment (Obfuscated 1 km² ...). A level below the risk's standard one can't be chosen.

/** The editor's working copy: the attribute rows in `ConceptRows`' shape, with each row's areas and rating beside them. */
export interface EditorState {
  appliesTo: SpeciesRating["appliesTo"];
  risk: Rating["risk"];
  access: Rating["access"];
  rows: ConceptValueRow[];
  areas: Record<number, NominationArea[]>;
  ratings: Record<number, Rating>;
}

/** A new attribute row starts at Low, the first risk that does anything. */
const NEW_ROW_RATING: Rating = { risk: "low", access: STANDARD_ACCESS.low };

export function toEditor(r: SpeciesRating): EditorState {
  const { rows, areas } = toEditorRows(r.attributes);
  const ratings = Object.fromEntries(r.attributes.map((a) => [a.id, { risk: a.risk, access: a.access }]));
  return { appliesTo: r.appliesTo, risk: r.risk, access: r.access, rows, areas, ratings };
}

export function fromEditor(s: EditorState): SpeciesRating {
  if (s.appliesTo === "species") return { appliesTo: "species", risk: s.risk, access: s.access, attributes: [] };
  const attributes = fromEditorRows(s.rows, s.areas).map((a) => ({ ...a, ...(s.ratings[a.id] ?? NEW_ROW_RATING) }));
  return { appliesTo: "attributes", ...OPEN, attributes };
}

export function isEditorValid(s: EditorState): boolean {
  return s.appliesTo === "species" || isConceptRowsValid(s.rows, SENSITIVITY_ATTRIBUTES);
}

export function DataReleaseEditor({ state, onChange, showErrors }: { state: EditorState; onChange: (next: EditorState) => void; showErrors: boolean }) {
  const ratingOfRow = (id: number) => state.ratings[id] ?? NEW_ROW_RATING;
  const setRowRating = (id: number, rating: Rating) => onChange({ ...state, ratings: { ...state.ratings, [id]: rating } });

  return (
    <>
      <RecordRow label="Applies to">
        <RadioGroup
          aria-label="Applies to"
          value={state.appliesTo}
          onChange={(v) => {
            if (v === "attributes") return onChange({ ...state, appliesTo: "attributes" });
            // Moving to the whole species starts from the highest attribute rating, so the switch never drops protection.
            const rated = fromEditor({ ...state, appliesTo: "attributes" });
            onChange({ ...state, appliesTo: "species", ...(rated.attributes.some((a) => a.attribute) ? ratingSummary(rated) : {}) });
          }}
        >
          <RadioButton value="species" label="Whole species" hint="One rating for every record and attribute of the species." />
          <RadioButton value="attributes" label="Specific attributes" hint="Rate only the attributes and values you choose, such as its location in one park. The rest stay open." />
        </RadioGroup>
      </RecordRow>
      {state.appliesTo === "species" ? (
        <>
          <RecordRow label="Data release risk">
            <div className="max-w-sm">
              <RiskSelect value={state.risk} onChange={(risk) => onChange({ ...state, risk, access: STANDARD_ACCESS[risk] })} />
            </div>
          </RecordRow>
          <RecordRow label="User access level">
            <div className="max-w-sm">
              <AccessSelect risk={state.risk} value={state.access} onChange={(access) => onChange({ ...state, access })} />
            </div>
          </RecordRow>
        </>
      ) : (
        <RecordRow label="Attributes">
          <div className="flex flex-col gap-3">
            <ConceptRows
              noun="attribute"
              rows={state.rows}
              options={SENSITIVITY_ATTRIBUTES}
              showErrors={showErrors}
              onChange={(rows) => onChange({ ...state, rows })}
              renderBelow={(row, option) => {
                const rating = ratingOfRow(row.id);
                return (
                  <>
                    {option?.valueType === "areas" && (
                      <AreasEditor
                        areas={state.areas[row.id] ?? []}
                        invalid={showErrors && (state.areas[row.id] ?? []).length === 0}
                        // One update for the areas and the row's values together: a second, through ConceptRows, would undo the first.
                        onChange={(next) => onChange({ ...state, areas: { ...state.areas, [row.id]: next }, rows: state.rows.map((r) => (r.id === row.id ? { ...r, values: next.map((x) => x.id) } : r)) })}
                      />
                    )}
                    {row.concept && (
                      <div className="grid gap-4 border-t border-secondary pt-4 sm:grid-cols-2">
                        <RiskSelect label="Data release risk" value={rating.risk} onChange={(risk) => setRowRating(row.id, { risk, access: STANDARD_ACCESS[risk] })} />
                        <AccessSelect label="User access level" risk={rating.risk} value={rating.access} onChange={(access) => setRowRating(row.id, { ...rating, access })} />
                      </div>
                    )}
                  </>
                );
              }}
            />
            <p className="m-0 text-sm text-balance text-tertiary">Attributes not listed stay Negligible and Level 1 - Public.</p>
          </div>
        </RecordRow>
      )}
    </>
  );
}

/** One rating as read: the badge and level, then the treatment and who sees it as held. */
function RatingValue({ rating }: { rating: Rating }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex flex-wrap items-center gap-2">
        <RiskBadge risk={rating.risk} />
        <span>{accessLevelMeta[rating.access].label}</span>
      </span>
      <span className="text-tertiary">
        {releaseRiskMeta[rating.risk].treatment}. Seen as held by {accessLevelMeta[rating.access].who}.
      </span>
    </span>
  );
}

export function DataReleaseView({ rating }: { rating: SpeciesRating }) {
  if (rating.appliesTo === "species")
    return (
      <>
        <RecordRow label="Applies to">Whole species</RecordRow>
        <RecordRow label="Rating">
          <RatingValue rating={rating} />
        </RecordRow>
      </>
    );
  return (
    <>
      <RecordRow label="Applies to">Specific attributes</RecordRow>
      {rating.attributes.map((a) => (
        <RecordRow key={a.id} label={attributeLabel(a)}>
          <div className="flex flex-col gap-3">
            {a.attribute === "location" ? <AreaList areas={a.areas} /> : <span className="font-medium">{attributeValueLabel(a) || "Not provided"}</span>}
            <RatingValue rating={a} />
          </div>
        </RecordRow>
      ))}
      <RecordRow label="Every other attribute">
        <span className="text-tertiary">
          {releaseRiskMeta[OPEN.risk].label}, {accessLevelMeta[OPEN.access].label}
        </span>
      </RecordRow>
    </>
  );
}
