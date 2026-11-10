import { NextRequest, NextResponse } from "next/server";
import { authConfig, readRobleIdentity, refreshRobleTokens, RobleAuthFailure, type RobleAuthConfig, type RobleIdentity } from "./auth";
import { deleteDevSession, devSessionCookie, getDevSession } from "./dev-session";
import { RobleProjectReadFailure } from "./own-projects";
import { parseProjectWrite, ProjectWriteFailure, saveRobleProject } from "./project-write";

const headers = { "Cache-Control": "no-store", Vary: "Cookie" };
const error = (message: string, status: number, projectId?: string) => NextResponse.json({ error: message, ...(projectId ? { projectId } : {}) }, { status, headers });

async function verifiedSession(request: NextRequest): Promise<{ config: RobleAuthConfig; token: string; identity: RobleIdentity }> {
  const id = request.cookies.get(devSessionCookie)?.value;
  const session = getDevSession(id);
  if (!session) throw new ProjectWriteFailure(401, "Inicia sesión para guardar en Roble.");
  const config = authConfig();
  let identity: RobleIdentity;
  try { identity = await readRobleIdentity(config, session.tokens.accessToken); }
  catch (cause) {
    if (!(cause instanceof RobleAuthFailure) || cause.status !== 401 || !session.tokens.refreshToken) throw cause;
    session.tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
    identity = await readRobleIdentity(config, session.tokens.accessToken);
  }
  if (identity.userId !== session.identity.userId) {
    deleteDevSession(id);
    throw new ProjectWriteFailure(401, "Tu sesión terminó. Inicia sesión de nuevo.");
  }
  session.identity = identity;
  return { config, token: session.tokens.accessToken, identity };
}

export async function devRobleProjectWrite(request: NextRequest, projectId?: string): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") return error("El guardado está disponible solo en desarrollo.", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return error("Solicitud no permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return error("Solicitud inválida.", 400);
  const bodyText = await request.text();
  if (bodyText.length > 32_768) return error("El proyecto supera el tamaño permitido.", 413);
  let body: unknown;
  try { body = JSON.parse(bodyText); } catch { return error("Solicitud inválida.", 400); }
  try {
    const input = parseProjectWrite(body);
    const { config, token, identity } = await verifiedSession(request);
    const id = await saveRobleProject(config, token, identity, input, projectId);
    return NextResponse.json({ id, isDraft: !input.publish || input.audience === "Solo yo" }, { status: projectId ? 200 : 201, headers });
  } catch (cause) {
    if (cause instanceof ProjectWriteFailure) return error(cause.message, cause.status, cause.projectId);
    if ((cause instanceof RobleAuthFailure || cause instanceof RobleProjectReadFailure) && cause.status === 401) {
      deleteDevSession(request.cookies.get(devSessionCookie)?.value);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    return error("No pudimos completar el guardado en Roble. Revisa tus proyectos antes de reintentar.", 503);
  }
}
