import assert from "node:assert/strict";
import test from "node:test";

import * as collectRoute from "./[id]/collect/route";
import * as sourceRoute from "./[id]/route";
import * as sourcesRoute from "./route";

test("admin source routes expose POST, PATCH, and collect POST handlers", () => {
  assert.equal(typeof sourcesRoute.POST, "function");
  assert.equal(typeof sourceRoute.PATCH, "function");
  assert.equal(typeof collectRoute.POST, "function");
});

test("admin sources POST rejects invalid JSON", async () => {
  const response = await sourcesRoute.POST(
    new Request("http://localhost/api/admin/sources", {
      body: "{",
      method: "POST",
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: "request body must be valid JSON.",
  });
});

test("admin source PATCH rejects invalid JSON", async () => {
  const response = await sourceRoute.PATCH(
    new Request("http://localhost/api/admin/sources/source-1", {
      body: "{",
      method: "PATCH",
    }),
    {
      params: Promise.resolve({
        id: "source-1",
      }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: "request body must be valid JSON.",
  });
});

test("admin source PATCH rejects invalid enabled values", async () => {
  const response = await sourceRoute.PATCH(
    new Request("http://localhost/api/admin/sources/source-1", {
      body: JSON.stringify({
        enabled: "true",
      }),
      method: "PATCH",
    }),
    {
      params: Promise.resolve({
        id: "source-1",
      }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: "enabled must be a boolean.",
  });
});
