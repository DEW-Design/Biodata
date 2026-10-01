import { useEffect, useMemo, useState } from "react";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { rowFromDataset, sampleRuns, visibleTo, type IngestionRow } from "@/app/pages/_shared/reports/ingestion-report-data";
import { useUserRole } from "@/lib/use-user-role";

// The ledger of dataset submissions the reports after the first are drawn from: the same runs the Data
// Ingestion Report shows (real uploads through `rowFromDataset`, then the sample history), limited to what
// the signed-in role may see (`visibleTo`). A run that is still validating or processing moves on its own
// clock, so the clock is re-read once a second while any run is live, and stops when none is, exactly as
// `useIngestionReport` does.
export function useIngestionRuns() {
  const role = useUserRole();
  const datasets = useDatasets();
  const [now, setNow] = useState(() => Date.now());
  const all = useMemo(() => [...datasets.map((d) => rowFromDataset(d, now)), ...sampleRuns()], [datasets, now]);
  const anyLive = all.some((r) => r.live);
  useEffect(() => {
    if (!anyLive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [anyLive]);

  const runs: IngestionRow[] = useMemo(() => visibleTo(all, role), [all, role]);
  return { role, isAdmin: role === "biodata-admin", runs };
}
