import assert from "node:assert/strict";
import test from "node:test";
import { decideRobleRequest, markRobleNotificationRead, submitRobleRequest } from "../src/lib/roble/participation-write.ts";
import { ProjectWriteFailure } from "../src/lib/roble/project-write.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const owner = { userId: "owner-a", name: "Creadora", email: "owner@example.com" };
const applicant = { userId: "user-b", name: "Estudiante", email: "student@example.com" };
const project = { _id: "project-a", _owner: owner.userId, name: "Huerta", isDraft: false,
  audience: "Toda la comunidad", teamRoles: { "Diseñador/a": 2 }, acceptedRoleCounts: { "Diseñador/a": 0 }, acceptedMembersCount: 0 };
const request = { _id: "request-a", _owner: applicant.userId, projectId: "project-a", type: "team",
  teamRoleId: "Diseñador/a", role: "Diseñador/a", applicantUserId: applicant.userId,
  applicantName: applicant.name, applicantEmail: applicant.email, status: "pending" };

function mockRows(data: Record<string, unknown[]>, onWrite: (table: string, endpoint: string, body: Record<string, unknown>) => Response) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    const endpoint = new URL(String(url)).pathname.split("/").at(-1)!;
    if (endpoint === "read") {
      const table = new URL(String(url)).searchParams.get("tableName") ?? "";
      return Response.json(data[table] ?? []);
    }
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return onWrite(String(body.tableName), endpoint, body);
  };
  return () => { globalThis.fetch = original; };
}

test("applicant creates a mobile-compatible team request and owner notification", async () => {
  const writes: { table: string; record: Record<string, unknown> }[] = [];
  const restore = mockRows({ projects: [project], project_requests: [] }, (table, endpoint, body) => {
    assert.equal(endpoint, "insert-one");
    writes.push({ table, record: body.record as Record<string, unknown> });
    return Response.json({ _id: table === "project_requests" ? "request-created" : "notification-created" });
  });
  try {
    const id = await submitRobleRequest(config, "token", applicant, "project-a", { type: "team", targetId: "Diseñador/a", message: "Quiero ayudar" });
    assert.equal(id, "request-created");
    assert.deepEqual(writes.map(item => item.table), ["project_requests", "app_notifications"]);
    assert.equal(writes[0].record.applicantUserId, applicant.userId);
    assert.equal(writes[0].record.teamRoleId, "Diseñador/a");
    assert.equal(writes[0].record._owner, undefined);
    assert.equal(writes[1].record.recipientUserId, owner.userId);
  } finally { restore(); }
});

test("a creator cannot apply, and another account cannot decide", async () => {
  let writes = 0;
  const restore = mockRows({ projects: [project], project_requests: [request] }, () => { writes++; return Response.json({ _id: "x" }); });
  try {
    await assert.rejects(() => submitRobleRequest(config, "token", owner, "project-a", { type: "team", targetId: "Diseñador/a" }),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 400);
    await assert.rejects(() => decideRobleRequest(config, "token", applicant, "project-a", "request-a", "accepted"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    assert.equal(writes, 0);
  } finally { restore(); }
});

test("task request uses the task id and rejects a full or private project", async () => {
  const task = { _id: "task-a", _owner: owner.userId, projectId: "project-a", title: "Diseñar pantalla",
    status: "available", requiredCount: 1, acceptedCount: 0 };
  const writes: Record<string, unknown>[] = [];
  const restore = mockRows({ projects: [project], project_tasks: [task], project_requests: [] }, (table, _endpoint, body) => {
    if (table === "project_requests") writes.push(body.record as Record<string, unknown>);
    return Response.json({ _id: `new-${table}` });
  });
  try {
    await submitRobleRequest(config, "token", applicant, "project-a", { type: "task", targetId: "task-a", message: "Puedo diseñarla" });
    assert.equal(writes[0].taskId, "task-a");
    assert.equal(writes[0].role, "Diseñar pantalla");
    task.acceptedCount = 1;
    await assert.rejects(() => submitRobleRequest(config, "token", applicant, "project-a", { type: "task", targetId: "task-a" }),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 409);
    project.isDraft = true;
    await assert.rejects(() => submitRobleRequest(config, "token", applicant, "project-a", { type: "team", targetId: "Diseñador/a" }),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
  } finally { project.isDraft = false; restore(); }
});

test("a published project with applications closed rejects both role and task requests", async () => {
  const closed = { ...project, canApply: false };
  let writes = 0;
  const restore = mockRows({ projects: [closed] }, () => { writes++; return Response.json({ _id: "x" }); });
  try {
    for (const type of ["team", "task"]) {
      await assert.rejects(() => submitRobleRequest(config, "token", applicant, "project-a", { type, targetId: "Diseñador/a" }),
        (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    }
    assert.equal(writes, 0);
  } finally { restore(); }
});

test("owner acceptance creates a member, updates counts, then records the decision", async () => {
  const members: Record<string, unknown>[] = [];
  const writes: string[] = [];
  const restore = mockRows({ projects: [project], project_requests: [request], request_decisions: [], project_members: members }, (table, endpoint, body) => {
    writes.push(`${table}:${endpoint}`);
    if (table === "project_members") members.push({ ...(body.record as Record<string, unknown>), _id: "member-a", _owner: owner.userId });
    if (table === "projects") {
      const updates = body.updates as Record<string, unknown>;
      assert.equal(updates.acceptedMembersCount, 1);
      assert.deepEqual(updates.acceptedRoleCounts, { "Diseñador/a": 1 });
    }
    return Response.json({ _id: `new-${table}` });
  });
  try {
    await decideRobleRequest(config, "token", owner, "project-a", "request-a", "accepted");
    assert.deepEqual(writes, ["project_members:insert-one", "projects:update", "request_decisions:insert-one", "app_notifications:insert-one"]);
  } finally { restore(); }
});

test("accepting a task updates its occupied cupo and the project member count", async () => {
  const task = { _id: "task-a", _owner: owner.userId, projectId: "project-a", title: "Diseñar pantalla",
    status: "available", requiredCount: 1, acceptedCount: 0 };
  const taskRequest = { ...request, type: "task", taskId: "task-a", teamRoleId: null, role: task.title };
  const members: Record<string, unknown>[] = [];
  const writes: string[] = [];
  const restore = mockRows({ projects: [project], project_requests: [taskRequest], request_decisions: [],
    project_members: members, project_tasks: [task] }, (table, endpoint, body) => {
    writes.push(`${table}:${endpoint}`);
    if (table === "project_members") members.push({ ...(body.record as Record<string, unknown>), _id: "member-a", _owner: owner.userId });
    if (table === "project_tasks") assert.deepEqual(body.updates, { acceptedCount: 1 });
    if (table === "projects") assert.deepEqual(body.updates, { acceptedMembersCount: 1 });
    return Response.json({ _id: `new-${table}` });
  });
  try {
    await decideRobleRequest(config, "token", owner, "project-a", "request-a", "accepted");
    assert.deepEqual(writes, ["project_members:insert-one", "project_tasks:update", "projects:update",
      "request_decisions:insert-one", "app_notifications:insert-one"]);
  } finally { restore(); }
});

test("a valid prior decision blocks duplicate acceptance", async () => {
  let writes = 0;
  const restore = mockRows({ projects: [project], project_requests: [request],
    request_decisions: [{ requestId: "request-a", _owner: owner.userId, status: "accepted", decidedAt: "2026-11-10" }] },
  () => { writes++; return Response.json({ _id: "x" }); });
  try {
    await assert.rejects(() => decideRobleRequest(config, "token", owner, "project-a", "request-a", "accepted"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 409);
    assert.equal(writes, 0);
  } finally { restore(); }
});

test("rejection records only a decision and a non-fatal notification", async () => {
  const writes: string[] = [];
  const restore = mockRows({ projects: [project], project_requests: [request], request_decisions: [] }, (table, _endpoint, body) => {
    writes.push(table);
    if (table === "request_decisions") assert.equal((body.record as Record<string, unknown>).status, "rejected");
    if (table === "app_notifications") return new Response("failed", { status: 503 });
    return Response.json({ _id: "decision-a" });
  });
  try {
    await decideRobleRequest(config, "token", owner, "project-a", "request-a", "rejected");
    assert.deepEqual(writes, ["request_decisions", "app_notifications"]);
  } finally { restore(); }
});

test("only the actual notification recipient can mark it read", async () => {
  const notice = { _id: "notice-a", _owner: owner.userId, recipientUserId: applicant.userId, read: false };
  const writes: Record<string, unknown>[] = [];
  const restore = mockRows({ app_notifications: [notice] }, (_table, endpoint, body) => {
    assert.equal(endpoint, "update"); writes.push(body); return Response.json({ updated: 1 });
  });
  try {
    await assert.rejects(() => markRobleNotificationRead(config, "token", owner, "notice-a"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    await markRobleNotificationRead(config, "token", applicant, "notice-a");
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0].updates, { read: true });
  } finally { restore(); }
});
