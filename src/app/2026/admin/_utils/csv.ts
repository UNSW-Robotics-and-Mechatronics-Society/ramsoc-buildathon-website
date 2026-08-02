import { NextResponse } from "next/server";

/**
 * Shared CSV serialisation for the admin export routes. Both `export/teams`
 * and `export/participants` used to hand-roll identical copies of this.
 */

/** RFC 4180 cell escaping: quote if the value contains a delimiter or quote. */
export function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");
}

/**
 * Wrap a CSV body in a download response, stamping today's date onto the
 * filename (`teams` -> `teams-2026-08-01.csv`).
 */
export function csvResponse(filenameBase: string, csv: string): NextResponse {
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}-${date}.csv"`,
    },
  });
}
