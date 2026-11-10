/** Kinds of notification the app sends (column `type` of `app_notifications`). */
export const AppNotificationType = {
  newRequest: "new_request",
  taskApplication: "task_application",
  requestAccepted: "request_accepted",
  requestRejected: "request_rejected",
  taskApplicationAccepted: "task_application_accepted",
  taskApplicationRejected: "task_application_rejected",
  newComment: "new_comment",
  commentReply: "comment_reply",
  taskCompleted: "task_completed",
  newMessage: "new_message",
  memberJoined: "member_joined",
  taskAssigned: "task_assigned",
  taskReminder: "task_reminder",
  projectUpdate: "project_update",

  responses: new Set(["request_accepted", "request_rejected", "task_application_accepted", "task_application_rejected"]),
  decidable: new Set(["new_request", "task_application"]),
} as const;
