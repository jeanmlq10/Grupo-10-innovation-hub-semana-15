// Equivalente de core/roble/roble_guard.dart: traduce las excepciones de Roble
// al Failure de cada feature.
import { StateError } from "./robleClient";
import { RobleApiException, RobleApiHttpException } from "./sdk/robleExceptions";

export async function robleGuard<T>(
  action: () => Promise<T>,
  failure: (message: string) => Error,
  { notFound }: { notFound?: string } = {},
): Promise<T> {
  try {
    return await action();
  } catch (e) {
    if (e instanceof RobleApiHttpException) {
      if (e.statusCode === 404 && notFound != null) throw failure(notFound);
      if (e.statusCode === 403) throw failure("Tu cuenta no tiene permiso para hacer esto.");
      throw failure(e.message.length === 0 ? "Roble no pudo procesar la solicitud." : e.message);
    }
    if (e instanceof RobleApiException) throw failure(e.message);
    if (e instanceof StateError) throw failure(e.message);
    throw e;
  }
}
