// Equivalente de core/utils/error_message.dart: convierte una excepción en un
// mensaje seguro para mostrar (nunca el texto crudo de Roble).
import { AppFailure } from "../errors/appFailure";
import { StateError } from "../roble/robleClient";
import {
  RobleApiAuthException,
  RobleApiConflictException,
  RobleApiException,
  RobleApiForbiddenException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiNotFoundException,
  RobleApiTimeoutException,
} from "../roble/sdk/robleExceptions";

export function errorMessage(error: unknown, { fallback }: { fallback?: string } = {}): string {
  if (error instanceof AppFailure) return error.toString();

  if (error instanceof RobleApiForbiddenException) return "Tu cuenta no tiene permiso para hacer esto.";
  if (error instanceof RobleApiNotFoundException) return "No encontramos lo que buscas, o ya no es tuyo.";
  if (error instanceof RobleApiConflictException) {
    return "Ya existe una cuenta con ese correo. Inicia sesion con el metodo con el que la creaste.";
  }
  if (error instanceof RobleApiHttpException) {
    if (error.statusCode === 401) return "Correo o contrasena incorrectos.";
    if (error.statusCode >= 400 && error.statusCode < 500) {
      const message = unwrap(error.message);
      if (message.length > 0) return message;
    }
    return "Roble no pudo procesar la solicitud. Intenta de nuevo.";
  }
  if (error instanceof RobleApiAuthException) {
    return (
      "No se pudo completar el inicio de sesion (sesion expirada, " +
      "ventana bloqueada o cancelada). Vuelve a intentarlo."
    );
  }
  if (error instanceof RobleApiTimeoutException) return "Roble tardo demasiado en responder. Intenta de nuevo.";
  if (error instanceof RobleApiNetworkException) return "No pudimos contactar Roble. Revisa tu conexion.";
  if (error instanceof RobleApiException) return error.message;
  if (error instanceof StateError) return error.message;

  return fallback ?? "Ocurrio un error inesperado. Intenta de nuevo.";
}

/** Roble a veces reporta errores como un arreglo JSON (`[msg]`): sólo el texto. */
function unwrap(message: string): string {
  const text = message.trim();
  if (text.startsWith("[") && text.endsWith("]")) return text.substring(1, text.length - 1).trim();
  return text;
}
