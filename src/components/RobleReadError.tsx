"use client";

import { Icon } from "./Icon";

type ErrorIcon = "folder" | "bell" | "chat" | "user";

export function RobleReadError({ title, icon, status, onRetry }: {
  title: string;
  icon: ErrorIcon;
  status: number;
  onRetry: () => void;
}) {
  const message = status === 403
    ? "Roble no permite consultar estos datos con tu cuenta. Tu sesión sigue activa."
    : status === 429
      ? "Roble está limitando las solicitudes. Espera un momento antes de volver a intentar."
      : "No pudimos cargar los datos. Comprueba tu conexión y vuelve a intentarlo.";
  return <div className="empty-panel" role="alert">
    <Icon name={icon} size={36} />
    <h2>{title}</h2>
    <p>{message}</p>
    <button type="button" className="outline-action" onClick={onRetry}>Volver a intentar</button>
  </div>;
}
