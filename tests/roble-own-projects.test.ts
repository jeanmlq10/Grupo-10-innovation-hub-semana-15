import assert from "node:assert/strict";
import test from "node:test";
import { ownProjectsFromResponse, readOwnProjects, RobleProjectReadFailure } from "../src/lib/roble/own-projects.ts";

const rows = { data: [
  { _id: "own-public", _owner: "user-a", name: "Huerta", description: "Proyecto", categories: ["Ambiente"], isDraft: false, audience: "Toda la comunidad", createdAt: "2026-11-09", applicantEmail: "private@example.com" },
  { _id: "own-draft", _owner: "user-a", name: "Idea privada", isDraft: true, audience: "Solo yo" },
  { _id: "foreign-draft", _owner: "user-b", name: "Secreto ajeno", isDraft: true, audience: "Solo yo" },
  { _id: "unowned", name: "Sin dueño", isDraft: false, audience: "Toda la comunidad" },
  { _id: "deleted", _owner: "user-a", name: "Borrado en móvil", deletedAt: "2026-11-10T12:00:00Z" },
] };

test("owned project response omits foreign rows and private backend fields", () => {
  const projects = ownProjectsFromResponse(rows, "user-a");
  assert.deepEqual(projects, [
    { id: "own-public", name: "Huerta", description: "Proyecto", categories: ["Ambiente"], isDraft: false, audience: "Toda la comunidad", createdAt: "2026-11-09" },
    { id: "own-draft", name: "Idea privada", description: "", categories: [], isDraft: true, audience: "Solo yo", createdAt: "" },
  ]);
  assert.equal(JSON.stringify(projects).includes("applicantEmail"), false);
  assert.equal(JSON.stringify(projects).includes("Secreto ajeno"), false);
  assert.throws(() => ownProjectsFromResponse(rows, ""), RobleProjectReadFailure);
  assert.throws(() => ownProjectsFromResponse({ data: {} }, "user-a"), RobleProjectReadFailure);
});

test("Roble read requests only the current owner and still filters a broad API response", async () => {
  const original = globalThis.fetch;
  let requestedUrl = "", authorization = "", cache = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    cache = init?.cache ?? "";
    return Response.json(rows);
  };
  try {
    const result = await readOwnProjects({ baseUrl: "https://roble.example", contractId: "contract" }, "token", "user-a");
    assert.equal(result.length, 2);
    assert.equal(new URL(requestedUrl).searchParams.get("_owner"), "user-a");
    assert.equal(new URL(requestedUrl).searchParams.get("tableName"), "projects");
    assert.equal(authorization, "Bearer token");
    assert.equal(cache, "no-store");
  } finally { globalThis.fetch = original; }
});
