import { NextRequest, NextResponse } from "next/server";
import { authConfig, readRobleIdentity, RobleAuthFailure, type RobleAuthConfig, type RobleIdentity } from "./auth";
import { deleteDevSession, devSessionCookie, getDevSession, refreshDevSession } from "./dev-session";
import { RobleProjectReadFailure } from "./own-projects";
import { parseProjectWrite, ProjectWriteFailure, saveRobleProject } from "./project-write";

const headers = { "Cache-Control": "no-store", Vary: "Cookie" };
const error = (message: string, status: number, projectId?: string) => NextResponse.json({ error: message, ...(projectId ? { projectId } : {}) }, { status, headers });

async function verifiedSession(request: NextRequest): Promise<{ config: RobleAuthConfig; token: string; identity: RobleIdentity }> {
  const id = request.cookies.get(devSessionCookie)?.value;
  let session = getDevSession(id);
  if (!session) throw new ProjectWriteFailure(401, "Inicia sesión para guardar en Roble.");
  const config = authConfig();
  let identity: RobleIdentity;
  try { identity = await readRobleIdentity(config, session.tokens.accessToken); }
  catch (cause) {
    if (!(cause instanceof RobleAuthFailure) || cause.status !== 401) throw cause;
    session = await refreshDevSession(id, session.tokens.accessToken, config);
    identity = await readRobleIdentity(config, session.tokens.accessToken);
  }
  if (identity.userId !== session.identity.userId) {
    deleteDevSession(id);
    throw new ProjectWriteFailure(401, "Tu sesión terminó. Inicia sesión de nuevo.");
  }
  return { config, token: session.tokens.accessToken, identity };
}

export async function devRobleMutation(
  request: NextRequest,
  act: (context: { config: RobleAuthConfig; token: string; identity: RobleIdentity }, body: Record<string, unknown>) => Promise<Record<string, unknown>>,
  successStatus = 200,
): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") return error("El guardado está disponible solo en desarrollo.", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return error("Solicitud no permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return error("Solicitud inválida.", 400);
  const bodyText = await request.text();
  if (bodyText.length > 32_768) return error("La solicitud supera el tamaño permitido.", 413);
  let body: unknown;
  try { body = JSON.parse(bodyText); } catch { return error("Solicitud inválida.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return error("Solicitud inválida.", 400);
  try {
    const context = await verifiedSession(request);
    const result = await act(context, body as Record<string, unknown>);
    return NextResponse.json(result, { status: successStatus, headers });
  } catch (cause) {
    if (cause instanceof ProjectWriteFailure) return error(cause.message, cause.status, cause.projectId);
    if (cause instanceof RobleProjectReadFailure && cause.status === 401) {
      return error("Roble rechazó el acceso a estos datos. Tu sesión sigue activa.", 403);
    }
    if (cause instanceof RobleAuthFailure && cause.status === 401) {
      deleteDevSession(request.cookies.get(devSessionCookie)?.value);
      return error("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    }
    return error("No pudimos completar la acción en Roble. Revisa el resultado antes de reintentar.", 503);
  }
}

export async function devRobleProjectWrite(request: NextRequest, projectId?: string): Promise<NextResponse> {
  return devRobleMutation(request, async ({ config, token, identity }, body) => {
    const input = parseProjectWrite(body);
    const id = await saveRobleProject(config, token, identity, input, projectId);
    return { id, isDraft: !input.publish || input.audience === "Solo yo" };
  }, projectId ? 200 : 201);
}
