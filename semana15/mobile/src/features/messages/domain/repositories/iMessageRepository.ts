import { DirectMessage } from "../models/directMessage";

/** Mensajes directos (tabla `direct_messages`). */
export interface IMessageRepository {
  allOf(userId: string): Promise<DirectMessage[]>;
  thread(me: string, other: string): Promise<DirectMessage[]>;
  send(message: DirectMessage): Promise<DirectMessage>;
  markThreadRead(me: string, other: string): Promise<void>;
}
