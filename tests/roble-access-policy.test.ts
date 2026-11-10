import assert from "node:assert/strict";
import test from "node:test";
import {
  canChangeProject, canDecideParticipationRequest, canMarkNotificationRead,
  canReadNotification, canReadParticipationRequest, canReadProject, canReadProjectChild,
} from "../src/lib/roble/access-policy.ts";

const published = { _id: "project-a", _owner: "user-a", isDraft: false, audience: "Toda la comunidad" } as const;
const draft = { ...published, isDraft: true } as const;
const privateProject = { ...published, audience: "Solo yo" } as const;
const request = { _id: "request-b", projectId: published._id, applicantUserId: "user-b", status: "pending" } as const;

test("public catalog exposes only published community projects and their related tasks", () => {
  assert.equal(canReadProject(null, published), true);
  assert.equal(canReadProject("user-b", published), true);
  assert.equal(canReadProject(null, draft), false);
  assert.equal(canReadProject("user-b", draft), false);
  assert.equal(canReadProject(null, privateProject), false);
  assert.equal(canReadProject("user-b", privateProject), false);
  assert.equal(canReadProject("user-a", draft), true);
  assert.equal(canReadProjectChild(null, { projectId: draft._id }, draft), false);
  assert.equal(canReadProjectChild(null, { projectId: published._id }, published), true);
  assert.equal(canReadProjectChild("user-a", { projectId: "another-project" }, published), false);
});

test("only the project creator can change a project or decide a matching pending request", () => {
  assert.equal(canChangeProject("user-a", draft), true);
  assert.equal(canChangeProject("user-b", published), false);
  assert.equal(canChangeProject(null, published), false);
  assert.equal(canDecideParticipationRequest("user-a", request, published), true);
  assert.equal(canDecideParticipationRequest("user-b", request, published), false);
  assert.equal(canDecideParticipationRequest("user-a", { ...request, projectId: "other" }, published), false);
  assert.equal(canDecideParticipationRequest("user-a", { ...request, status: "accepted" }, published), false);
});

test("request data is limited to the applicant and project creator", () => {
  assert.equal(canReadParticipationRequest("user-a", request, published), true);
  assert.equal(canReadParticipationRequest("user-b", request, published), true);
  assert.equal(canReadParticipationRequest("user-c", request, published), false);
  assert.equal(canReadParticipationRequest(null, request, published), false);
  assert.equal(canReadParticipationRequest("user-a", { ...request, projectId: "other" }, published), false);
});

test("notification recipient can read and mark it, including when someone else created it", () => {
  const notification = { recipientUserId: "user-b" };
  assert.equal(canReadNotification("user-b", notification), true);
  assert.equal(canMarkNotificationRead("user-b", notification), true);
  assert.equal(canReadNotification("user-a", notification), false);
  assert.equal(canMarkNotificationRead("user-a", notification), false);
  assert.equal(canReadNotification(null, notification), false);
  assert.equal(canReadNotification("user-b", { recipientUserId: null }), false);
});
