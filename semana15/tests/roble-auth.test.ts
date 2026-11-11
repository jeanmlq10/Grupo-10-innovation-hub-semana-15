import test from "node:test";
import assert from "node:assert/strict";
import { loginToRoble, readRobleIdentity, refreshRobleTokens, RobleAuthFailure } from "../src/lib/roble/auth.ts";

const config = { baseUrl: "https://roble.example", contractId: "same-mobile-contract" };

test("login obtains identity from the same contract without returning credentials", async () => {
  const original = globalThis.fetch;
  const calls: Array<{ url: string; method: string; body?: string; authorization?: string }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, method: init?.method ?? "GET", body: init?.body?.toString(), authorization: headers.get("Authorization") ?? undefined });
    if (url.endsWith("/login")) return Response.json({ accessToken: "access", refreshToken: "refresh" }, { status: 201 });
    if (url.endsWith("/me")) return Response.json({ userId: "mobile-user-id", email: "person@example.com", name: "Persona" });
    throw new Error("Unexpected URL");
  };
  try {
    const result = await loginToRoble(config, "person@example.com", "example-password");
    assert.deepEqual(result.identity, { userId: "mobile-user-id", email: "person@example.com", name: "Persona" });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "https://roble.example/auth/same-mobile-contract/login");
    assert.equal(calls[0].body, JSON.stringify({ email: "person@example.com", password: "example-password" }));
    assert.equal(calls[1].authorization, "Bearer access");
    assert.equal(calls[1].body, undefined);
  } finally { globalThis.fetch = original; }
});

test("expired access token can refresh and read the same identity", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/refresh-token")) {
      assert.equal(init?.body, JSON.stringify({ refreshToken: "old-refresh" }));
      return Response.json({ accessToken: "new-access" }, { status: 201 });
    }
    if (url.endsWith("/me")) {
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer new-access");
      return Response.json({ userId: "mobile-user-id" });
    }
    throw new Error("Unexpected URL");
  };
  try {
    const tokens = await refreshRobleTokens(config, "old-refresh");
    assert.deepEqual(tokens, { accessToken: "new-access", refreshToken: "old-refresh" });
    assert.equal((await readRobleIdentity(config, tokens.accessToken)).userId, "mobile-user-id");
  } finally { globalThis.fetch = original; }
});

test("rejected credentials expose only a generic authentication error", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: "private server detail" }, { status: 401 });
  try {
    await assert.rejects(loginToRoble(config, "person@example.com", "wrong"), (error: unknown) =>
      error instanceof RobleAuthFailure && error.status === 401 && !error.message.includes("private server detail"));
  } finally { globalThis.fetch = original; }
});
