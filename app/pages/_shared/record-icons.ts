import type { FC } from "react";
import { Folder } from "@untitledui/icons";
import { Binoculars, Box, CalendarCheck2, ChartScatter, Footprints, Grid2x2, LocateFixed, MapPinned, Mountain, Route, ScanEye, Shapes, SquareDashed, Trees } from "lucide-react";

// Type icons for a project's records (lucide-react, per the designer: "find from online, no need to stick with only
// the design system icons here"). One icon per type, and occurrences and observations read differently: an
// occurrence is "found here" (a point, or a scatter of points for a population), an observation is "looked at"
// (eye, binoculars) or what was looked at (land, community). One map, here, so the records tree, the record pages
// and the "What is a project?" card all draw a Site, a Visit or an Occurrence the same way.
type Icon = FC<{ className?: string }>;

const EVENT_ICON: Record<string, Icon> = {
  Site: MapPinned,
  Visit: CalendarCheck2,
  Transect: Route,
  Quadrat: Grid2x2,
  Block: SquareDashed,
  Ramble: Footprints,
  Trap: Box,
  "Custom event": Shapes,
};
const OCCURRENCE_ICON: Record<string, Icon> = { Individual: LocateFixed, Population: ChartScatter };
const OBSERVATION_ICON: Record<string, Icon> = { Individual: ScanEye, Population: Binoculars, "Non-biotic": Mountain, Community: Trees };

export function recordIcon(r: { kind: "event" | "occurrence" | "observation"; type: string }): Icon {
  if (r.kind === "event") return EVENT_ICON[r.type] ?? Folder;
  if (r.kind === "occurrence") return OCCURRENCE_ICON[r.type] ?? LocateFixed;
  return OBSERVATION_ICON[r.type] ?? ScanEye;
}
