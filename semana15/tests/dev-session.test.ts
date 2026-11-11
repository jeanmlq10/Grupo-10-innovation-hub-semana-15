import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createDevSession, deleteDevSession, getDevSession, refreshDevSession } from "../src/lib/roble/dev-session.ts";

const config = { baseUrl: "https://roble.example", contractId: "contract" };
const identity = { userId: "mobile-user", email: "person@example.com", name: "Persona" };

test("development session survives a new server process and is removed on logout", () => {
  const id = createDevSession({ accessToken: "access", refreshToken: "refresh" }, identity);
  try {
    assert.deepEqual(getDevSession(id)?.identity, identity);
    const moduleUrl = new URL("../src/lib/roble/dev-session.ts", import.meta.url).href;
    const child = execFileSync(process.execPath, ["--input-type=module", "-e", `import { getDevSession } from ${JSON.stringify(moduleUrl)}; console.log(getDevSession(process.env.TEST_SESSION_ID)?.identity.userId ?? "missing")`], {
      env: { ...process.env, TEST_SESSION_ID: id }, encoding: "utf8",
    });
    assert.equal(child.trim(), identity.userId);
  } finally { deleteDevSession(id); }
  assert.equal(getDevSession(id), null);
});

test("concurrent requests rotate one refresh token only once", async () => {
  const id = createDevSession({ accessToken: "expired", refreshToken: "old-refresh" }, identity);
  const original = globalThis.fetch;
  let refreshCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/refresh-token")) {
      refreshCalls++;
      assert.equal(init?.body, JSON.stringify({ refreshToken: "old-refresh" }));
      await new Promise(resolve => setTimeout(resolve, 10));
      return Response.json({ accessToken: "new-access", refreshToken: "new-refresh" });
    }
    if (url.endsWith("/me")) return Response.json(identity);
    throw new Error("Unexpected URL");
  };
  try {
    const [first, second] = await Promise.all([
      refreshDevSession(id, "expired", config),
      refreshDevSession(id, "expired", config),
    ]);
    assert.equal(refreshCalls, 1);
    assert.equal(first.tokens.accessToken, "new-access");
    assert.deepEqual(second.tokens, first.tokens);
    assert.equal(getDevSession(id)?.tokens.refreshToken, "new-refresh");
  } finally {
    globalThis.fetch = original;
    deleteDevSession(id);
  }
});
