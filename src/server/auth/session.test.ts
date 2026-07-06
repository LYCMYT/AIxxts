import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  getSessionCookieOptions,
  verifySessionToken,
} from "./session";

const secret = "test-session-secret-at-least-32-chars";
const issuedAt = new Date("2026-07-06T00:00:00.000Z");

test("hashPassword creates a scrypt hash that verifies only the original password", async () => {
  const hash = await hashPassword("ChangeMe123!");

  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword("ChangeMe123!", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("session token round trips signed payload and rejects tampering", async () => {
  const token = await createSessionToken(
    { role: "ADMIN", userId: "user_1" },
    secret,
    issuedAt,
    60,
  );

  assert.deepEqual(await verifySessionToken(token, secret, new Date("2026-07-06T00:00:30.000Z")), {
    exp: 1783296060,
    role: "ADMIN",
    userId: "user_1",
  });

  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(await verifySessionToken(tampered, secret, issuedAt), null);
});

test("session token expires when exp is in the past", async () => {
  const token = await createSessionToken(
    { role: "READER", userId: "user_2" },
    secret,
    issuedAt,
    10,
  );

  assert.equal(await verifySessionToken(token, secret, new Date("2026-07-06T00:00:11.000Z")), null);
});

test("session cookie is secure only in production", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const mutableEnv = process.env as Record<string, string | undefined>;

  mutableEnv.NODE_ENV = "development";
  assert.equal(getSessionCookieOptions().secure, false);

  mutableEnv.NODE_ENV = "production";
  assert.equal(getSessionCookieOptions().secure, true);

  mutableEnv.NODE_ENV = originalNodeEnv;
});
