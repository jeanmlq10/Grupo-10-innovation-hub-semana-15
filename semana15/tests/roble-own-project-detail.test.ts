import assert from "node:assert/strict";
import test from "node:test";
import { ownProjectDetailFromRows, readOwnProjectDetail } from "../src/lib/roble/own-project-detail.ts";

const project = {
  _id: "project-a", _owner: "user-a", name: "Huerta", description: "Cultivo urbano",
  categories: ["Ambiente"], isDraft: false, audience: "Toda la comunidad",
  teamRoles: { "Diseñador/a": 2 }, acceptedRoleCounts: { "Diseñador/a": 1 }, duration: "Meses",
  createdAt: "2026-11-09", teamDeadline: "2026-12-01", createdByName: "Nombre privado",
};

const tasks = [
  { _id: "task-a", _owner: "user-a", projectId: "project-a", title: "Diseñar", requiredCount: 2, acceptedCount: 1, status: "in_progress" },
  { _id: "task-other-project", projectId: "project-b", title: "Ajena" },
  { _id: "task-foreign-author", _owner: "user-b", projectId: "project-a", title: "Inyectada" },
  { _id: "task-unowned", projectId: "project-a", title: "Sin autor" },
];
const members = [
  { _id: "member-a", _owner: "user-a", projectId: "project-a", name: "Participante", email: "hidden@example.com", role: "Diseñador/a" },
  { _id: "member-other", projectId: "project-b", name: "Otra persona" },
  { _id: "member-unowned", projectId: "project-a", name: "Sin autor" },
];
const requests = [
  { _id: "request-a", projectId: "project-a", applicantName: "Ana", applicantEmail: "hidden@example.com", role: "Diseñador/a", type: "team", message: "Quiero ayudar", status: "pending", createdAt: "2026-11-09" },
  { _id: "request-other", projectId: "project-b", applicantName: "Persona ajena" },
];
const decisions = [
  { requestId: "request-a", _owner: "user-b", status: "rejected", decidedAt: "2026-11-10" },
  { requestId: "request-a", _owner: "user-a", status: "accepted", decidedAt: "2026-11-11" },
];

test("own detail joins only the verified project and exposes a minimal view", () => {
  const detail = ownProjectDetailFromRows(project, "user-a", tasks, members, requests, decisions);
  assert.ok(detail);
  assert.deepEqual(detail.teamRoles, [{ role: "Diseñador/a", needed: 2, accepted: 1 }]);
  assert.deepEqual(detail.tasks.map(task => task.title), ["Diseñar"]);
  assert.deepEqual(detail.members.map(member => member.name), ["Participante"]);
  assert.deepEqual(detail.requests.map(request => request.status), ["accepted"]);
  assert.equal(JSON.stringify(detail).includes("hidden@example.com"), false);
  assert.equal(JSON.stringify(detail).includes("Persona ajena"), false);
  assert.equal(JSON.stringify(detail).includes("Inyectada"), false);
  assert.equal(ownProjectDetailFromRows(project, "user-b", tasks, members, requests, decisions), null);
});

test("owner sees team-only task content only from their private row", () => {
  const teamTask = { _id: "team-task", _owner: "user-a", projectId: "project-a", title: "", description: "", visibility: "team", requiredCount: 1 };
  const privateRows = [
    { taskId: "team-task", projectId: "project-a", _owner: "user-b", title: "Injected" },
    { taskId: "team-task", projectId: "project-a", _owner: "user-a", title: "Plan interno", description: "Solo equipo" },
  ];
  const detail = ownProjectDetailFromRows(project, "user-a", [teamTask], [], [], [], privateRows);
  assert.deepEqual(detail?.tasks.map(task => ({ title: task.title, visibility: task.visibility })), [{ title: "Plan interno", visibility: "team" }]);
  assert.equal(ownProjectDetailFromRows(project, "user-a", [teamTask], [], [], [])?.tasks.length, 0);
});

test("foreign project stops before reading child tables, even if Roble ignores filters", async () => {
  const original = globalThis.fetch;
  const tables: string[] = [];
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    tables.push(url.searchParams.get("tableName") ?? "");
    return Response.json([project]);
  };
  try {
    const result = await readOwnProjectDetail({ baseUrl: "https://roble.example", contractId: "contract" }, "token", "user-b", "project-a");
    assert.equal(result, null);
    assert.deepEqual(tables, ["projects"]);
  } finally { globalThis.fetch = original; }
});

test("owned detail reads related Roble tables with project filters and bearer session", async () => {
  const original = globalThis.fetch;
  const queries: Record<string, URL> = {};
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const table = url.searchParams.get("tableName") ?? "";
    queries[table] = url;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    assert.equal(init?.cache, "no-store");
    const values: Record<string, unknown[]> = { projects: [project], project_tasks: tasks, project_members: members, project_requests: requests, request_decisions: decisions };
    return Response.json(values[table] ?? []);
  };
  try {
    const result = await readOwnProjectDetail({ baseUrl: "https://roble.example", contractId: "contract" }, "token", "user-a", "project-a");
    assert.equal(result?.id, "project-a");
    assert.equal(queries.projects.searchParams.get("_id"), "project-a");
    assert.equal(queries.projects.searchParams.get("_owner"), "user-a");
    for (const table of ["project_tasks", "project_members", "project_requests"]) {
      assert.equal(queries[table].searchParams.get("projectId"), "project-a");
    }
    assert.equal(queries.request_decisions.searchParams.get("projectId"), null);
  } finally { globalThis.fetch = original; }
});
