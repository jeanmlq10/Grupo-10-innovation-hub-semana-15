import assert from "node:assert/strict";
import test from "node:test";
import { readProjectFiles } from "../src/lib/roble/project-files.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const project = { _id: "project-a", _owner: "owner-a", name: "Huerta", isDraft: false, audience: "Toda la comunidad", imageFileId: "cover-a" };
const attachments = [
  { _id: "doc-a", projectId: "project-a", kind: "document", fileId: "file-a", fileName: "Plan.pdf", sizeBytes: 1024 },
  { _id: "doc-other", projectId: "project-b", kind: "document", fileId: "file-b", fileName: "Privado.pdf" },
];

test("published cover is visible but documents require creator or verified team membership", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    calls.push(url.pathname + url.search);
    if (url.pathname.endsWith("/read")) {
      const table = url.searchParams.get("tableName");
      return Response.json(table === "projects" ? [project] : table === "project_members" ? [{ projectId: "project-a", userId: "member-a", _owner: "owner-a" }] : attachments);
    }
    return Response.json({ downloadUrl: `https://files.example/${url.pathname.split("/").at(-1)}` });
  };
  try {
    const stranger = await readProjectFiles(config, "token", "stranger", "project-a");
    assert.equal(stranger?.imageUrl, "https://files.example/cover-a");
    assert.equal(stranger?.documentsVisible, false);
    assert.equal(stranger?.documents.length, 0);
    assert.equal(calls.some(call => call.includes("project_attachments")), false);

    const member = await readProjectFiles(config, "token", "member-a", "project-a");
    assert.equal(member?.documentsVisible, true);
    assert.deepEqual(member?.documents.map(file => file.name), ["Plan.pdf"]);
    assert.equal(calls.some(call => call.endsWith("/file-b")), false);
  } finally { globalThis.fetch = original; }
});

test("private project blocks foreign viewer before reading files", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json([{ ...project, isDraft: true, audience: "Solo yo" }]); };
  try {
    assert.equal(await readProjectFiles(config, "token", "stranger", "project-a"), null);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
