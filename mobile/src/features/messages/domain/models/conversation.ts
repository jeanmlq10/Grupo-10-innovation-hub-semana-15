import { DirectMessage } from "./directMessage";

/** Una conversación de "Mensajes": todos los mensajes con otra persona. */
export class Conversation {
  readonly otherUserId: string;
  readonly otherName: string;
  readonly lastMessage: DirectMessage;
  readonly unreadCount: number;

  constructor(p: { otherUserId: string; otherName: string; lastMessage: DirectMessage; unreadCount: number }) {
    this.otherUserId = p.otherUserId;
    this.otherName = p.otherName;
    this.lastMessage = p.lastMessage;
    this.unreadCount = p.unreadCount;
  }

  static group(me: string, messages: DirectMessage[]): Conversation[] {
    const byOther = new Map<string, DirectMessage[]>();
    for (const message of messages) {
      const other = message.isFrom(me) ? message.toUserId : message.fromUserId;
      if (!other || other === me) continue;
      if (!byOther.has(other)) byOther.set(other, []);
      byOther.get(other)!.push(message);
    }
    const result: Conversation[] = [];
    byOther.forEach((list, other) => {
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const last = list[0];
      result.push(
        new Conversation({
          otherUserId: other,
          otherName: last.isFrom(me) ? last.toName : last.fromName,
          lastMessage: last,
          unreadCount: list.filter((m) => !m.isFrom(me) && !m.read).length,
        }),
      );
    });
    result.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    return result;
  }
}
