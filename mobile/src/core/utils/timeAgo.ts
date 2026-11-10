// Equivalente de core/utils/time_ago.dart: "Hace 2 h", "Hace 1 día"...
export function timeAgo(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.trunc(diffMs / 60000);
  const hours = Math.trunc(diffMs / 3600000);
  if (minutes < 1) return "Justo ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.trunc(diffMs / 86400000);
  return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}
