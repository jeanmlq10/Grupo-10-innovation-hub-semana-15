import assert from "node:assert/strict";
import test from "node:test";
import { messagesFromRows } from "../src/lib/roble/messages.ts";

test("mensajes de Roble solo incluyen participantes y remitentes verificados", () => {
  const actual = messagesFromRows([
    { _id: "a", _owner: "me", fromUserId: "me", toUserId: "friend", text: "Hola", createdAt: "2026-11-10T10:00:00Z" },
    { _id: "b", _owner: "friend", fromUserId: "friend", toUserId: "me", text: "Respuesta", createdAt: "2026-11-10T11:00:00Z" },
    { _id: "b", _owner: "friend", fromUserId: "friend", toUserId: "me", text: "Duplicado" },
    { _id: "c", _owner: "stranger", fromUserId: "me", toUserId: "friend", text: "Suplantado" },
    { _id: "d", _owner: "friend", fromUserId: "friend", toUserId: "other", text: "Ajeno" },
  ], "me");
  assert.deepEqual(actual.map(item => item.id), ["a", "b"]);
});
