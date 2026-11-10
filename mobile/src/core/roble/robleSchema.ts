// Detecta cuándo Roble rechaza una operación porque falta una tabla o una
// columna nueva (por ejemplo, porque todavía no se ejecutaron los cambios de
// ROBLE_CAMBIOS.md). Así la app muestra QUÉ falta configurar en vez de un
// error genérico, y nunca "simula" que guardó algo.
import { RobleOptionalColumns } from "./robleOptionalColumns";
import { RobleApiException } from "./sdk/robleExceptions";

export const RobleSchema = {
  isMissingColumn(error: unknown, column?: string): boolean {
    if (!(error instanceof RobleApiException)) return false;
    const invalid = RobleOptionalColumns.invalidColumns(error.message);
    return column == null ? invalid.size > 0 : invalid.has(column);
  },

  isMissingTable(error: unknown): boolean {
    if (!(error instanceof RobleApiException)) return false;
    const m = error.message.toLowerCase();
    return (
      (m.includes("tabla") || m.includes("table")) &&
      (m.includes("no existe") || m.includes("not exist") || m.includes("not found") || m.includes("no encontrada"))
    );
  },
};
