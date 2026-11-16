import { emptyDsaDraft, emptyDsaSystem, todayIso, type DsaDraft, type DsaSystem } from "@/app/pages/_shared/dsa/dsa-data";

// The DSA form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch of the form (the designer, 10 Nov 2026): data shared offline and through systems, so the Systems section is asked, with
// two systems that each have a scope, both permissions, their organisation and its contact. The signed agreement is a sample file (sample-files.ts) added
// through the form's own file path, not part of this snapshot.
// Honest (CONTRACTS 0.3): the organisations are real BDBSA partners (ref-domain.md), the people are placeholders with example.com addresses, the
// redirect addresses are on example.org (reserved for examples), and the contact numbers are ones the Australian Communications and Media Authority
// reserves for fiction. The system tokens are the form's own made-up ones (`mockToken`), never a credential.

export interface DsaSample {
  draft: DsaDraft;
  /** Which systems start open in the Systems accordion. */
  openSystems: string[];
}

/** The same day two years on, one day short of it, as an ISO date. */
function twoYearsOn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y + 2, m - 1, d - 1)).toISOString().slice(0, 10);
}

const system = (partner: string, fill: Partial<DsaSystem>): DsaSystem => ({ ...emptyDsaSystem(partner), ...fill });

export function sampleDsa(): DsaSample {
  const partner = "South Australian Museum";
  const from = todayIso();
  const systems = [
    system(partner, {
      name: "Collections Database Sync",
      redirectUrl: "https://collections.example.org/oauth/callback",
      scopes: ["species", "location", "project"],
      canRead: true,
      canWrite: true,
      org: { name: partner, firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", phone: "0491 570 006" },
    }),
    system(partner, {
      name: "Wetland Counts Portal",
      redirectUrl: "https://counts.example.org/oauth/callback",
      scopes: ["species", "project"],
      canRead: true,
      canWrite: false,
      org: { name: "BirdLife Australia", firstName: "Maya", lastName: "Dewitt", email: "maya.dewitt@example.com", phone: "0491 570 156" },
    }),
  ];
  return {
    draft: {
      ...emptyDsaDraft(),
      partner,
      purpose: "Sharing threatened species and survey records with the museum's collections database, so specimen data and field observations can be cross-checked in one place.",
      validFrom: from,
      validTo: twoYearsOn(from),
      // The signed agreement comes in through the file option, as if the person had chosen it.
      agreementFile: null,
      requestedBy: { firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", phone: "0491 570 006" },
      custodian: { firstName: "Lana", lastName: "Steiner", email: "lana.steiner@example.com", phone: "0491 570 157" },
      sharedOffline: true,
      sharedViaSystem: true,
      systems,
    },
    openSystems: systems.map((s) => s.id),
  };
}
