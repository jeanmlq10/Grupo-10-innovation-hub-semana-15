import { Controller } from "@/src/core/state/Controller";
import { errorMessage } from "@/src/core/utils/errorMessage";

import { AuthProviderUnavailableException, AuthRateLimitedException } from "../../domain/authExceptions";
import { AuthenticationUser } from "../../domain/models/authenticationUser";
import { PasswordPolicy } from "../../domain/passwordPolicy";
import { IAuthRepository } from "../../domain/repositories/iAuthRepository";

const SECOND = 1000;

/** Equivalente de AuthenticationController (GetX): sesión, registro, verificación y 429. */
export class AuthenticationController extends Controller {
  static readonly defaultRateLimitWaitMs = 60 * SECOND;
  static readonly maxRateLimitWaitMs = 15 * 60 * SECOND;
  private static readonly maxServerRetryAfterMs = 60 * 60 * SECOND;
  private static readonly resendCooldownMs = 30 * SECOND;

  private readonly _logged = this.obs(false);
  private readonly _loggedUser = this.obs<AuthenticationUser | null>(null);
  private readonly _isLoading = this.obs(false);
  private readonly _isRestoring = this.obs(true);
  private readonly _isGuest = this.obs(false);
  private readonly _pendingVerificationEmail = this.obs<string | null>(null);
  private readonly _microsoftEnabled = this.obs<boolean | null>(null);
  private readonly _retrySecondsLeft = this.obs(0);

  readonly error = this.obs("");

  private requestInFlight = false;
  private loadingProviders = false;
  private consecutiveRateLimits = 0;
  private resendBlockedUntil: number | null = null;
  private pendingPassword: string | null = null;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(readonly repoAuthentication: IAuthRepository) {
    super();
  }

  get isLoading() {
    return this._isLoading.value;
  }
  get isRestoring() {
    return this._isRestoring.value;
  }
  get isLogged() {
    return this._logged.value;
  }
  get isGuest() {
    return this._isGuest.value && !this._logged.value;
  }
  get canBrowse() {
    return this.isLogged || this.isGuest;
  }
  get loggedState() {
    return this._logged;
  }
  get loggedEmail() {
    return this._loggedUser.value?.email ?? "";
  }
  get loggedUser() {
    return this._loggedUser.value;
  }
  get pendingVerificationEmail() {
    return this._pendingVerificationEmail.value;
  }
  get microsoftEnabled() {
    return this._microsoftEnabled.value;
  }
  get isBlocked() {
    return this._retrySecondsLeft.value > 0;
  }
  get retrySecondsLeft() {
    return this._retrySecondsLeft.value;
  }
  get isBusy() {
    return this.isLoading || this.isBlocked;
  }

  protected onInit() {
    this._logged.listen((logged) => {
      if (logged) this._isGuest.value = false;
    });
    void this.restoreSession();
  }

  continueAsGuest() {
    if (this._logged.value) return;
    this.error.value = "";
    this._isGuest.value = true;
  }

  leaveGuestMode() {
    this._isGuest.value = false;
  }

  onClose() {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  private async restoreSession() {
    this._isRestoring.value = true;
    try {
      this._logged.value = await this.repoAuthentication.restoreSession();
      this._loggedUser.value = this._logged.value ? await this.repoAuthentication.currentUser() : null;
    } catch (exception) {
      if (exception instanceof AuthRateLimitedException) {
        this._logged.value = false;
        this._loggedUser.value = null;
        this.startCooldown(exception.retryAfterMs);
      } else {
        console.warn(`AuthenticationController: Could not restore session: ${exception}`);
        this._logged.value = false;
        this._loggedUser.value = null;
      }
    } finally {
      this._isRestoring.value = false;
    }
  }

  private async guarded(action: () => Promise<boolean>): Promise<boolean> {
    if (this.requestInFlight) return false;
    if (this.isBlocked) {
      this.error.value = this.blockedMessage();
      return false;
    }
    this.requestInFlight = true;
    this._isLoading.value = true;
    this.error.value = "";
    try {
      const ok = await action();
      if (ok) this.consecutiveRateLimits = 0;
      return ok;
    } catch (exception) {
      if (exception instanceof AuthRateLimitedException) {
        console.warn("AuthenticationController: rate limited by Roble");
        this.startCooldown(exception.retryAfterMs);
        return false;
      }
      console.error(`AuthenticationController: request failed: ${exception}`);
      this.error.value = errorMessage(exception);
      return false;
    } finally {
      this.requestInFlight = false;
      this._isLoading.value = false;
    }
  }

  static rateLimitBackoffMs(consecutive: number): number {
    const steps = consecutive < 1 ? 0 : consecutive - 1;
    if (steps > 4) return AuthenticationController.maxRateLimitWaitMs;
    const backoff = AuthenticationController.defaultRateLimitWaitMs * (1 << steps);
    return backoff > AuthenticationController.maxRateLimitWaitMs ? AuthenticationController.maxRateLimitWaitMs : backoff;
  }

  private startCooldown(serverRetryAfterMs: number | null) {
    this.consecutiveRateLimits++;
    let wait: number;
    if (serverRetryAfterMs != null) {
      wait =
        serverRetryAfterMs > AuthenticationController.maxServerRetryAfterMs
          ? AuthenticationController.maxServerRetryAfterMs
          : serverRetryAfterMs;
    } else {
      wait = AuthenticationController.rateLimitBackoffMs(this.consecutiveRateLimits);
    }
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    const seconds = Math.trunc(wait / 1000);
    this._retrySecondsLeft.value = seconds < 1 ? 1 : seconds;
    this.error.value = this.blockedMessage();
    this.cooldownTimer = setInterval(() => {
      this._retrySecondsLeft.value = this._retrySecondsLeft.value - 1;
      if (this._retrySecondsLeft.value <= 0) {
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
        this._retrySecondsLeft.value = 0;
        this.error.value = "";
      } else {
        this.error.value = this.blockedMessage();
      }
    }, 1000);
  }

  private blockedMessage() {
    return `Demasiados intentos. Espera ${this._retrySecondsLeft.value} s antes de volver a intentarlo.`;
  }

  login(email: string, password: string): Promise<boolean> {
    if (!AuthenticationController.validEmail(email) || password.length === 0) {
      this.error.value = "Ingresa un correo valido y tu contrasena.";
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      this._loggedUser.value = await this.repoAuthentication.login(AuthenticationController.normalizeEmail(email), password);
      this._logged.value = true;
      return true;
    });
  }

  async loadProviders() {
    if (this._microsoftEnabled.value != null || this.loadingProviders) return;
    this.loadingProviders = true;
    try {
      this._microsoftEnabled.value = await this.repoAuthentication.isMicrosoftEnabled();
    } catch (exception) {
      if (exception instanceof AuthRateLimitedException) {
        this.startCooldown(exception.retryAfterMs);
      } else {
        console.warn("AuthenticationController: could not list providers");
      }
    } finally {
      this.loadingProviders = false;
    }
  }

  signInWithMicrosoft(): Promise<boolean> {
    if (this._microsoftEnabled.value === false) {
      this.error.value = new AuthProviderUnavailableException("Microsoft").toString();
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      this._loggedUser.value = await this.repoAuthentication.signInWithMicrosoft();
      this._logged.value = true;
      return true;
    });
  }

  register({
    email,
    password,
    name,
    extra = {},
  }: {
    email: string;
    password: string;
    name: string;
    extra?: Record<string, unknown>;
  }): Promise<boolean> {
    const passwordProblem = PasswordPolicy.validate(password);
    if (!AuthenticationController.validEmail(email) || name.trim().length === 0) {
      this.error.value = "Completa tu nombre y un correo valido.";
      return Promise.resolve(false);
    }
    if (passwordProblem != null) {
      this.error.value = passwordProblem;
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      const normalized = AuthenticationController.normalizeEmail(email);
      await this.repoAuthentication.registerWithVerification({ email: normalized, password, name: name.trim(), extra });
      this._pendingVerificationEmail.value = normalized;
      this.pendingPassword = password;
      return true;
    });
  }

  verifyEmail(code: string): Promise<boolean> {
    const email = this._pendingVerificationEmail.value;
    if (email == null) {
      this.error.value = "No hay un registro pendiente de verificacion.";
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      await this.repoAuthentication.verifyEmail(email, code);
      this._pendingVerificationEmail.value = null;
      const password = this.pendingPassword;
      this.pendingPassword = null;
      if (password != null) {
        try {
          this._loggedUser.value = await this.repoAuthentication.login(email, password);
          this._logged.value = true;
        } catch (exception) {
          if (exception instanceof AuthRateLimitedException) {
            this.startCooldown(exception.retryAfterMs);
          } else {
            console.warn("AuthenticationController: auto sign-in failed");
          }
        }
      }
      return true;
    });
  }

  resendVerificationCode(): Promise<boolean> {
    const email = this._pendingVerificationEmail.value;
    if (email == null) return Promise.resolve(false);
    const until = this.resendBlockedUntil;
    if (until != null && Date.now() < until) {
      this.error.value = "Espera unos segundos antes de reenviar el codigo.";
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      await this.repoAuthentication.resendCode(email);
      this.resendBlockedUntil = Date.now() + AuthenticationController.resendCooldownMs;
      return true;
    });
  }

  forgotPassword(email: string): Promise<boolean> {
    if (!AuthenticationController.validEmail(email)) {
      this.error.value = "Ingresa un correo valido.";
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      await this.repoAuthentication.forgotPassword(AuthenticationController.normalizeEmail(email));
      return true;
    });
  }

  resetPassword(token: string, newPassword: string): Promise<boolean> {
    const problem = PasswordPolicy.validate(newPassword);
    if (problem != null) {
      this.error.value = problem;
      return Promise.resolve(false);
    }
    return this.guarded(async () => {
      await this.repoAuthentication.resetPassword(token, newPassword);
      return true;
    });
  }

  async logOut(): Promise<boolean> {
    this.error.value = "";
    this.pendingPassword = null;
    try {
      await this.repoAuthentication.logOut();
      return true;
    } catch (exception) {
      console.error(`AuthenticationController: Logout error ${exception}`);
      this.error.value = errorMessage(exception);
      return false;
    } finally {
      this._logged.value = false;
      this._loggedUser.value = null;
      this._isGuest.value = false;
    }
  }

  private static normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private static validEmail(email: string) {
    const value = email.trim();
    return value.includes("@") && !value.startsWith("@") && !value.endsWith("@");
  }
}
