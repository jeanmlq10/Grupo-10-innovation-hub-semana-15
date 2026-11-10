import { NextRequest, NextResponse } from "next/server";
import { authConfig, RobleAuthFailure } from "@/lib/roble/auth";
import {
  beginRegistration, completePasswordRecovery, institutionalEmail, normalizeEmail,
  requestPasswordRecovery, resendVerification, validEmail, validPassword, verifyRegistration,
} from "@/lib/roble/auth-flow";

type Action = "register" | "verify" | "resend" | "recover" | "reset";
const headers = { "Cache-Control": "no-store" };
const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
const badInput = (message = "Revisa los datos e inténtalo de nuevo.") => errorResponse(message, 400);
const field = (body: Record<string, unknown>, name: string) => typeof body[name] === "string" ? body[name] as string : "";

function failure(error: unknown, action: Action) {
  const status = error instanceof RobleAuthFailure ? error.status : 503;
  if (status === 429) return errorResponse("Demasiados intentos. Espera un momento antes de volver a probar.", 429);
  if (status === 409) return errorResponse("No pudimos iniciar el registro. Si ya tienes cuenta, inicia sesión.", 409);
  if (status === 400) {
    if (action === "verify") return badInput("El código no es válido o venció. Revisa tu correo e inténtalo de nuevo.");
    if (action === "reset") return badInput("El enlace o token no es válido o venció. Solicita uno nuevo.");
    return badInput();
  }
  return errorResponse("No pudimos conectar con Roble. Inténtalo más tarde.", 503);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return errorResponse("Este flujo está disponible solo en desarrollo.", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return errorResponse("Solicitud no permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return badInput("Solicitud inválida.");
  const bodyText = await request.text();
  if (bodyText.length > 4096) return badInput("Solicitud inválida.");
  let parsed: unknown;
  try { parsed = JSON.parse(bodyText); } catch { return badInput("Solicitud inválida."); }
  const body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  const action = field(body, "action") as Action;
  if (!["register", "verify", "resend", "recover", "reset"].includes(action)) return badInput("Solicitud inválida.");

  const email = normalizeEmail(field(body, "email"));
  const name = field(body, "name").trim();
  const career = field(body, "career").trim();
  const password = field(body, "password");
  const code = field(body, "code").trim();
  const token = field(body, "token").trim();
  const newPassword = field(body, "newPassword");
  if (action === "register" && (!institutionalEmail(email) || name.length < 2 || name.length > 100 || career.length > 100 || !validPassword(password))) {
    return badInput("Usa un correo institucional y una contraseña que cumpla los requisitos.");
  }
  if ((action === "verify" || action === "resend") && !institutionalEmail(email)) return badInput("Escribe tu correo institucional.");
  if (action === "verify" && !/^\d{6}$/.test(code)) return badInput("Escribe los seis dígitos del código.");
  if (action === "recover" && !validEmail(email)) return badInput("Escribe un correo válido.");
  if (action === "reset" && (!token || token.length > 2048 || !validPassword(newPassword))) return badInput("Revisa el token y los requisitos de la nueva contraseña.");

  try {
    const config = authConfig();
    if (action === "register") await beginRegistration(config, { email, password, name, career });
    if (action === "verify") await verifyRegistration(config, email, code);
    if (action === "resend") await resendVerification(config, email);
    if (action === "recover") await requestPasswordRecovery(config, email);
    if (action === "reset") await completePasswordRecovery(config, token, newPassword);
    return NextResponse.json({ ok: true }, { status: action === "verify" || action === "reset" ? 200 : 202, headers });
  } catch (error) { return failure(error, action); }
}
