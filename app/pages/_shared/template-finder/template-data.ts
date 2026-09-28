// The standard dataset templates: one list, read by the Template Finder and by the upload form's
// recommended templates. Names, descriptions and the two facts are the wireframe's own copy (Figma
// YMproGZfrFB5jUqPHPxMhk node 38:59905). There are no template files in the preview, so every
// download is shown but disabled (`TemplateDownloads`).

export interface DatasetTemplate {
  id: string;
  title: string;
  description: string;
  collectionMethod: string;
  speciesType: string;
}

export const datasetTemplates: DatasetTemplate[] = [
  {
    id: "site-visit-species-load",
    title: "Site Visit Species Load Template",
    description: "A legacy ecological data framework retained for historical reference and comparison with newer assessment methods.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "site-visit-species-load-custom",
    title: "Site Visit Species Load Template (Custom)",
    description: "A legacy ecological data framework retained for historical reference and comparison with newer assessment methods.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "species-data-return",
    title: "Species Data Return Template",
    description: "An older standardized format for submitting biodiversity and survey data, maintained for compatibility with historical records.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "waterbug-bioblitz",
    title: "Waterbug Bioblitz - Macroinvertebrates Template",
    description: "A simple template for recording macroinvertebrate species during BioBlitz events, focusing on quick species identification.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "bushland-assessment-method",
    title: "Bushland Assessment Method (BAM) Template",
    description: "A structured approach to assess bushland condition, including vegetation, habitat quality, and disturbance factors for conservation planning.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "rangeland-assessment-method",
    title: "Rangeland Assessment Method (RAM) Template",
    description: "A field-based method to assess rangeland condition, focusing on vegetation, soil health, and ecosystem function to support sustainable land management and monitoring.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "ramble",
    title: "Ramble Template",
    description: "A flexible, informal method for recording opportunistic ecological observations without strict survey protocols.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "bushland-condition-monitoring",
    title: "Bushland Condition Monitoring (BCM) Template",
    description:
      "A standardized field datasheet for recording bushland condition, including vegetation, species diversity, weeds, and disturbance. It enables consistent monitoring of ecological health and supports conservation and land management decisions.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
];
