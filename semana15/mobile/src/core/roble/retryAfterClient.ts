// Equivalente de core/roble/retry_after_client.dart: envuelve el `fetch` que
// recibe el cliente de Roble para recordar el `Retry-After` del último 429,
// que el SDK no expone.
import { FetchFn } from "./sdk/RobleApiDataBase";

export class RetryAfterClient {
  private lastRetryAfterMs: number | null = null;

  constructor(private readonly inner: FetchFn = (input, init) => fetch(input, init)) {}

  takeRetryAfter(): number | null {
    const value = this.lastRetryAfterMs;
    this.lastRetryAfterMs = null;
    return value;
  }

  readonly send: FetchFn = async (input, init) => {
    const response = await this.inner(input, init);
    if (response.status === 429) {
      this.lastRetryAfterMs = RetryAfterClient.parse(response.headers.get("retry-after"));
    }
    return response;
  };

  /** Segundos del header → milisegundos (null si no es un entero positivo). */
  static parse(header: string | null | undefined): number | null {
    const seconds = Number.parseInt((header ?? "").trim(), 10);
    if (!Number.isFinite(seconds) || seconds <= 0 || String(seconds) !== (header ?? "").trim()) return null;
    return seconds * 1000;
  }
}
