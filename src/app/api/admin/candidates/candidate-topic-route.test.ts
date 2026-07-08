import assert from "node:assert/strict";
import test from "node:test";
import * as candidateTopicsRoute from "./[id]/topics/route";

test("admin candidate topics route exposes PUT handler", () => {
  assert.equal(typeof candidateTopicsRoute.PUT, "function");
});

test("admin candidate topics route rejects invalid JSON", async () => {
  const response = await candidateTopicsRoute.PUT(
    new Request("http://localhost/api/admin/candidates/candidate-1/topics", {
      body: "{",
      method: "PUT",
    }),
    {
      params: Promise.resolve({
        id: "candidate-1",
      }),
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "request body must be valid JSON.",
  });
});
