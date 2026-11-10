import { Icon } from "./Icon";
export function ProfileAvatar({ name, avatarIcon }: { name: string; avatarIcon: string }) {
  const symbols = { star: "✦", smile: "☺", face: "◡", music: "♫", sports: "⚽", camera: "◎", pets: "♧", rocket: "↑" } as Record<string, string>;
  const icons = { person: "user", school: "folder", code: "gear", palette: "sliders", science: "compass", campaign: "bell", lightbulb: "compass", eco: "leaf", sprout: "leaf", idea: "compass" } as const;
  const icon = icons[avatarIcon as keyof typeof icons];
  return <span className="profile-avatar" aria-label={`Avatar de ${name}`}>{icon ? <Icon name={icon} size={42} /> : <span aria-hidden="true">{symbols[avatarIcon] || "✦"}</span>}</span>;
}
