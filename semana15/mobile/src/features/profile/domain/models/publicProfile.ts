import { ActivityEntry } from "./activityEntry";
import { TrajectorySummary } from "./trajectorySummary";
import { UserProfile } from "./userProfile";

/** Lo que se puede ver del perfil de otra persona, ya filtrado por su privacidad. */
export class PublicProfile {
  readonly profile: UserProfile;
  readonly summary: TrajectorySummary | null;
  readonly activity: ActivityEntry[];
  readonly canSeeDetails: boolean;

  constructor(p: { profile: UserProfile; summary: TrajectorySummary | null; activity: ActivityEntry[]; canSeeDetails: boolean }) {
    this.profile = p.profile;
    this.summary = p.summary;
    this.activity = p.activity;
    this.canSeeDetails = p.canSeeDetails;
  }
}
