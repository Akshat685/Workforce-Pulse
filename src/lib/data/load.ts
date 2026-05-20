import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import type { RawActivityRow, RawEmployeeRow } from "./types";

export async function loadRawActivityRows(): Promise<RawActivityRow[]> {
  const filePath = path.join(process.cwd(), "data", "activity_logs.csv");
  const csv = await fs.readFile(filePath, "utf8");
  const parsed = Papa.parse<RawActivityRow>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  if (parsed.errors.length) {
    console.warn("CSV parse warnings", parsed.errors);
  }

  return parsed.data;
}

export async function loadRawEmployeeRows(): Promise<RawEmployeeRow[]> {
  const filePath = path.join(process.cwd(), "data", "employees.json");
  const json = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(json);
  // The brief mentions data.employees; the actual uploaded file uses top-level employees.
  return parsed?.data?.employees ?? parsed?.employees ?? [];
}
