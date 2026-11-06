import assert from "node:assert/strict";
import test from "node:test";
import { publishedProjectsFromResponse } from "../src/lib/roble/projects.ts";

test("only published community projects are returned without private fields", () => {
  const projects = publishedProjectsFromResponse({ data: [
    { _id: "public-1", name: "Huerta", description: "Cultivo urbano", categories: '["Sostenibilidad"]', audience: "Toda la comunidad", isDraft: false, acceptedMembersCount: 2, createdByName: "Ana", applicantEmail: "private@example.com" },
    { _id: "draft-1", name: "Borrador", audience: "Toda la comunidad", isDraft: true },
    { _id: "private-1", name: "Privado", audience: "Solo yo", isDraft: false },
    { _id: "unknown-1", name: "Sin estado", audience: "Toda la comunidad" },
  ] });

  assert.deepEqual(projects, [{
    id: "public-1",
    name: "Huerta",
    description: "Cultivo urbano",
    categories: ["Sostenibilidad"],
    createdByName: "Ana",
    acceptedMembersCount: 2,
  }]);
});
