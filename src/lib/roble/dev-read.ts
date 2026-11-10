import { NextRequest, NextResponse } from "next/server";
import { authConfig, readRobleIdentity, refreshRobleTokens, RobleAuthFailure, type RobleAuthConfig } from "./auth";
import { deleteDevSession, devSessionCookie, getDevSession } from "./dev-session";
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
    let identity;
    try { identity = await readRobleIdentity(config, session.tokens.accessToken); }
    catch (cause) {
      if (!(cause instanceof RobleAuthFailure) || cause.status !== 401 || !session.tokens.refreshToken) throw cause;
      session.tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
      identity = await readRobleIdentity(config, session.tokens.accessToken);
    }
    if (identity.userId !== session.identity.userId) {
      deleteDevSession(sessionId);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    session.identity = identity;

    let result;
    try { result = await load(config, session.tokens.accessToken, identity.userId); }
    catch (cause) {
      if (!(cause instanceof RobleProjectReadFailure) || cause.status !== 401 || !session.tokens.refreshToken) throw cause;
      session.tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
      result = await load(config, session.tokens.accessToken, identity.userId);
    }
    if (result === null) return error(notFoundMessage, 404);
    return NextResponse.json(result, { headers });
  } catch (cause) {
    if ((cause instanceof RobleAuthFailure || cause instanceof RobleProjectReadFailure) && cause.status === 401) {
      deleteDevSession(sessionId);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    return error("No pudimos consultar Roble. Inténtalo más tarde.", 503);
  }
}
