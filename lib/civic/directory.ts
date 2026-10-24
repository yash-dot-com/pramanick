import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Category } from "./model";
export function readCsv(filename: string): Record<string, string>[] {
  const input = readFileSync(filename, "utf8").replace(/^\uFEFF/, "");
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') { if (quoted && input[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if (char === "\n" && !quoted) { row.push(field.replace(/\r$/, "")); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((key, i) => [key, values[i] ?? ""])));
}
export const areaId = (name: string) => ({ Kothrud: "kothrud", PCMC: "pcmc", "District Court": "district-court", Vanaz: "vanaz", Ramwadi: "ramwadi", "Viman Nagar": "viman-nagar" }[name] ?? "");
export const directoryPath = (name: string) => resolve(process.cwd(), "data/pune", name);
export const directoryExists = (name: string) => existsSync(directoryPath(name));
export function categoriesFor(topics: string): Category[] {
  const result: Category[] = [];
  if (/road|footpath|pothole/i.test(topics)) result.push("roads");
  if (/water/i.test(topics)) result.push("water");
  if (/sanitation|drain|sewer|garbage|waste/i.test(topics)) result.push("drainage");
  if (/light|electrical/i.test(topics)) result.push("lighting");
  return result;
}
