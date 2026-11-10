/**
 * Authorization rules for a future server-side data gateway shared by web and mobile.
 * actorId must come from a verified Roble session, never from request parameters.
 * Applicant and recipient IDs must be set by the gateway after authorizing the action,
 * not copied from untrusted client input.
 * These functions do not protect direct calls to Roble while its user role has broad permissions.
 */
export type ActorId = string | null;

export type ProjectAccessRow = {
  _id: string;
  _owner: string | null;
  isDraft: boolean | "true" | "false" | null;
  audience: string | null;
};

export type ProjectChildAccessRow = { projectId: string };
export type ParticipationRequestAccessRow = ProjectChildAccessRow & {
  _id: string;
  applicantUserId: string | null;
  status: string | null;
};
export type NotificationAccessRow = { recipientUserId: string | null };

function validId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function ownsProject(actorId: ActorId, project: ProjectAccessRow): boolean {
  return validId(actorId) && validId(project._owner) && actorId === project._owner;
}

export function canReadProject(actorId: ActorId, project: ProjectAccessRow): boolean {
  if (!validId(project._id)) return false;
  if (ownsProject(actorId, project)) return true;
  return (project.isDraft === false || project.isDraft === "false") && project.audience === "Toda la comunidad";
}

export function canChangeProject(actorId: ActorId, project: ProjectAccessRow): boolean {
  return validId(project._id) && ownsProject(actorId, project);
}

export function canReadProjectChild(actorId: ActorId, child: ProjectChildAccessRow, project: ProjectAccessRow | null): boolean {
  return project !== null && validId(child.projectId) && child.projectId === project._id && canReadProject(actorId, project);
}

export function canReadParticipationRequest(actorId: ActorId, request: ParticipationRequestAccessRow, project: ProjectAccessRow | null): boolean {
  if (!validId(actorId) || !validId(request._id) || !project || !validId(project._id) || request.projectId !== project._id) return false;
  return actorId === request.applicantUserId || ownsProject(actorId, project);
}

export function canDecideParticipationRequest(actorId: ActorId, request: ParticipationRequestAccessRow, project: ProjectAccessRow | null): boolean {
  return project !== null && validId(request._id) && request.projectId === project._id && request.status === "pending" && canChangeProject(actorId, project);
}

export function canReadNotification(actorId: ActorId, notification: NotificationAccessRow): boolean {
  return validId(actorId) && validId(notification.recipientUserId) && actorId === notification.recipientUserId;
}

export const canMarkNotificationRead = canReadNotification;
