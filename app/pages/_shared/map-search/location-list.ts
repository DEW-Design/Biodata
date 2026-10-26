"use client";

// "Choose from a List" in every location picker (Add Project's geographic extent and location restrictions, the project page,
// nominations, DLA's Add a location): the active entries of the Named location vocabulary (BIODATA-118), which the admins keep,
// not a fixed list of national parks (the designer, 25 Oct 2026). Where an entry is one of the SA national parks the map
// already knows, it carries that park's centre so it can be drawn; one the admins add without a known place has no centre.

import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { SA_NATIONAL_PARKS } from "./geo";

export const NAMED_LOCATION_CV_ID = "BIODATA-118";

export interface ListedLocation {
    id: string;
    name: string;
    /** The place's centre, where it is known. */
    center?: [number, number];
}

export function useLocationList(): ListedLocation[] {
    const cvs = useCvs();
    const entries = (cvs.find((cv) => cv.id === NAMED_LOCATION_CV_ID)?.entries ?? []).filter((e) => e.status === "active" && e.name.trim());
    return entries.map((e) => {
        const park = SA_NATIONAL_PARKS.find((p) => p.name === e.name.trim());
        return { id: e.id, name: e.name.trim(), center: park ? [park.lat, park.lon] : undefined };
    });
}

/** The entry a saved choice points at. Choices saved before the vocabulary held a national park's id, so those are matched by
 *  the park's name. */
export function findListedLocation(list: ListedLocation[], key: string | null | undefined): ListedLocation | undefined {
    if (!key) return undefined;
    const park = SA_NATIONAL_PARKS.find((p) => p.id === key);
    return list.find((l) => l.id === key) ?? (park ? list.find((l) => l.name === park.name) : undefined);
}
