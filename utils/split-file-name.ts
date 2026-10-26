/**
 * Splits a file name where its middle should give way when it is too long for its line (a `labelEnd`): the end that stays is the last short chunk and the extension, the part a person tells one
 * version from another by. "flinders_bushland_assessment_01.xlsx" is "flinders_bushland_assessment_" and "01.xlsx"; "report.csv" is "report" and ".csv".
 */
export function splitFileName(name: string): { head: string; tail: string } {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 && name.length - dot <= 8 ? name.slice(dot) : "";
    const stem = ext ? name.slice(0, dot) : name;
    const cut = Math.max(stem.lastIndexOf("_"), stem.lastIndexOf("-"), stem.lastIndexOf(" ")) + 1;
    const chunk = stem.slice(cut);
    const tail = (cut > 0 && chunk.length <= 8 ? chunk : "") + ext;
    return tail && tail.length < name.length ? { head: name.slice(0, name.length - tail.length), tail } : { head: name, tail: "" };
}
