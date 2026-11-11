import { NextRequest, NextResponse } from "next/server";
import { authConfig, RobleAuthFailure, type RobleAuthConfig } from "./auth";
import { deleteDevSession, devSessionCookie, getDevSession, refreshDevSession } from "./dev-session";
import { RobleProjectReadFailure } from "./own-projects";

const headers = { "Cache-Control": "no-store", Vary: "Cookie" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function devRobleRead<T>(
  request: NextRequest,
  load: (config: RobleAuthConfig, accessToken: string, userId: string) => Promise<T | null>,
  notFoundMessage = "El proyecto no existe o no pertenece a tu cuenta.",
): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") return error("La consulta está disponible solo en desarrollo.", 503);
  const sessionId = request.cookies.get(devSessionCookie)?.value;
  const session = getDevSession(sessionId);
  if (!session) return error("Inicia sesión para consultar Roble.", 401);

  try {
    const config = authConfig();
    let result;
    try { result = await load(config, session.tokens.accessToken, session.identity.userId); }
    catch (cause) {
      if (!(cause instanceof RobleProjectReadFailure) || cause.status !== 401) throw cause;
      const refreshed = await refreshDevSession(sessionId, session.tokens.accessToken, config);
      try { result = await load(config, refreshed.tokens.accessToken, refreshed.identity.userId); }
      catch (retryCause) {
        if (retryCause instanceof RobleProjectReadFailure && retryCause.status === 401) {
          return error("Roble rechazó el acceso a estos datos. Tu sesión sigue activa.", 403);
        }
        throw retryCause;
      }
    }
    if (result === null) return error(notFoundMessage, 404);
    return NextResponse.json(result, { headers });
  } catch (cause) {
    if ((cause instanceof RobleAuthFailure || cause instanceof RobleProjectReadFailure) && cause.status === 401) {
      deleteDevSession(sessionId);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    if (cause instanceof RobleProjectReadFailure && cause.status === 403) {
      return error("Roble no permite consultar estos datos con tu cuenta. Tu sesión sigue activa.", 403);
    }
    if ((cause instanceof RobleAuthFailure || cause instanceof RobleProjectReadFailure) && cause.status === 429) {
      return error("Roble limitó temporalmente las solicitudes. Espera antes de reintentar.", 429);
    }
    return error("No pudimos consultar Roble. Inténtalo más tarde.", 503);
  }
}
