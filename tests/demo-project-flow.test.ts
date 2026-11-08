import assert from "node:assert/strict";
import test from "node:test";
import { addComment, decideRequest, deleteProject, initialState, ownedProjects, publicProjects, requestParticipation, saveProject, setActor, setTaskStatus, toggleFollow, visibleProject } from "../src/lib/projects/demo-domain.ts";

const time = "2026-11-08T12:00:00.000Z";
const input = { name: " Nueva idea ", description: "Mi proyecto", categories: ["Educación"], audience: "Toda la comunidad" as const, duration: "Semanas", teamRoles: { "Diseñador/a": 1 }, teamDeadline: "", tasks: [{ id: "t1", title: "Diseñar", description: "Interfaz", requiredCount: 1, acceptedCount: 0, deadline: "", status: "available" as const }] };

test("draft, publish, edit, and delete preserve ownership and public visibility", () => {
  const draft = saveProject(initialState, input, "new-project", false, time);
  assert.equal(ownedProjects(draft).some(project => project.id === "new-project"), true);
  assert.equal(publicProjects(draft).some(project => project.id === "new-project"), false);
  assert.equal(visibleProject(setActor(draft, "demo-b"), "new-project"), undefined);
  assert.throws(() => saveProject(setActor(draft, "demo-b"), input, "new-project", true, time), /Solo quien creó/);
  const published = saveProject(draft, input, "new-project", true, time);
  assert.equal(publicProjects(published).some(project => project.id === "new-project"), true);
  assert.throws(() => deleteProject(setActor(published, "demo-b"), "new-project"), /Solo quien creó/);
  assert.equal(visibleProject(deleteProject(published, "new-project"), "new-project"), undefined);
});

test("applicant request, owner decision, counts, comments, and follow work across demo accounts", () => {
  const requested = requestParticipation(setActor(initialState, "demo-b"), "eco-campus", "team", "Diseñador/a", "Quiero colaborar", "request-1", time);
  assert.throws(() => requestParticipation(requested, "eco-campus", "team", "Diseñador/a", "", "request-2", time), /pendiente/);
  assert.throws(() => decideRequest(requested, "eco-campus", "request-1", "accepted"), /Solo quien creó/);
  const accepted = decideRequest(setActor(requested, "demo-a"), "eco-campus", "request-1", "accepted");
  assert.equal(accepted.projects[0].requests[0].status, "accepted");
  assert.equal(accepted.projects[0].acceptedRoleCounts["Diseñador/a"], 1);
  assert.deepEqual(accepted.projects[0].members, ["demo-b"]);
  assert.throws(() => decideRequest(accepted, "eco-campus", "request-1", "accepted"), /ya fue atendida/);
  const applicant = setActor(accepted, "demo-b");
  const followed = toggleFollow(applicant, "eco-campus");
  const commented = addComment(followed, "eco-campus", "¡Me gusta!", "comment-1", time);
  assert.deepEqual(commented.projects[0].followers, ["demo-b"]);
  assert.equal(commented.projects[0].comments[0].text, "¡Me gusta!");
  assert.throws(() => setTaskStatus(commented, "eco-campus", "task-eco-1", "completed"), /Solo quien creó/);
  assert.equal(setTaskStatus(setActor(commented, "demo-a"), "eco-campus", "task-eco-1", "in_progress").projects[0].tasks[0].status, "in_progress");
});

test("private audience remains a draft even when publish is requested", () => {
  const state = saveProject(initialState, { ...input, audience: "Solo yo" }, "private-idea", true, time);
  assert.equal(state.projects[0].isDraft, true);
  assert.equal(publicProjects(state).some(project => project.id === "private-idea"), false);
});

test("task capacity and accepted assignments survive editing", () => {
  const requested = requestParticipation(setActor(initialState, "demo-b"), "eco-campus", "task", "task-eco-1", "", "task-request", time);
  const accepted = decideRequest(setActor(requested, "demo-a"), "eco-campus", "task-request", "accepted");
  const project = accepted.projects[0];
  assert.equal(project.tasks[0].acceptedCount, 1);
  assert.throws(() => saveProject(accepted, { ...input, tasks: [] }, project.id, true, time), /No puedes eliminar/);
  assert.throws(() => saveProject(accepted, { ...input, tasks: [{ ...project.tasks[0], requiredCount: 0 }] }, project.id, true, time), /conservar los cupos/);
  const edited = saveProject(accepted, { ...input, name: "EcoCampus mejorado", tasks: project.tasks }, project.id, true, time);
  assert.equal(edited.projects[0].tasks[0].acceptedCount, 1);
});
