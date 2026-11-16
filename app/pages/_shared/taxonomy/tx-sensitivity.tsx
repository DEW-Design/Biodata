"use client";

import type { ReactNode } from "react";
import { Plus } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Button } from "@/components/base/buttons/button";
import { EmbeddedTable } from "@/app/pages/_shared/embedded-table";
import { NOMINATION_ROOT, existingRestrictions, protectionMeta, type Nomination } from "@/app/pages/_shared/nominations/nomination-data";
import { RiskBadge } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { ExistingRestrictionsTable } from "@/app/pages/_shared/nominations/nomination-restrictions";
import { OPEN, accessLevelMeta, currentSpeciesRating, releaseRiskMeta, ruleLabel, type Rating, type SpeciesRating } from "@/app/pages/_shared/nominations/nomination-rating";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { Card } from "@/app/pages/_shared/taxonomy/tx-records";
import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { useRoleHref } from "@/lib/use-role-href";

// The Sensitive species risk tab on a species (the designer, 10 Nov 2026: "a new tab ... right after overview", "to manage sensitive species
// risk and distribution levels"), then, answering the question of what "manage" means: "they're read only on the taxonomy management species
// screen - information is inherited from the species nomination screens. If they want to edit, they'll have to go back to the species
// nomination screen to edit." So nothing here is edited and nothing is stored: a species' rating is made from its accepted nominations
// (`currentSpeciesRating`, the same one the nomination form's What to protect step and the list read, merged in the order they were accepted),
// and the tab says where it comes from, with each nomination one press away. The two scales are the nominations' own: the data release risk
// and the user access level (Level 1 Public to Level 4 Admin only), "distribution levels" being the second.
// A nomination is for a species by its scientific name (`speciesId`), so the tab is on a species record; a higher taxon has none, and an
// infraspecies is not matched to its species here (open).

/** A species page's extra tab. It is not one of the Figma field tabs (tx-data.ts), so it has a kind of its own. */
export const SENSITIVITY_TAB = { id: "sensitivity", label: "Sensitive species risk", kind: "sensitivity" } as const;

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-sm font-medium text-secondary">{label}</dt>
      <dd className="m-0 flex flex-col items-start gap-1 text-sm text-primary">{children}</dd>
    </div>
  );
}

/** One rating's two halves as read: the risk with what it does to the data, the level with who sees it as held. */
function RatingFacts({ rating }: { rating: Rating }) {
  return (
    <>
      <Fact label="Data release risk">
        <RiskBadge risk={rating.risk} />
        <span className="text-tertiary">{releaseRiskMeta[rating.risk].treatment}</span>
      </Fact>
      <Fact label="User access level">
        <span>{accessLevelMeta[rating.access].label}</span>
        <span className="text-tertiary">Seen as held by {accessLevelMeta[rating.access].who}</span>
      </Fact>
    </>
  );
}

function CurrentRating({ rating }: { rating: SpeciesRating }) {
  if (rating.appliesTo === "species")
    return (
      <dl className="m-0 grid gap-x-6 gap-y-5 sm:grid-cols-3">
        <Fact label="Applies to">{protectionMeta.all.label}</Fact>
        <RatingFacts rating={rating} />
      </dl>
    );
  return (
    <div className="flex flex-col gap-4">
      <dl className="m-0">
        <Fact label="Applies to">{protectionMeta.selected.label}</Fact>
      </dl>
      <EmbeddedTable
        ariaLabel="Ratings by attribute"
        minWidth="min-w-[560px]"
        columns={[
          { id: "attribute", label: "Attribute", className: "w-[40%]", isRowHeader: true },
          { id: "risk", label: "Data release risk", className: "w-[30%]" },
          { id: "access", label: "User access level", className: "w-[30%]" },
        ]}
        rows={rating.attributes.map((a) => ({ id: String(a.id), label: ruleLabel(a), risk: a.risk, access: a.access }))}
        cell={(a, column) => {
          if (column === "attribute") return <span className="text-sm font-medium text-primary">{a.label}</span>;
          if (column === "risk") return <RiskBadge risk={a.risk} />;
          return <span className="text-sm text-primary">{accessLevelMeta[a.access].label}</span>;
        }}
      />
      <p className="m-0 text-sm text-tertiary">
        Every other attribute: {releaseRiskMeta[OPEN.risk].label}, {accessLevelMeta[OPEN.access].label}
      </p>
    </div>
  );
}

export function SensitivityTab({ taxon }: { taxon: Taxon }) {
  const roleHref = useRoleHref();
  const nominations = useNominations();
  // A nomination names its species by scientific name. The ones listed are those in force (accepted, and not removed by a later one) and
  // those still open with the nominator or the panel, as the nomination form's species step lists them.
  const listed = existingRestrictions(nominations, taxon.scientific);
  const inForce = listed.some((n) => n.status === "accepted");
  const rating = currentSpeciesRating(nominations, taxon.scientific);
  const hrefFor = (n: Nomination) => roleHref(`${NOMINATION_ROOT}/${n.id}`);

  return (
    <div className="flex flex-col gap-4">
      {inForce && (
        <AlertFullWidth
          contained
          wrap
          color="gray"
          title="Read only"
          description="This rating comes from the species' accepted nominations. To change it, open a nomination and edit it there."
          confirmLabel=""
        />
      )}
      <Card title="Current rating">
        {inForce ? (
          <CurrentRating rating={rating} />
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="m-0 text-sm text-primary">Not rated</p>
            <p className="m-0 max-w-[60ch] text-sm text-balance text-tertiary">
              {listed.length
                ? "A nomination is with the panel. The rating is set when one is accepted. Until then its records are released as held."
                : "No accepted nomination sets a rating for this species, so its records are released as held."}{" "}
              {releaseRiskMeta[OPEN.risk].label} risk, {accessLevelMeta[OPEN.access].label}.
            </p>
            {!listed.length && (
              <Button color="secondary" size="sm" iconLeading={Plus} href={roleHref(`${NOMINATION_ROOT}/new?species=${encodeURIComponent(taxon.scientific)}`)}>
                Nominate this species
              </Button>
            )}
          </div>
        )}
      </Card>
      {listed.length > 0 && (
        <Card title="Nominations">
          <ExistingRestrictionsTable restrictions={listed} hrefFor={hrefFor} />
        </Card>
      )}
    </div>
  );
}
