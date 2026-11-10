import { NextRequest, NextResponse } from "next/server";
import { authConfig, readRobleIdentity, refreshRobleTokens, RobleAuthFailure } from "@/lib/roble/auth";
import { deleteDevSession, devSessionCookie, getDevSession } from "@/lib/roble/dev-session";
import { readOwnProjects, RobleProjectReadFailure } from "@/lib/roble/own-projects";

const headers = { "Cache-Control": "no-store", Vary: "Cookie" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return error("La consulta está disponible solo en desarrollo.", 503);
  const sessionId = request.cookies.get(devSessionCookie)?.value;
  const session = getDevSession(sessionId);
  if (!session) return error("Inicia sesión para ver tus proyectos.", 401);
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
    let projects;
    try { projects = await readOwnProjects(config, session.tokens.accessToken, identity.userId); }
    catch (cause) {
      if (!(cause instanceof RobleProjectReadFailure) || cause.status !== 401 || !session.tokens.refreshToken) throw cause;
      session.tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
      projects = await readOwnProjects(config, session.tokens.accessToken, identity.userId);
    }
    return NextResponse.json({ projects }, { headers });
  } catch (cause) {
    if ((cause instanceof RobleAuthFailure || cause instanceof RobleProjectReadFailure) && cause.status === 401) {
      deleteDevSession(sessionId);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    return error("No pudimos consultar Roble. Inténtalo más tarde.", 503);
  }
}
