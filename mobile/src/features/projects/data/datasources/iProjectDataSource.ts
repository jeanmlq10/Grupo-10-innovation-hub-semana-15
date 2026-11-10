import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Lo que la feature necesita que alguien sepa hablar sobre proyectos. */
export interface IProjectDataSource {
  readAll(): Promise<Row[]>;
  readAllPublic(): Promise<Row[]>;
  readById(id: string): Promise<Row | null>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
  delete(id: string): Promise<void>;
}
