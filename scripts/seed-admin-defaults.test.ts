import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ADMIN_ACCOUNT, DEFAULT_ADMIN_PASSWORD } from "./seed-admin-defaults";

test("default local admin credentials match the requested bootstrap account", () => {
  assert.equal(DEFAULT_ADMIN_ACCOUNT, "admin");
  assert.equal(DEFAULT_ADMIN_PASSWORD, "admin123");
});
