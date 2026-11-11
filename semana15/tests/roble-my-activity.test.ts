import assert from "node:assert/strict";
import test from "node:test";
import { myNotificationsFromRows, myRequestsFromRows, readMyNotifications, readMyRequests } from "../src/lib/roble/my-activity.ts";

const notifications = [
  { _id: "notice-a", _owner: "sender-b", recipientUserId: "user-a", type: "new_request", title: "Solicitud", message: "Alguien quiere unirse", read: false, createdAt: "2026-11-10T10:00:00Z", senderEmail: "secret@example.com" },
  { _id: "notice-b", _owner: "sender-a", recipientUserId: "user-b", title: "Privada", message: "No mostrar" },
];
const requests = [
  { _id: "request-a", _owner: "user-a", applicantUserId: "user-a", applicantEmail: "secret@example.com", projectId: "project-public", type: "team", role: "Diseñador/a", message: "Quiero ayudar", status: "pending", createdAt: "2026-11-10T10:00:00Z" },
  { _id: "request-private", _owner: "user-a", applicantUserId: "user-a", projectId: "project-private", type: "task", role: "Pruebas", status: "pending", createdAt: "2026-11-09T10:00:00Z" },
  { _id: "request-b", _owner: "user-b", applicantUserId: "user-b", projectId: "project-public", message: "Mensaje ajeno" },
  { _id: "request-spoof", _owner: "user-b", applicantUserId: "user-a", projectId: "project-public", message: "Suplantada" },
];
const projects = [
  { _id: "project-public", _owner: "owner-p", name: "Huerta", isDraft: false, audience: "Toda la comunidad" },
  { _id: "project-private", _owner: "owner-q", name: "Nombre oculto", isDraft: true, audience: "Solo yo" },
];
const decisions = [
  { requestId: "request-a", _owner: "intruder", status: "rejected", decidedAt: "2026-11-12T10:00:00Z" },
  { requestId: "request-a", _owner: "owner-p", status: "accepted", decidedAt: "2026-11-11T10:00:00Z" },
  { requestId: "request-b", _owner: "owner-p", status: "accepted", decidedAt: "2026-11-11T10:00:00Z" },
];

test("notifications are limited to recipient, even when another user owns the row", () => {
  const result = myNotificationsFromRows(notifications, "user-a");
  assert.deepEqual(result.map(item => item.id), ["notice-a"]);
  assert.equal(result[0].read, false);
  assert.equal(JSON.stringify(result).includes("secret@example.com"), false);
  assert.equal(JSON.stringify(result).includes("Privada"), false);
});

test("requests are limited to applicant and expose public project names only", () => {
  const result = myRequestsFromRows(requests, projects, decisions, "user-a");
  assert.deepEqual(result.map(item => item.id), ["request-a", "request-private"]);
  assert.equal(result[0].status, "accepted");
  assert.equal(result[0].projectName, "Huerta");
  assert.equal(result[1].projectName, "Proyecto no público");
  assert.equal(result[1].publicProject, false);
  assert.equal(JSON.stringify(result).includes("secret@example.com"), false);
  assert.equal(JSON.stringify(result).includes("Mensaje ajeno"), false);
  assert.equal(JSON.stringify(result).includes("Suplantada"), false);
  assert.equal(JSON.stringify(result).includes("Nombre oculto"), false);
});

test("activity reads use Roble filters and the same bearer session", async () => {
  const original = globalThis.fetch;
  const queries: Record<string, URL> = {};
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const table = url.searchParams.get("tableName") ?? "";
    queries[table] = url;
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    assert.equal(init?.cache, "no-store");
    const rows: Record<string, unknown[]> = { app_notifications: notifications, project_requests: requests, projects, request_decisions: decisions };
    return Response.json(rows[table] ?? []);
  };
  try {
    const config = { baseUrl: "https://roble.example", contractId: "contract" };
    const notices = await readMyNotifications(config, "token", "user-a");
    const sent = await readMyRequests(config, "token", "user-a");
    assert.equal(notices.length, 1);
    assert.equal(sent.length, 2);
    assert.equal(queries.app_notifications.searchParams.get("recipientUserId"), "user-a");
    assert.equal(queries.project_requests.searchParams.get("applicantUserId"), "user-a");
  } finally { globalThis.fetch = original; }
});

test("foreign requests do not trigger reads of projects or decisions", async () => {
  const original = globalThis.fetch;
  const tables: string[] = [];
  globalThis.fetch = async input => {
    const table = new URL(String(input)).searchParams.get("tableName") ?? "";
    tables.push(table);
    return Response.json(requests.filter(row => row._owner === "user-b"));
  };
  try {
    const result = await readMyRequests({ baseUrl: "https://roble.example", contractId: "contract" }, "token", "user-a");
    assert.deepEqual(result, []);
    assert.deepEqual(tables, ["project_requests"]);
  } finally { globalThis.fetch = original; }
});
