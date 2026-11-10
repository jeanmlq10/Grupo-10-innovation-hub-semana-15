import { UserProfile } from "../models/userProfile";

/** Perfiles de usuario (tabla `user_profiles`). */
export interface IProfileRepository {
  byUserId(userId: string): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<UserProfile>;
  delete(profile: UserProfile): Promise<void>;
}
