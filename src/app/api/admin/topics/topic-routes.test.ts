import assert from "node:assert/strict";
import test from "node:test";
import * as mergeRoute from "./merge/route";
import * as topicsRoute from "./route";

test("admin topic routes expose list and merge handlers", () => {
  assert.equal(typeof topicsRoute.GET, "function");
  assert.equal(typeof mergeRoute.POST, "function");
});

test("admin topic merge route rejects invalid JSON", async () => {
  const response = await mergeRoute.POST(
    new Request("http://localhost/api/admin/topics/merge", {
      body: "{",
      method: "POST",
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "request body must be valid JSON.",
  });
});
