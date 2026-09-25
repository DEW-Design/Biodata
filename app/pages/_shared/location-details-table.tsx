"use client";

// The one "Location Details" coordinate table every record type shows (Projects, Events,
// Occurrences, Observations) - per direct request, one format everywhere: rows Zone / Easting /
// Northing / Latitude / Longitude, columns Coordinate / Entered Value / GDA2020 Equivalent.
//
// Honest values only:
//   - Entered Value: what the record was actually captured as. Every record in this build stores
//     a latitude/longitude, so Latitude/Longitude show it and Zone/Easting/Northing are "-" (they
//     weren't entered).
//   - GDA2020 Equivalent: the record's coordinates are treated as GDA2020 (the datum this build's
//     own detail pages already state), so Latitude/Longitude carry over unchanged and Zone/
//     Easting/Northing are the real MGA2020 grid position computed from them (`toMga2020`, a
//     standard Transverse Mercator projection on the GRS80 ellipsoid) - derived, not invented.
//   - No coordinates at all (e.g. a mock record with no lat/lon): every cell is "-".

const DASH = "-";

/** Latitude/longitude (GDA2020) -> MGA2020 zone/easting/northing. Transverse Mercator on GRS80,
 *  k0 = 0.9996, 500 km false easting, 10,000 km false northing (southern hemisphere). */
export function toMga2020(lat: number, lon: number): { zone: number; easting: number; northing: number } {
    const a = 6378137;
    const f = 1 / 298.257222101;
    const k0 = 0.9996;
    const e2 = f * (2 - f);
    const ep2 = e2 / (1 - e2);
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const zone = Math.floor((lon + 180) / 6) + 1;
    const lon0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const lam = (lon * Math.PI) / 180;
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
    const T = Math.tan(phi) ** 2;
    const C = ep2 * Math.cos(phi) ** 2;
    const A = Math.cos(phi) * (lam - lon0);
    const M =
        a *
        ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
            ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
            ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
            ((35 * e6) / 3072) * Math.sin(6 * phi));
    const easting = k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120) + 500000;
    let northing = k0 * (M + N * Math.tan(phi) * ((A * A) / 2 + ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 + ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));
    if (lat < 0) northing += 10000000;
    return { zone, easting, northing };
}

const metres = (n: number) => `${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
const degrees = (n: number) => n.toFixed(6);

export function LocationDetailsTable({ lat, lon }: { lat?: number; lon?: number }) {
    const has = lat !== undefined && lon !== undefined;
    const mga = has ? toMga2020(lat, lon) : null;
    const rows: { coordinate: string; entered: string; gda2020: string }[] = [
        { coordinate: "Zone", entered: DASH, gda2020: mga ? String(mga.zone) : DASH },
        { coordinate: "Easting", entered: DASH, gda2020: mga ? metres(mga.easting) : DASH },
        { coordinate: "Northing", entered: DASH, gda2020: mga ? metres(mga.northing) : DASH },
        { coordinate: "Latitude", entered: has ? degrees(lat) : DASH, gda2020: has ? degrees(lat) : DASH },
        { coordinate: "Longitude", entered: has ? degrees(lon) : DASH, gda2020: has ? degrees(lon) : DASH },
    ];

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-secondary">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-secondary">
                        {["Coordinate", "Entered Value", "GDA2020 Equivalent"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-sm font-normal whitespace-nowrap text-quaternary">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="[&>tr+tr>td]:border-t [&>tr+tr>td]:border-[var(--ui-border-secondary)] [&>tr:first-child>td]:border-t [&>tr:first-child>td]:border-[var(--ui-border-secondary)]">
                    {rows.map((r) => (
                        <tr key={r.coordinate}>
                            <td className="px-4 py-3 font-medium whitespace-nowrap text-primary">{r.coordinate}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-tertiary">{r.entered}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-tertiary">{r.gda2020}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
