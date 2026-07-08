import assert from "node:assert/strict";
import test from "node:test";
import * as candidateStatusRoute from "./status/route";

test("admin candidate status route exposes PATCH handler", () => {
  assert.equal(typeof candidateStatusRoute.PATCH, "function");
});

test("admin candidate status route rejects invalid JSON", async () => {
  const response = await candidateStatusRoute.PATCH(
    new Request("http://localhost/api/admin/candidates/status", {
      body: "{",
      method: "PATCH",
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "request body must be valid JSON.",
  });
});
