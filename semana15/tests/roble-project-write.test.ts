import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectWrite, ProjectWriteFailure, saveRobleProject } from "../src/lib/roble/project-write.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const identity = { userId: "user-a", email: "a@example.com", name: "Persona A" };
const input = parseProjectWrite({ name: "  Proyecto web  ", description: "Descripción", categories: ["Tecnología"],
  audience: "Toda la comunidad", duration: "Meses", teamRoles: { "Diseñador/a": 1 }, teamDeadline: "2026-12-01",
  tasks: [{ id: "new-task-1", title: "Diseñar", description: "Pantallas", requiredCount: 2, deadline: "" }], publish: true });

test("validates project input and never trusts an owner supplied by the browser", () => {
  assert.equal(input.name, "Proyecto web");
  assert.throws(() => parseProjectWrite({ ...input, name: "" }), ProjectWriteFailure);
  assert.throws(() => parseProjectWrite({ ...input, tasks: [{ ...input.tasks[0], requiredCount: -1 }] }), ProjectWriteFailure);
  assert.throws(() => parseProjectWrite({ ...input, description: "" }), ProjectWriteFailure);
});

test("creates as draft, creates tasks, then publishes under verified session", async () => {
  const original = globalThis.fetch;
  const writes: { endpoint: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = async (url, init) => {
    const endpoint = new URL(String(url)).pathname.split("/").at(-1)!;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    writes.push({ endpoint, body });
    if (endpoint === "insert-one") return Response.json({ _id: body.tableName === "projects" ? "project-a" : "task-a" });
    return Response.json({ updated: 1 });
  };
  try {
    assert.equal(await saveRobleProject(config, "token", identity, input), "project-a");
    assert.deepEqual(writes.map(write => write.endpoint), ["insert-one", "insert-one", "update"]);
    const first = writes[0].body.record as Record<string, unknown>;
    assert.equal(first.createdBy, "user-a");
    assert.equal(first._owner, undefined);
    assert.equal(first.isDraft, true);
    assert.equal((writes[1].body.record as Record<string, unknown>).projectId, "project-a");
    assert.equal((writes[2].body.updates as Record<string, unknown>).isDraft, false);
  } finally { globalThis.fetch = original; }
});

test("foreign project is rejected before any write even when Roble returns it", async () => {
  const original = globalThis.fetch;
  const methods: string[] = [];
  globalThis.fetch = async (_url, init) => {
    methods.push(init?.method ?? "GET");
    return Response.json([{ _id: "foreign", _owner: "user-b", name: "Privado" }]);
  };
  try {
    await assert.rejects(() => saveRobleProject(config, "token", identity, input, "foreign"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    assert.deepEqual(methods, ["GET"]);
  } finally { globalThis.fetch = original; }
});

test("editing preserves accepted counts and reports partial write with project id", async () => {
  const original = globalThis.fetch;
  const project = { _id: "project-a", _owner: "user-a", name: "Anterior", acceptedRoleCounts: JSON.stringify({ "Diseñador/a": 1 }), acceptedMembersCount: 1, isDraft: true };
  const task = { _id: "task-a", _owner: "user-a", projectId: "project-a", title: "Diseñar", requiredCount: 2, acceptedCount: 1, status: "in_progress" };
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (url, init) => {
    if ((init?.method ?? "GET") === "GET") return Response.json(new URL(String(url)).searchParams.get("tableName") === "projects" ? [project] : [task]);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    writes.push(body);
    if (body.tableName === "projects") return new Response("error", { status: 503 });
    return Response.json({ updated: 1 });
  };
  try {
    const edited = { ...input, tasks: [{ ...input.tasks[0], id: "task-a" }] };
    await assert.rejects(() => saveRobleProject(config, "token", identity, edited, "project-a"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.projectId === "project-a");
    assert.equal((writes[0].updates as Record<string, unknown>).acceptedCount, undefined);
    assert.deepEqual((writes[1].updates as Record<string, unknown>).acceptedRoleCounts, { "Diseñador/a": 1 });
    assert.equal((writes[1].updates as Record<string, unknown>).acceptedMembersCount, 1);
  } finally { globalThis.fetch = original; }
});
