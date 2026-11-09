import { NextRequest, NextResponse } from "next/server";
import { authConfig, loginToRoble, logoutFromRoble, readRobleIdentity, refreshRobleTokens, RobleAuthFailure } from "@/lib/roble/auth";
import { createDevSession, deleteDevSession, devSessionCookie, devSessionMaxAge, getDevSession } from "@/lib/roble/dev-session";

const headers = { "Cache-Control": "no-store", Vary: "Cookie" };
const available = () => process.env.NODE_ENV === "development";
const unavailable = () => NextResponse.json({ error: "El acceso web está disponible solo en desarrollo." }, { status: 503, headers });
const cookieOptions = { name: devSessionCookie, httpOnly: true, sameSite: "strict" as const, secure: false, path: "/" };

function clearCookie(response: NextResponse) {
  response.cookies.set({ ...cookieOptions, value: "", expires: new Date(0) });
  return response;
}
function fail(error: unknown) {
  const status = error instanceof RobleAuthFailure ? error.status : 503;
  const message = status === 401 ? "Correo o contraseña incorrectos." : status === 429 ? "Demasiados intentos. Espera un momento." : "No pudimos conectar con Roble. Inténtalo más tarde.";
  return NextResponse.json({ error: message }, { status, headers });
}
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!available()) return unavailable();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400, headers });
  const bodyText = await request.text();
  if (bodyText.length > 2048) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400, headers });
  let body: unknown;
  try { body = JSON.parse(bodyText); } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400, headers }); }
  const input = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || email.length > 254 || !password || password.length > 1024) return NextResponse.json({ error: "Escribe tu correo y contraseña." }, { status: 400, headers });
  try {
    const { tokens, identity } = await loginToRoble(authConfig(), email, password);
    const oldId = request.cookies.get(devSessionCookie)?.value;
    deleteDevSession(oldId);
    const id = createDevSession(tokens, identity);
    const response = NextResponse.json({ user: identity }, { headers });
    response.cookies.set({ ...cookieOptions, value: id, maxAge: devSessionMaxAge });
    return response;
  } catch (error) { return fail(error); }
}

export async function GET(request: NextRequest) {
  if (!available()) return unavailable();
  const id = request.cookies.get(devSessionCookie)?.value;
  const session = getDevSession(id);
  if (!session) return clearCookie(NextResponse.json({ error: "Inicia sesión para ver tu cuenta." }, { status: 401, headers }));
  try {
    const config = authConfig();
    let identity;
    try { identity = await readRobleIdentity(config, session.tokens.accessToken); }
    catch (error) {
      if (!(error instanceof RobleAuthFailure) || error.status !== 401 || !session.tokens.refreshToken) throw error;
      session.tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
      identity = await readRobleIdentity(config, session.tokens.accessToken);
    }
    if (identity.userId !== session.identity.userId) throw new RobleAuthFailure(401);
    session.identity = identity;
    return NextResponse.json({ user: identity }, { headers });
  } catch (error) {
    if (error instanceof RobleAuthFailure && error.status === 401) {
      deleteDevSession(id);
      return clearCookie(NextResponse.json({ error: "Tu sesión terminó. Inicia sesión de nuevo." }, { status: 401, headers }));
    }
    return fail(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!available()) return unavailable();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403, headers });
  const id = request.cookies.get(devSessionCookie)?.value;
  const session = getDevSession(id);
  deleteDevSession(id);
  if (session) {
    try { await logoutFromRoble(authConfig(), session.tokens.accessToken); } catch { /* Local session is already gone. */ }
  }
  return clearCookie(new NextResponse(null, { status: 204, headers }));
}
