// The nested-records tree of the one example project, shared by project-detail and observation-detail
// so the two sidebars can't drift apart (they each used to keep a verbatim local copy).
//
// Spine, per CONTEXT.md's confirmed data model: Project > Site > Visit > Occurrence > Observation.
// Site and Visit are both real, distinct levels, and an Occurrence parents exactly one thing, its own
// Observation (an Observation is always a leaf). An Occurrence's type and its Observation's type
// follow the same read (Individual, Population, Non-biotic, Community). Transect, Quadrat and Ramble
// are Events nested under the Visit they were surveyed on (place > field trip > survey method), the
// same nesting the record tree has always used for them.

export type RecordType = "Projects" | "Sites" | "Visits" | "Occurrences" | "Observations" | "Transects" | "Quadrats" | "Rambles";

export interface RecordNode {
  id: string;
  type: RecordType;
  label: string;
  children?: RecordNode[];
}

// "Observation OBS094 · Individual" (id "obs-094") is the one node with a real page behind it -
// app/pages/observation-detail. Every other node is honest content with nowhere real to go yet.
export const projectRecordTree: RecordNode[] = [
  {
    id: "project",
    type: "Projects",
    label: "Adelaide Hills Bushland Survey",
    children: [
      {
        id: "site",
        type: "Sites",
        label: "Site SU00501",
        children: [
          {
            id: "visit",
            type: "Visits",
            label: "Visit VU00501",
            children: [
              {
                id: "occ-individual",
                type: "Occurrences",
                label: "Occurrence OCC00501 · Individual",
                children: [{ id: "obs-094", type: "Observations", label: "Observation OBS094 · Individual" }],
              },
              {
                id: "occ-population",
                type: "Occurrences",
                label: "Occurrence OCC00502 · Population",
                children: [{ id: "obs-population", type: "Observations", label: "Observation OBS096 · Population" }],
              },
              {
                id: "occ-nonbiotic",
                type: "Occurrences",
                label: "Occurrence OCC00503 · Non-biotic",
                children: [{ id: "obs-nonbiotic", type: "Observations", label: "Observation OBS097 · Non-biotic" }],
              },
              {
                id: "occ-community",
                type: "Occurrences",
                label: "Occurrence OCC00504 · Community",
                children: [{ id: "obs-community", type: "Observations", label: "Observation OBS098 · Community" }],
              },
              { id: "transect", type: "Transects", label: "Transect TR00501" },
              { id: "quadrat", type: "Quadrats", label: "Quadrat QR00501" },
              { id: "ramble", type: "Rambles", label: "Ramble RMB00501" },
            ],
          },
          {
            id: "visit-2",
            type: "Visits",
            label: "Visit VU00502",
            children: [
              {
                id: "occ-095",
                type: "Occurrences",
                label: "Occurrence OCC00505 · Individual",
                children: [{ id: "visit-obs", type: "Observations", label: "Observation OBS095 · Individual" }],
              },
            ],
          },
        ],
      },
      {
        id: "site-777",
        type: "Sites",
        label: "Site SU00777",
        children: [
          {
            id: "visit-777",
            type: "Visits",
            label: "Visit VU00777",
            children: [
              {
                id: "inc-occ-1",
                type: "Occurrences",
                label: "Occurrence OCC00777 · Individual",
                children: [{ id: "inc-obs-1", type: "Observations", label: "Observation INC-0231 · Individual" }],
              },
              {
                id: "inc-occ-2",
                type: "Occurrences",
                label: "Occurrence OCC00778 · Community",
                children: [{ id: "inc-obs-2", type: "Observations", label: "Observation INC-0232 · Community" }],
              },
            ],
          },
        ],
      },
    ],
  },
];
