import test from "node:test";
import assert from "node:assert/strict";
import { RobleAuthFailure } from "../src/lib/roble/auth.ts";
import {
  beginRegistration, completePasswordRecovery, institutionalEmail, normalizeEmail,
  requestPasswordRecovery, resendVerification, validPassword, verifyRegistration,
} from "../src/lib/roble/auth-flow.ts";

const config = { baseUrl: "https://roble.example", contractId: "same-mobile-contract" };

test("registration follows the mobile contract and institutional password rules", async () => {
  assert.equal(normalizeEmail("  Person@Uninorte.edu.co "), "person@uninorte.edu.co");
  assert.equal(institutionalEmail("person@uninorte.edu.co"), true);
  assert.equal(institutionalEmail("person@another.edu.co"), false);
  assert.equal(validPassword("Password1!"), true);
  assert.equal(validPassword("password1!"), false);
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://roble.example/auth/same-mobile-contract/signup");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      email: "person@uninorte.edu.co", password: "Password1!", name: "Persona",
      extra: { career: "Ingeniería" },
    });
    return Response.json({ message: "code sent" }, { status: 201 });
  };
  try {
    await beginRegistration(config, { email: "person@uninorte.edu.co", password: "Password1!", name: "Persona", career: "Ingeniería" });
  } finally { globalThis.fetch = original; }
});

test("verification, resend and recovery use the Roble auth endpoints", async () => {
  const original = globalThis.fetch;
  const calls: Array<{ endpoint: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ endpoint: new URL(String(input)).pathname.split("/").at(-1) ?? "", body: JSON.parse(String(init?.body)) });
    return Response.json({ ok: true }, { status: 200 });
  };
  try {
    await verifyRegistration(config, "person@uninorte.edu.co", "123456");
    await resendVerification(config, "person@uninorte.edu.co");
    await requestPasswordRecovery(config, "person@uninorte.edu.co");
    await completePasswordRecovery(config, "example-token", "Password2!");
    assert.deepEqual(calls, [
      { endpoint: "verify-email", body: { email: "person@uninorte.edu.co", code: "123456" } },
      { endpoint: "resend-code", body: { email: "person@uninorte.edu.co" } },
      { endpoint: "forgot-password", body: { email: "person@uninorte.edu.co" } },
      { endpoint: "reset-password", body: { token: "example-token", newPassword: "Password2!" } },
    ]);
  } finally { globalThis.fetch = original; }
});

test("invalid verification token is generic and unknown recovery email does not reveal account existence", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async input => Response.json({ detail: "private server detail" }, { status: String(input).endsWith("/verify-email") ? 400 : 404 });
  try {
    await assert.rejects(verifyRegistration(config, "person@uninorte.edu.co", "000000"), (error: unknown) =>
      error instanceof RobleAuthFailure && error.status === 400 && !error.message.includes("private server detail"));
    await requestPasswordRecovery(config, "unknown@uninorte.edu.co");
  } finally { globalThis.fetch = original; }
});
