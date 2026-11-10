import assert from "node:assert/strict";
import test from "node:test";
import { addProjectComment, projectCommentsFromRows, setProjectFollow } from "../src/lib/roble/project-social.ts";
import { ProjectWriteFailure } from "../src/lib/roble/project-write.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const identity = { userId: "user-a", name: "Ana", email: "a@example.com" };

test("comments expose only the verified author and published projects accept writes", async () => {
  const original = globalThis.fetch;
  const project = { _id: "project-a", _owner: "creator", name: "Huerta", isDraft: false, audience: "Toda la comunidad" };
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/read")) {
      const table = url.searchParams.get("tableName");
      return Response.json(table === "projects" ? [project] : []);
    }
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    writes.push(body);
    return Response.json({ _id: "created" });
  };
  try {
    const comments = projectCommentsFromRows([
      { _id: "safe", projectId: "project-a", _owner: "user-a", authorUserId: "user-a", text: "Hola" },
      { _id: "spoofed", projectId: "project-a", _owner: "user-b", authorUserId: "user-a", text: "Falso" },
    ], "project-a");
    assert.deepEqual(comments.map(item => item.text), ["Hola"]);
    await addProjectComment(config, "token", identity, "project-a", { text: "Qué buena idea", authorUserId: "attacker" });
    assert.equal((writes[0].record as Record<string, unknown>).authorUserId, "user-a");
    await setProjectFollow(config, "token", identity, "project-a", true);
    assert.equal((writes[1].record as Record<string, unknown>).userId, "user-a");
    project.isDraft = true;
    await assert.rejects(() => addProjectComment(config, "token", identity, "project-a", { text: "No" }),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 404);
  } finally { globalThis.fetch = original; }
});
