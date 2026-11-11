import assert from "node:assert/strict";
import test from "node:test";
import { profileForOwner, publicProfileFields, saveOwnProfile } from "../src/lib/roble/profile-write.ts";
import { ProjectWriteFailure } from "../src/lib/roble/project-write.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const identity = { userId: "user-a", email: "a@example.com", name: "Ana" };

test("profile owner, privacy defaults, and mobile notification encoding", async () => {
  const profiles: Record<string, unknown>[] = [{ _id: "profile-a", _owner: "user-a", userId: "user-a", name: "Ana", username: "ana", profileVisibility: "private", mutedNotifications: '["messages"]' }];
  assert.equal(profileForOwner([{ ...profiles[0], _owner: "user-b" }], "user-a"), null);
  assert.deepEqual(publicProfileFields(profiles[0]).mutedNotifications, ["messages"]);
  const original = globalThis.fetch;
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/read")) return Response.json(profiles);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    writes.push(body);
    return Response.json({ _id: "profile-a" });
  };
  try {
    const result = await saveOwnProfile(config, "token", identity, { kind: "notifications", notificationsEnabled: false, mutedNotifications: ["messages", "messages"] });
    assert.equal(result.profileVisibility, "private");
    assert.deepEqual(writes[0].updates, { notificationsEnabled: false, mutedNotifications: '["messages"]', updatedAt: (writes[0].updates as Record<string, unknown>).updatedAt });
    await assert.rejects(() => saveOwnProfile(config, "token", identity, { kind: "privacy", profileVisibility: "public", contactPermission: "everyone", activityVisibility: "unknown", userId: "user-b" }),
      (error: unknown) => error instanceof ProjectWriteFailure && error.status === 400);
  } finally { globalThis.fetch = original; }
});
