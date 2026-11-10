import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { ProjectWriteFailure, writeRobleRow } from "./project-write.ts";

export type RobleMessage = {
  id: string; fromUserId: string; fromName: string; toUserId: string; toName: string;
  text: string; createdAt: string; read: boolean;
};
const row = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

export function messagesFromRows(rows: unknown[], userId: string): RobleMessage[] {
  const seen = new Set<string>();
  return rows.flatMap(item => {
    const record = row(item);
    if (!record) return [];
    const id = text(record._id), fromUserId = text(record.fromUserId), toUserId = text(record.toUserId);
    if (!id || seen.has(id) || !fromUserId || !toUserId || text(record._owner) !== fromUserId ||
      (fromUserId !== userId && toUserId !== userId)) return [];
    seen.add(id);
    return [{ id, fromUserId, fromName: text(record.fromName), toUserId, toName: text(record.toName),
      text: text(record.text), createdAt: text(record.createdAt), read: record.read === true }];
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function readMyMessages(config: RobleAuthConfig, token: string, userId: string): Promise<RobleMessage[]> {
  const [sent, received] = await Promise.all([
    readRobleRows(config, token, "direct_messages", { fromUserId: userId }),
    readRobleRows(config, token, "direct_messages", { toUserId: userId }),
  ]);
  return messagesFromRows([...sent, ...received], userId);
}

export async function sendRobleMessage(config: RobleAuthConfig, token: string, identity: RobleIdentity, targetId: string, message: string): Promise<string> {
  const toUserId = targetId.trim(), content = message.trim();
  if (!/^[0-9a-f-]{36}$/i.test(toUserId) || toUserId === identity.userId || !content || content.length > 1000) {
    throw new ProjectWriteFailure(400, "Revisa la persona destinataria y el mensaje.");
  }
  const profiles = await readRobleRows(config, token, "user_profiles", { userId: toUserId });
  const recipient = profiles.map(row).find(item => item && text(item.userId) === toUserId && text(item._owner) === toUserId);
  if (!recipient) throw new ProjectWriteFailure(404, "No encontramos el perfil de esa persona.");
  if (text(recipient.contactPermission) === "nobody") throw new ProjectWriteFailure(403, "Esta persona no recibe mensajes.");
  const created = await writeRobleRow(config, token, "POST", "insert-one", { tableName: "direct_messages", record: {
    fromUserId: identity.userId, fromName: identity.name || identity.email,
    toUserId, toName: text(recipient.name) || text(recipient.username) || "Usuario",
    text: content, read: false, createdAt: new Date().toISOString(),
  } });
  return text(created._id);
}
