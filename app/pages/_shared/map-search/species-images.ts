import { assetPath } from "@/lib/base-path";

// Reference photos so a species can be recognised by sight. Every photo is a real image from the
// Atlas of Living Australia (ALA), matched by scientific name and chosen as ALA's representative
// image for that species; none is invented or substituted. Only images with a recognised licence
// that allows display with credit are kept: CC BY and CC BY-NC. Excluded on purpose: images with no
// licence recorded, and CC BY-ND (a cropped thumbnail would be a derivative). The files are copies
// in public/pages/species/ (about 50 KB each) so the prototype does not depend on ALA being up.
//
// A species with no entry here (no ALA image, or none with a usable licence) falls back to its
// group icon in SpeciesPhoto. Credit is shown wherever a photo is shown, as the licences require.
//
// Not covered by the licence check: CC BY-NC covers non-commercial use. Whether a government
// service counts as non-commercial is a licensing call for DEW, not one made here.

interface SpeciesImageEntry {
  file: string;
  creator: string;
  licence: "CC BY" | "CC BY-NC";
  imageId: string;
}

// A species may list more than one image (an array); the first is its representative image, used
// for list thumbnails. The summary card shows a carousel when there are two or more. Every extra
// image must meet the same rule as the first: a real ALA image, licence recorded and allowed.
const IMAGES: Record<string, SpeciesImageEntry | SpeciesImageEntry[]> = {
    "Tachyglossus aculeatus": { file: "tachyglossus-aculeatus.jpg", creator: "andrewk", licence: "CC BY-NC", imageId: "d903474f-acb7-4f3d-9b40-fc9202d9e08f" },
    "Sternula nereis": { file: "sternula-nereis.jpg", creator: "Thomas Wilson", licence: "CC BY", imageId: "53303805-d48d-4186-99fa-cd637e8c832b" },
    "Pandion haliaetus": { file: "pandion-haliaetus.jpg", creator: "Naomi", licence: "CC BY-NC", imageId: "12d67fae-e7c2-4dab-a216-21fe9b4b81ee" },
    "Tiliqua adelaidensis": { file: "tiliqua-adelaidensis.jpg", creator: "courtney_p", licence: "CC BY-NC", imageId: "602b5591-adab-41d3-86b8-1c00d4b83e49" },
    "Petrogale xanthopus": { file: "petrogale-xanthopus.jpg", creator: "Jason van Weenen", licence: "CC BY-NC", imageId: "54c5ea66-4eea-4513-949a-bbe23c8cc87d" },
    "Lasiorhinus latifrons": { file: "lasiorhinus-latifrons.jpg", creator: "c michael hogan", licence: "CC BY-NC", imageId: "cddc295f-1f61-411f-a9a8-728f6cda31ce" },
    "Leipoa ocellata": { file: "leipoa-ocellata.jpg", creator: "Donald Hobern", licence: "CC BY", imageId: "e9f21b8e-c360-42cb-ba6d-39797b520b59" },
    "Polytelis anthopeplus": { file: "polytelis-anthopeplus.jpg", creator: "harrylurling", licence: "CC BY-NC", imageId: "e210a6de-2f47-4380-bfd7-92205e8cb4cd" },
    "Pseudomys shortridgei": { file: "pseudomys-shortridgei.jpg", creator: "Kazi, Sakib", licence: "CC BY", imageId: "6a0125e6-903c-4251-913b-67ec057d54b2" },
    "Eucalyptus leucoxylon": { file: "eucalyptus-leucoxylon.jpg", creator: "krumpianking", licence: "CC BY", imageId: "e182f6db-76c2-47ff-91f6-ef5378cc3981" },
    "Xanthorrhoea semiplana": { file: "xanthorrhoea-semiplana.jpg", creator: "Liz", licence: "CC BY-NC", imageId: "8c7d98a0-1398-4d24-8879-c0ab78700c28" },
    "Santalum acuminatum": { file: "santalum-acuminatum.jpg", creator: "patrickwhite57", licence: "CC BY-NC", imageId: "f420121b-57a5-4ac2-9cd9-0301f004606c" },
    "Grevillea lavandulacea": { file: "grevillea-lavandulacea.jpg", creator: "Kym Nicolson", licence: "CC BY", imageId: "49f0c609-669c-4f3e-b17f-bf5f58b62443" },
    // More than one image, so its summary card is a carousel (25 Oct 2026). The three after the first are the species' photos on ALA that are live animals, sharp, and CC BY-NC (iNaturalist Australia).
    "Isoodon obesulus": [
        { file: "isoodon-obesulus.jpg", creator: "Robert Browne-Cooper", licence: "CC BY", imageId: "3ddf0dea-7b84-48b6-9e23-50fd4b1e3b22" },
        { file: "isoodon-obesulus-2.jpg", creator: "Rueben", licence: "CC BY-NC", imageId: "8842635a-19b0-4ff4-9cc7-c4a1bec9c690" },
        { file: "isoodon-obesulus-3.jpg", creator: "Glenn Gale", licence: "CC BY-NC", imageId: "a05a5c99-7e5a-450d-b622-6ef896d68e89" },
        { file: "isoodon-obesulus-4.jpg", creator: "Bijoy Venugopal", licence: "CC BY-NC", imageId: "b3cb467c-ec65-430c-822b-69e1a886afff" },
    ],
};

export interface SpeciesImage {
  src: string;
  creator: string;
  licence: string;
  /** The image's own page on ALA, where its full licence and provenance sit. */
  sourceUrl: string;
}

function toImage(entry: SpeciesImageEntry): SpeciesImage {
  return {
    src: assetPath(`/pages/species/${entry.file}`),
    creator: entry.creator,
    licence: entry.licence,
    sourceUrl: `https://images.ala.org.au/image/${entry.imageId}`,
  };
}

/** Every usable image for a species, representative image first. Empty when there is none. */
export function speciesImages(scientificName: string): SpeciesImage[] {
  const entry = IMAGES[scientificName];
  if (!entry) return [];
  return (Array.isArray(entry) ? entry : [entry]).map(toImage);
}

/** The representative image, or undefined when the species has none. */
export function speciesImage(scientificName: string): SpeciesImage | undefined {
  return speciesImages(scientificName)[0];
}
