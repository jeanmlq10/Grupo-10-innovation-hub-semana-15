import assert from "node:assert/strict";
import test from "node:test";
import { softDeleteOwnedProject, updateOwnedTaskStatus } from "../src/lib/roble/project-actions.ts";
import { ProjectWriteFailure } from "../src/lib/roble/project-write.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const owner = { userId: "user-a", name: "Ana", email: "a@example.com" };
const other = { userId: "user-b", name: "Beto", email: "b@example.com" };
const project = { _id: "project-a", _owner: "user-a", name: "Huerta" };
const task = { _id: "task-a", _owner: "user-a", projectId: "project-a", title: "Sembrar" };

test("task progress and soft deletion write only after verifying ownership", async () => {
  const original = globalThis.fetch;
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    if (url.pathname.endsWith("/read")) return Response.json(url.searchParams.get("tableName") === "projects" ? [project] : [task]);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    writes.push(body);
    return Response.json({});
  };
  try {
    await updateOwnedTaskStatus(config, "token", owner, "project-a", "task-a", "completed");
    await softDeleteOwnedProject(config, "token", owner, "project-a");
    assert.deepEqual(writes.map(item => item.tableName), ["project_tasks", "projects"]);
    assert.deepEqual(writes[0].updates, { status: "completed" });
    assert.equal((writes[1].updates as Record<string, unknown>).audience, "Solo yo");
    assert.equal((writes[1].updates as Record<string, unknown>).isDraft, true);
    await assert.rejects(() => updateOwnedTaskStatus(config, "token", other, "project-a", "task-a", "completed"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    await assert.rejects(() => softDeleteOwnedProject(config, "token", other, "project-a"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    assert.equal(writes.length, 2);
  } finally { globalThis.fetch = original; }
});

test("a task from another project and an invalid state never write", async () => {
  const original = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/read")) return Response.json(url.searchParams.get("tableName") === "projects" ? [project] : [{ ...task, projectId: "project-b" }]);
    writes++;
    return Response.json({});
  };
  try {
    await assert.rejects(() => updateOwnedTaskStatus(config, "token", owner, "project-a", "task-a", "completed"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
    await assert.rejects(() => updateOwnedTaskStatus(config, "token", owner, "project-a", "task-a", "deleted"),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 400);
    assert.equal(writes, 0);
  } finally { globalThis.fetch = original; }
});
