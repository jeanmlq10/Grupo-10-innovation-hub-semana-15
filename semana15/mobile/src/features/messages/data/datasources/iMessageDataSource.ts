import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `direct_messages`. */
export interface IMessageDataSource {
  readSentBy(userId: string): Promise<Row[]>;
  readReceivedBy(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
}
