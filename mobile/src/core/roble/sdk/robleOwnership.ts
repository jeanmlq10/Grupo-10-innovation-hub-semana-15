// Port de `roble_ownership.dart` del SDK oficial.

/** Columna que dice de quién es cada fila. La pone el servidor. */
export const robleOwnerColumn = "_owner";

export type Row = Record<string, unknown>;

/** De quién es la fila, o `null` si la tabla no lo dice. */
export function robleOwnerOf(row: Row | null | undefined): string | null {
  const owner = row?.[robleOwnerColumn];
  return typeof owner === "string" && owner.length > 0 ? owner : null;
}

/** Devuelve [data] sin `_owner`. El servidor lo asigna él. */
export function robleWithoutOwner(data: Row): Row {
  if (!(robleOwnerColumn in data)) return data;
  const copy = { ...data };
  delete copy[robleOwnerColumn];
  return copy;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decodifica base64url a texto UTF-8 sin depender de `atob`. */
export function base64UrlDecodeToString(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const a = B64.indexOf(s[i]);
    const b = B64.indexOf(s[i + 1]);
    const c = s[i + 2] === "=" ? -1 : B64.indexOf(s[i + 2]);
    const d = s[i + 3] === "=" ? -1 : B64.indexOf(s[i + 3]);
    if (a < 0 || b < 0) throw new Error("base64 inválido");
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0 && c >= 0) bytes.push(((c & 3) << 6) | d);
  }
  // UTF-8 → string
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b0 = bytes[i++];
    if (b0 < 0x80) out += String.fromCharCode(b0);
    else if (b0 < 0xe0) out += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else if (b0 < 0xf0) {
      const b1 = bytes[i++];
      const b2 = bytes[i++];
      out += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else {
      const b1 = bytes[i++];
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const cp = (((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)) - 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}

/** Payload de un JWT, sin verificar la firma (sólo para pintar). */
export function robleJwtPayload(token: string | null | undefined): Row | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length < 2 || partes[1].length === 0) return null;
  try {
    const decoded = JSON.parse(base64UrlDecodeToString(partes[1]));
    return decoded && typeof decoded === "object" && !Array.isArray(decoded) ? (decoded as Row) : null;
  } catch {
    return null;
  }
}
