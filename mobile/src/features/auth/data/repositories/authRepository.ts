import { RegisterArgs, IAuthRepository } from "../../domain/repositories/iAuthRepository";
import { IAuthenticationSource } from "../datasources/remote/iAuthenticationSource";

export class AuthRepository implements IAuthRepository {
  constructor(readonly authenticationSource: IAuthenticationSource) {}

  login(email: string, password: string) {
    return this.authenticationSource.login(email, password);
  }
  registerWithVerification(args: RegisterArgs) {
    return this.authenticationSource.registerWithVerification(args);
  }
  verifyEmail(email: string, code: string) {
    return this.authenticationSource.verifyEmail(email, code);
  }
  resendCode(email: string) {
    return this.authenticationSource.resendCode(email);
  }
  isMicrosoftEnabled() {
    return this.authenticationSource.isMicrosoftEnabled();
  }
  signInWithMicrosoft() {
    return this.authenticationSource.signInWithMicrosoft();
  }
  get isLoggedIn() {
    return this.authenticationSource.isLoggedIn;
  }
  restoreSession() {
    return this.authenticationSource.restoreSession();
  }
  currentUser() {
    return this.authenticationSource.currentUser();
  }
  logOut() {
    return this.authenticationSource.logOut();
  }
  forgotPassword(email: string) {
    return this.authenticationSource.forgotPassword(email);
  }
  resetPassword(token: string, newPassword: string) {
    return this.authenticationSource.resetPassword(token, newPassword);
  }
}
