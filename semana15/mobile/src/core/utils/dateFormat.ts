// Equivalente de core/utils/date_format.dart: "25 oct 2026".
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "10 nov 2026 · 3:45 p. m." (fecha y hora local, formato de 12 h). */
export function formatDateTime(date: Date): string {
  const h24 = date.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatShortDate(date)} · ${h12}:${minutes} ${h24 < 12 ? "a. m." : "p. m."}`;
}

/** "3:45 p. m." */
export function formatTime(date: Date): string {
  const h24 = date.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(date.getMinutes()).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
}
