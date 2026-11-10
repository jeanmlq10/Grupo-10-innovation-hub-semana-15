export async function submitAuthFlow(payload: Record<string, string>): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/flow", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), credentials: "same-origin", cache: "no-store",
    });
  } catch { throw new Error("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."); }
  if (response.ok) return;
  const body: { error?: string } = await response.json().catch(() => ({}));
  throw new Error(body.error ?? "No pudimos completar la solicitud. Inténtalo de nuevo.");
}

export function flowError(error: unknown): string {
  return error instanceof Error ? error.message : "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.";
}
