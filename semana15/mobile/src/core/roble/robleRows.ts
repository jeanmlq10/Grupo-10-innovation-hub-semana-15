// Equivalente de core/roble/roble_rows.dart: utilidades para leer filas de
// Roble. Las usan los repositorios al convertir filas en entidades.
import { Row, robleOwnerOf } from "./sdk/robleOwnership";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Interpreta fechas como `DateTime.tryParse` de Dart (ISO 8601). */
export function parseDate(value: string): Date | null {
  const text = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return null;
  // Dart acepta "2026-10-25 10:00:00"; JS necesita la "T".
  const normalized = text.length > 10 && text[10] === " " ? `${text.slice(0, 10)}T${text.slice(11)}` : text;
  // Sin zona horaria Dart lo trata como hora local; JS también para fecha+hora,
  // pero una fecha sola la toma como UTC: se fuerza a local.
  const d = normalized.length === 10 ? new Date(`${normalized}T00:00:00`) : new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const RobleRows = {
  str(value: unknown, fallback = ""): string {
    return value == null ? fallback : String(value);
  },

  strOrNull(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value);
    return text.length === 0 ? null : text;
  },

  integer(value: unknown): number {
    if (typeof value === "number") return Math.trunc(value);
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) && /^\s*[-+]?\d+\s*$/.test(String(value)) ? parsed : 0;
  },

  boolean(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean") return value;
    if (value == null) return fallback;
    const text = String(value).toLowerCase();
    if (text === "true" || text === "t" || text === "1") return true;
    if (text === "false" || text === "f" || text === "0") return false;
    return fallback;
  },

  date(value: unknown): Date | null {
    return value == null ? null : parseDate(String(value));
  },

  json(value: unknown): unknown {
    if (typeof value === "string" && value.length > 0) {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  },

  stringList(value: unknown): string[] {
    const decoded = RobleRows.json(value);
    if (Array.isArray(decoded)) return decoded.map((e) => String(e));
    return [];
  },

  intMap(value: unknown): Record<string, number> {
    const decoded = RobleRows.json(value);
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(decoded)) out[k] = RobleRows.integer(v);
      return out;
    }
    return {};
  },

  author(row: Row, fallbackColumn: string): string | null {
    return robleOwnerOf(row) ?? RobleRows.strOrNull(row[fallbackColumn]);
  },

  nowIso(): string {
    return new Date().toISOString();
  },

  dayIso(day: Date | null | undefined): string | null {
    if (!day) return null;
    return `${String(day.getFullYear()).padStart(4, "0")}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
  },

  day(value: unknown): Date | null {
    if (value == null) return null;
    const text = String(value).trim();
    if (text.length < 10) return null;
    const parsed = parseDate(text.substring(0, 10));
    if (!parsed) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  },
};
