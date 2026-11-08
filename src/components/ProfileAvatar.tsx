import { Icon } from "./Icon";
export function ProfileAvatar({ name, avatarIcon }: { name: string; avatarIcon: string }) {
  const icon = avatarIcon === "star" ? "plus" : avatarIcon === "idea" ? "compass" : "leaf";
  return <span className="profile-avatar" aria-label={`Avatar de ${name}`}><Icon name={icon} size={42} /></span>;
}
