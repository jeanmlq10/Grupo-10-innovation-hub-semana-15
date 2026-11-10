/** Un mensaje entre dos usuarios (tabla `direct_messages`). */
export class DirectMessage {
  readonly id: string;
  readonly fromUserId: string;
  readonly fromName: string;
  readonly toUserId: string;
  readonly toName: string;
  readonly text: string;
  readonly createdAt: Date;
  readonly read: boolean;

  constructor(p: {
    id: string;
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    text: string;
    createdAt: Date;
    read?: boolean;
  }) {
    this.id = p.id;
    this.fromUserId = p.fromUserId;
    this.fromName = p.fromName;
    this.toUserId = p.toUserId;
    this.toName = p.toName;
    this.text = p.text;
    this.createdAt = p.createdAt;
    this.read = p.read ?? false;
  }

  isFrom(userId: string) {
    return this.fromUserId === userId;
  }
}
