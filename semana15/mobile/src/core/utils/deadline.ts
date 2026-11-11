// Equivalente de core/utils/deadline.dart: la fecha límite se incluye completa
// (se puede postular hasta las 23:59 de ese día). Sin fecha = sin límite.
export function isBeforeDeadline(deadline: Date | null | undefined, now: Date = new Date()): boolean {
  if (!deadline) return true;
  const endOfDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate() + 1);
  return now.getTime() < endOfDay.getTime();
}
