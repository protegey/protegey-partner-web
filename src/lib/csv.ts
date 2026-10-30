export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

const NEEDS_QUOTING = /[",\n\r]/;

function escapeCsvField(raw: string | number | boolean | null | undefined): string {
  const value = raw === null || raw === undefined ? "" : String(raw);
  return NEEDS_QUOTING.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Client-side mirror of the backend's `toCsv` util — for the one list (Alert Rules) that's
 * already fully loaded in memory with no server pagination, so there's no export endpoint to
 * call: build the CSV text directly from the rows already on screen. */
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}

/** Triggers a browser download of CSV text already generated server-side — creates a Blob,
 * clicks a throwaway anchor, then cleans up. No server round-trip beyond the export fetch
 * itself, since the text is already in hand by the time this runs. */
export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
