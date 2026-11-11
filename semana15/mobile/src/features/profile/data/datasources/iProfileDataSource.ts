import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `user_profiles`. */
export interface IProfileDataSource {
  readForUser(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
  delete(id: string): Promise<void>;
}
