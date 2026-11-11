import { AuthenticationUser } from "../../../domain/models/authenticationUser";
import { RegisterArgs } from "../../../domain/repositories/iAuthRepository";

export interface IAuthenticationSource {
  login(email: string, password: string): Promise<AuthenticationUser>;
  registerWithVerification(args: RegisterArgs): Promise<void>;
  verifyEmail(email: string, code: string): Promise<void>;
  resendCode(email: string): Promise<void>;
  isMicrosoftEnabled(): Promise<boolean>;
  signInWithMicrosoft(): Promise<AuthenticationUser>;
  readonly isLoggedIn: boolean;
  restoreSession(): Promise<boolean>;
  currentUser(): Promise<AuthenticationUser | null>;
  logOut(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
