// Port de retry_policy_test.dart y roble_optional_columns_test.dart, más una
// prueba de contrato del SDK de Roble (URL, método, cuerpo y cabeceras) con un
// `fetch` simulado: comprueba que la migración no cambió las conexiones.
import { RetryAfterClient } from "@/src/core/roble/retryAfterClient";
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleApiConfig, RobleApiDataBase } from "@/src/core/roble/sdk/RobleApiDataBase";
import {
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiTimeoutException,
} from "@/src/core/roble/sdk/robleExceptions";
import { RobleMemoryStorage } from "@/src/core/roble/sdk/robleStorage";
import { RetryPolicy } from "@/src/features/auth/data/retryPolicy";

describe("RetryPolicy", () => {
  let sleeps: number[];
  let policy: RetryPolicy;
  beforeEach(() => {
    sleeps = [];
    policy = new RetryPolicy(2, 1000, async (ms) => {
      sleeps.push(ms);
    });
  });

  test("returns immediately on success", async () => {
    let calls = 0;
    await expect(policy.run(async () => (calls++, "ok"))).resolves.toBe("ok");
    expect(calls).toBe(1);
    expect(sleeps).toEqual([]);
  });

  test("retries transient errors with progressive backoff, then succeeds", async () => {
    let calls = 0;
    const value = await policy.run(async () => {
      calls++;
      if (calls < 3) throw new RobleApiNetworkException("down");
      return "ok";
    });
    expect(value).toBe("ok");
    expect(calls).toBe(3);
    expect(sleeps).toEqual([1000, 2000]);
  });

  test("gives up after the maximum number of retries", async () => {
    let calls = 0;
    await expect(
      policy.run(async () => {
        calls++;
        throw new RobleApiTimeoutException("slow");
      }),
    ).rejects.toBeInstanceOf(RobleApiTimeoutException);
    expect(calls).toBe(3);
  });

  for (const status of [400, 401, 403, 404, 409, 429]) {
    test(`does not retry HTTP ${status}`, async () => {
      let calls = 0;
      await expect(
        policy.run(async () => {
          calls++;
          throw new RobleApiHttpException(status, "no");
        }),
      ).rejects.toBeInstanceOf(RobleApiHttpException);
      expect(calls).toBe(1);
      expect(sleeps).toEqual([]);
    });
  }

  test("retries HTTP 503 up to the maximum", async () => {
    let calls = 0;
    await expect(
      policy.run(async () => {
        calls++;
        throw new RobleApiHttpException(503, "unavailable");
      }),
    ).rejects.toBeInstanceOf(RobleApiHttpException);
    expect(calls).toBe(3);
  });
});

describe("RetryAfterClient", () => {
  const respond = (status: number) => async () => new Response(status === 200 ? "" : null, { status, headers: { "retry-after": "7" } });
  test("captures Retry-After (seconds) from a 429 and clears it once read", async () => {
    const client = new RetryAfterClient(respond(429));
    await client.send("https://example.test");
    expect(client.takeRetryAfter()).toBe(7000);
    expect(client.takeRetryAfter()).toBeNull();
  });
  test("ignores Retry-After on non-429 responses", async () => {
    const client = new RetryAfterClient(respond(200));
    await client.send("https://example.test");
    expect(client.takeRetryAfter()).toBeNull();
  });
  test("ignores values it cannot parse", () => {
    expect(RetryAfterClient.parse("Wed, 21 Oct 2026 07:28:00 GMT")).toBeNull();
    expect(RetryAfterClient.parse("0")).toBeNull();
    expect(RetryAfterClient.parse(null)).toBeNull();
  });
});

describe("RobleOptionalColumns", () => {
  beforeEach(() => RobleOptionalColumns.reset());

  test("reintenta sin las columnas nuevas que Roble no tiene", async () => {
    const sent: Record<string, unknown>[] = [];
    const result = await RobleOptionalColumns.write(
      { name: "Proyecto", teamDeadline: "2026-10-30", createdAt: "x" },
      async (row) => {
        sent.push(row);
        if ("teamDeadline" in row) throw new RobleApiHttpException(400, "Columnas inválidas: teamDeadline, createdAt");
        return row;
      },
      { optional: new Set(["teamDeadline", "createdAt"]) },
    );
    expect(sent).toHaveLength(2);
    expect(result).toEqual({ name: "Proyecto" });
  });

  test("no oculta errores de columnas de siempre", async () => {
    await expect(
      RobleOptionalColumns.write(
        { nombre: "x" },
        async () => {
          throw new RobleApiHttpException(400, "Columnas inválidas: nombre");
        },
        { optional: new Set(["deadline"]) },
      ),
    ).rejects.toBeInstanceOf(RobleApiHttpException);
  });

  test("entiende el mensaje de Roble al actualizar", () => {
    expect(RobleOptionalColumns.invalidColumns('La columna "teamDeadline" no existe en la tabla.')).toEqual(new Set(["teamDeadline"]));
    expect(RobleOptionalColumns.invalidColumns("Columnas inválidas: deadline, status")).toEqual(new Set(["deadline", "status"]));
  });
});

describe("Contrato HTTP de Roble (sin cambios respecto a Flutter)", () => {
  const BASE = "https://roble-api.test-openlab.uninorte.edu.co";
  const CONTRACT = "movil_flutter_dcaabc5f4e";
  // JWT de prueba sin firma real: {"sub":"user-123"}
  const token = `x.${Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64url")}.y`;

  type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
  function setup(responder: (c: Call) => { status?: number; body: unknown }) {
    const calls: Call[] = [];
    const fetchFn = async (url: string, init?: RequestInit) => {
      const call: Call = {
        url,
        method: init?.method ?? "GET",
        headers: Object.fromEntries(new Headers(init?.headers).entries()),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      };
      calls.push(call);
      const r = responder(call);
      return new Response(JSON.stringify(r.body), { status: r.status ?? 200, headers: { "content-type": "application/json" } });
    };
    const db = new RobleApiDataBase({
      config: RobleApiConfig.fromContract({ baseUrl: BASE, contractId: CONTRACT }),
      fetchFn,
      storage: new RobleMemoryStorage(),
    });
    return { db, calls };
  }

  test("login → POST /auth/{contrato}/login y luego GET /me con Bearer", async () => {
    const { db, calls } = setup((c) =>
      c.url.endsWith("/login") ? { status: 201, body: { accessToken: token, refreshToken: "r1" } } : { body: { id: "u", email: "a@uninorte.edu.co" } },
    );
    await db.login({ email: "a@uninorte.edu.co", password: "ExamplePass9!" });
    expect(calls[0]).toMatchObject({
      url: `${BASE}/auth/${CONTRACT}/login`,
      method: "POST",
      body: { email: "a@uninorte.edu.co", password: "ExamplePass9!" },
    });
    expect(calls[1].url).toBe(`${BASE}/auth/${CONTRACT}/me`);
    expect(calls[1].method).toBe("GET");
    expect(calls[1].headers.authorization).toBe(`Bearer ${token}`);
    expect(db.currentUserId).toBe("user-123");
  });

  test("CRUD de datos usa /database/{contrato} con los mismos métodos y cuerpos", async () => {
    const { db, calls } = setup((c) => (c.url.endsWith("/login") ? { body: { accessToken: token, refreshToken: "r1" } } : c.method === "GET" && c.url.includes("/read") ? { body: [] } : { body: { _id: "1" } }));
    await db.login({ email: "a@b.co", password: "x" });
    calls.length = 0;

    await db.create("projects", { name: "P", _owner: "hack" });
    await db.read("projects", { filters: { ownerId: "u1" } });
    await db.update("projects", "1", { _id: "1", name: "Q", _owner: "x" });
    await db.delete("projects", "1");
    await db.publicRead("projects");

    const D = `${BASE}/database/${CONTRACT}`;
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `POST ${D}/insert-one`,
      `GET ${D}/read?tableName=projects&ownerId=u1`,
      `PUT ${D}/update`,
      `DELETE ${D}/delete`,
      `GET ${D}/public-read?tableName=projects`,
    ]);
    expect(calls[0].body).toEqual({ tableName: "projects", record: { name: "P" } });
    expect(calls[2].body).toEqual({ tableName: "projects", idColumn: "_id", idValue: "1", updates: { name: "Q" } });
    expect(calls[3].body).toEqual({ tableName: "projects", idColumn: "_id", idValue: "1" });
    expect(calls[0].headers.authorization).toBe(`Bearer ${token}`);
    expect(calls[4].headers.authorization).toBeUndefined();
  });

  test("un 401 renueva el token con /refresh-token y reintenta una vez", async () => {
    let reads = 0;
    const { db, calls } = setup((c) => {
      if (c.url.endsWith("/login")) return { body: { accessToken: token, refreshToken: "r1" } };
      if (c.url.endsWith("/refresh-token")) return { status: 201, body: { accessToken: token } };
      if (c.url.includes("/read")) return ++reads === 1 ? { status: 401, body: { message: "expired" } } : { body: [{ _id: "1" }] };
      return { body: { id: "u" } };
    });
    await db.login({ email: "a@b.co", password: "x" });
    calls.length = 0;
    const rows = await db.read("projects");
    expect(rows).toEqual([{ _id: "1" }]);
    expect(calls.map((c) => c.url.split("/").pop())).toEqual(["read?tableName=projects", "refresh-token", "read?tableName=projects"]);
    expect(calls[1].body).toEqual({ refreshToken: "r1" });
  });
});
