import assert from "node:assert/strict";
import test from "node:test";
import { publishedProjectDetailFromRows, readPublishedProjectDetail, readPublishedProjects } from "../src/lib/roble/public-projects.ts";

const published = { _id: "project-public", _owner: "owner-a", name: "Huerta", description: "Cultivo urbano", categories: ["Ambiente"], isDraft: false, audience: "Toda la comunidad", teamRoles: { "Diseñador/a": 2 }, acceptedRoleCounts: { "Diseñador/a": 1 }, applicantEmail: "private@example.com" };
const draft = { _id: "project-draft", _owner: "owner-a", name: "Idea secreta", isDraft: true, audience: "Solo yo" };
const privatePublished = { _id: "project-private", _owner: "owner-a", name: "Solo yo", isDraft: false, audience: "Solo yo" };

test("published detail excludes unrelated tasks and private backend fields", () => {
  const detail = publishedProjectDetailFromRows(published, [
    { _id: "task-a", _owner: "owner-a", projectId: "project-public", title: "Diseñar", requiredCount: 2, acceptedCount: 1 },
    { _id: "task-b", projectId: "project-draft", title: "Secreta" },
    { _id: "task-c", _owner: "stranger", projectId: "project-public", title: "Falsa" },
    { _id: "task-d", projectId: "project-public", title: "Sin autor" },
    { _id: "task-private", _owner: "owner-a", projectId: "project-public", title: "Contenido interno", visibility: "team" },
  ]);
  assert.deepEqual(detail?.roles, [{ name: "Diseñador/a", needed: 2, accepted: 1 }]);
  assert.deepEqual(detail?.tasks.map(task => task.title), ["Diseñar"]);
  assert.equal(JSON.stringify(detail).includes("private@example.com"), false);
  assert.equal(JSON.stringify(detail).includes("Secreta"), false);
  assert.equal(publishedProjectDetailFromRows(draft, []), null);
  assert.equal(publishedProjectDetailFromRows(privatePublished, []), null);
  assert.equal(publishedProjectDetailFromRows({ ...published, deletedAt: "2026-11-10T12:00:00Z" }, []), null);
});

test("authenticated explore filters drafts and private projects even if API returns them", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("tableName"), "projects");
    assert.equal(url.searchParams.get("isDraft"), "false");
    assert.equal(url.searchParams.get("audience"), "Toda la comunidad");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    assert.equal(init?.cache, "no-store");
    return Response.json([published, draft, privatePublished]);
  };
  try {
    const result = await readPublishedProjects({ baseUrl: "https://roble.example", contractId: "contract" }, "token");
    assert.deepEqual(result.map(project => project.name), ["Huerta"]);
  } finally { globalThis.fetch = original; }
});

test("a draft URL stops before related table reads", async () => {
  const original = globalThis.fetch;
  const tables: string[] = [];
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    tables.push(url.searchParams.get("tableName") ?? "");
    return Response.json([draft]);
  };
  try {
    const result = await readPublishedProjectDetail({ baseUrl: "https://roble.example", contractId: "contract" }, "token", "project-draft");
    assert.equal(result, null);
    assert.deepEqual(tables, ["projects"]);
  } finally { globalThis.fetch = original; }
});
