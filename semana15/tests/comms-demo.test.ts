import assert from "node:assert/strict";
import test from "node:test";
import { addComment, decideRequest, initialState, requestParticipation, setActor, setTaskStatus } from "../src/lib/projects/demo-domain.ts";
import { initialProfiles, saveNotifications, savePrivacy } from "../src/lib/profile/demo-domain.ts";
import { conversations, initialComms, markNotificationsRead, markThreadRead, notificationsFor, sendMessage, thread } from "../src/lib/comms/demo-domain.ts";

const first = "2026-11-08T12:00:00.000Z", second = "2026-11-08T13:00:00.000Z";
test("messages form separate A/B conversations and reading a thread clears only its unread items", () => {
  const sent = sendMessage(initialComms, initialProfiles, "demo-a", "demo-b", " Hola B ", "m1", first);
  assert.equal(thread(sent, "demo-a", "demo-b")[0].text, "Hola B");
  assert.equal(conversations(sent, "demo-b", initialProfiles)[0].unreadCount, 1);
  assert.equal(conversations(sent, "demo-a", initialProfiles)[0].unreadCount, 0);
  const read = markThreadRead(sent, "demo-b", "demo-a");
  assert.equal(conversations(read, "demo-b", initialProfiles)[0].unreadCount, 0);
  assert.deepEqual(read.readNotificationIds["demo-b"], ["message:m1"]);
  assert.deepEqual(read.readNotificationIds["demo-a"], []);
  assert.throws(() => sendMessage(read, initialProfiles, "demo-a", "demo-a", "Hola", "m2", second), /a ti mismo/);
});
test("contact privacy prevents a new message while preserving the conversation", () => {
  const sent = sendMessage(initialComms, initialProfiles, "demo-a", "demo-b", "Antes", "m1", first);
  const privateProfiles = savePrivacy(initialProfiles, "demo-b", "demo-b", { visibility: "public", contact: "nobody", activityVisibility: "everyone" }, second);
  assert.throws(() => sendMessage(sent, privateProfiles, "demo-a", "demo-b", "Después", "m2", second), /no recibe mensajes/);
  assert.equal(thread(sent, "demo-b", "demo-a").length, 1);
});
test("project and message actions notify only recipients; preferences and read state apply per account", () => {
  const requested = requestParticipation(setActor(initialState, "demo-b"), "eco-campus", "task", "task-eco-1", "", "r1", first);
  const commented = addComment(requested, "eco-campus", "Me interesa", "c1", first);
  const accepted = decideRequest(setActor(commented, "demo-a"), "eco-campus", "r1", "accepted", second);
  const completed = setTaskStatus(accepted, "eco-campus", "task-eco-1", "completed", second);
  const comms = sendMessage(initialComms, initialProfiles, "demo-b", "demo-a", "Hola", "m1", second);
  const forA = notificationsFor(completed, comms, initialProfiles, "demo-a");
  const forB = notificationsFor(completed, comms, initialProfiles, "demo-b");
  assert.deepEqual(new Set(forA.map(item => item.id)), new Set(["request:r1", "comment:c1", "message:m1"]));
  assert.deepEqual(new Set(forB.map(item => item.id)), new Set(["decision:r1", "task:task-eco-1:demo-b"]));
  const read = markNotificationsRead(comms, "demo-a", ["request:r1", "decision:r1"], [...forA, ...forB]);
  assert.deepEqual(read.readNotificationIds["demo-a"], ["request:r1"]);
  assert.deepEqual(read.readNotificationIds["demo-b"], []);
  const muted = saveNotifications(initialProfiles, "demo-a", "demo-a", true, ["participationRequests", "messages"], second);
  assert.deepEqual(notificationsFor(completed, comms, muted, "demo-a").map(item => item.id), ["comment:c1"]);
  const off = saveNotifications(muted, "demo-a", "demo-a", false, [], second);
  assert.equal(notificationsFor(completed, comms, off, "demo-a").length, 0);
});
