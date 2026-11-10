// Equivalente de core/roble/roble_optional_columns.dart: escritura tolerante a
// columnas que todavía no existen en Roble. Si Roble rechaza una columna
// opcional, se recuerda y se reintenta sin ella.
import { Row } from "./sdk/robleOwnership";
import { RobleApiException } from "./sdk/robleExceptions";

const missingColumns = new Set<string>();

export const RobleOptionalColumns = {
  get missing(): ReadonlySet<string> {
    return new Set(missingColumns);
  },

  /** Sólo para pruebas. */
  reset() {
    missingColumns.clear();
  },

  async write<T>(row: Row, send: (row: Row) => Promise<T>, { optional }: { optional: Set<string> }): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await send(withoutMissing(row));
      } catch (e) {
        if (!(e instanceof RobleApiException)) throw e;
        const invalid = RobleOptionalColumns.invalidColumns(e.message);
        const removable = new Set([...invalid].filter((c) => optional.has(c) && !missingColumns.has(c)));
        if (attempt >= optional.size || removable.size === 0 || removable.size !== invalid.size) throw e;
        removable.forEach((c) => missingColumns.add(c));
      }
    }
  },

  invalidColumns(message: string): Set<string> {
    const text = message.replace(/[[\]]/g, "");
    const lower = text.toLowerCase();

    const quoted = /["“”'`]([A-Za-z_][A-Za-z0-9_]*)["“”'`]/g;
    if (lower.includes("columna") && lower.includes("no existe")) {
      const out = new Set<string>();
      for (const m of text.matchAll(quoted)) out.add(m[1]);
      return out;
    }

    const index = lower.indexOf("columnas inv");
    if (index < 0) return new Set();
    const colon = text.indexOf(":", index);
    if (colon < 0) return new Set();
    return new Set(
      text
        .substring(colon + 1)
        .split(",")
        .map((c) => c.trim().replace(/["'`.]/g, ""))
        .filter((c) => c.length > 0),
    );
  },
};

function withoutMissing(row: Row): Row {
  const copy: Row = { ...row };
  for (const key of Object.keys(copy)) if (missingColumns.has(key)) delete copy[key];
  return copy;
}
