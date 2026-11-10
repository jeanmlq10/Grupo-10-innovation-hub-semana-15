import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { MessageFailure } from "../../domain/messageFailure";
import { DirectMessage } from "../../domain/models/directMessage";
import { IMessageRepository } from "../../domain/repositories/iMessageRepository";
import { IMessageDataSource } from "../datasources/iMessageDataSource";

/**
 * Mensajes: convierte filas y traduce errores. Un mensaje enviado solo
 * cuenta si lo escribió de verdad quien dice enviarlo (`_owner`).
 */
export class MessageRepository implements IMessageRepository {
  constructor(private readonly source: IMessageDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new MessageFailure(m));
  }

  async allOf(userId: string) {
    const [sent, received] = await Promise.all([
      this.guard(() => this.source.readSentBy(userId)),
      this.guard(() => this.source.readReceivedBy(userId)),
    ]);
    const seen = new Set<string>();
    const out: DirectMessage[] = [];
    for (const row of [...sent, ...received]) {
      const id = RobleRows.str(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      if (this.isGenuine(row)) out.push(this.toMessage(row));
    }
    return out;
  }

  async thread(me: string, other: string) {
    const all = await this.allOf(me);
    return all
      .filter((m) => (m.fromUserId === me && m.toUserId === other) || (m.fromUserId === other && m.toUserId === me))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async send(message: DirectMessage) {
    const row = await this.guard(() =>
      this.source.create({
        fromUserId: message.fromUserId,
        fromName: message.fromName,
        toUserId: message.toUserId,
        toName: message.toName,
        text: message.text,
        read: false,
        createdAt: RobleRows.nowIso(),
      }),
    );
    return this.toMessage(row);
  }

  async markThreadRead(me: string, other: string) {
    const unread = (await this.guard(() => this.source.readReceivedBy(me))).filter(
      (row) => RobleRows.str(row.fromUserId) === other && !RobleRows.boolean(row.read),
    );
    for (const row of unread) {
      await this.guard(() => this.source.update(RobleRows.str(row._id), { read: true }));
    }
  }

  private isGenuine(row: Row) {
    return RobleRows.author(row, "fromUserId") === RobleRows.str(row.fromUserId);
  }

  private toMessage(row: Row): DirectMessage {
    return new DirectMessage({
      id: RobleRows.str(row._id),
      fromUserId: RobleRows.str(row.fromUserId),
      fromName: RobleRows.str(row.fromName, "Usuario"),
      toUserId: RobleRows.str(row.toUserId),
      toName: RobleRows.str(row.toName, "Usuario"),
      text: RobleRows.str(row.text),
      createdAt: RobleRows.date(row.createdAt) ?? new Date(),
      read: RobleRows.boolean(row.read),
    });
  }
}
