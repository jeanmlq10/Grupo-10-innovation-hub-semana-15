import assert from "node:assert/strict";
import test from "node:test";
import { addComment, decideRequest, initialState, requestParticipation, setActor, setTaskStatus } from "../src/lib/projects/demo-domain.ts";
import { initialProfiles, saveNotifications, savePrivacy, saveProfile, trajectory, visibleProfile } from "../src/lib/profile/demo-domain.ts";

const time = "2026-11-08T12:00:00.000Z";
test("only the owner edits a profile and names stay unique", () => {
  const a = initialProfiles.profiles["demo-a"];
  assert.throws(() => saveProfile(initialProfiles, "demo-b", "demo-a", a, time), /Solo puedes/);
  assert.throws(() => saveProfile(initialProfiles, "demo-a", "demo-a", { ...a, username: "cuenta_b" }, time), /ya está en uso/);
  const changed = saveProfile(initialProfiles, "demo-a", "demo-a", { ...a, name: "Ana Demo", username: "ana_demo", bio: "Trabajo en educación" }, time);
  assert.equal(changed.profiles["demo-a"].name, "Ana Demo");
  assert.equal(changed.profiles["demo-b"].name, initialProfiles.profiles["demo-b"].name);
});
test("private profile and activity rules hide data from the other account", () => {
  const privateState = savePrivacy(initialProfiles, "demo-a", "demo-a", { visibility: "private", contact: "nobody", activityVisibility: "onlyMe" }, time);
  assert.equal(visibleProfile(privateState, "demo-b", "demo-a"), null);
  assert.ok(visibleProfile(privateState, "demo-a", "demo-a"));
  const publicState = savePrivacy(privateState, "demo-a", "demo-a", { visibility: "public", contact: "nobody", activityVisibility: "onlyMe" }, time);
  const result = visibleProfile(publicState, "demo-b", "demo-a");
  assert.equal(result?.activityVisibility, "onlyMe");
  assert.equal("email" in (result ?? {}), false);
  assert.equal("mutedNotifications" in (result ?? {}), false);
});
test("notification settings belong to one account", () => {
  const changed = saveNotifications(initialProfiles, "demo-a", "demo-a", false, ["messages", "comments"], time);
  assert.equal(changed.profiles["demo-a"].notificationsEnabled, false);
  assert.deepEqual(changed.profiles["demo-a"].mutedNotifications, ["messages", "comments"]);
  assert.equal(changed.profiles["demo-b"].notificationsEnabled, true);
  assert.throws(() => saveNotifications(changed, "demo-b", "demo-a", true, [], time), /Solo puedes/);
});
test("trajectory changes when a task request is accepted and completed", () => {
  const requested = requestParticipation(setActor(initialState, "demo-b"), "eco-campus", "task", "task-eco-1", "", "request-1", time);
  const accepted = decideRequest(setActor(requested, "demo-a"), "eco-campus", "request-1", "accepted");
  const commented = addComment(setActor(accepted, "demo-b"), "eco-campus", "Puedo ayudar", "comment-1", time);
  const before = trajectory(commented, "demo-b");
  assert.equal(before.tasksAssigned, 1);
  assert.equal(before.tasksCompleted, 0);
  assert.equal(before.participations, 1);
  assert.equal(before.comments, 1);
  const complete = setTaskStatus(setActor(commented, "demo-a"), "eco-campus", "task-eco-1", "completed");
  const after = trajectory(complete, "demo-b");
  assert.equal(after.tasksCompleted, 1);
  assert.equal(after.fulfillment, 1);
  assert.equal(after.projectsCompleted, 0);
});
