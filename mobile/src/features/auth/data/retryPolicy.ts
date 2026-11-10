import {
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiTimeoutException,
} from "@/src/core/roble/sdk/robleExceptions";

/** Bounded retry with progressive backoff, for *transient* failures only. */
export class RetryPolicy {
  constructor(
    readonly maxRetries = 2,
    readonly baseDelayMs = 1000,
    readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  static isTransient(error: unknown): boolean {
    if (error instanceof RobleApiNetworkException) return true;
    if (error instanceof RobleApiTimeoutException) return true;
    if (error instanceof RobleApiHttpException) {
      return error.statusCode === 502 || error.statusCode === 503 || error.statusCode === 504;
    }
    return false;
  }

  async run<T>(action: () => Promise<T>): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        return await action();
      } catch (error) {
        if (attempt >= this.maxRetries || !RetryPolicy.isTransient(error)) throw error;
        await this.sleep(this.baseDelayMs * (1 << attempt));
        attempt++;
      }
    }
  }
}
