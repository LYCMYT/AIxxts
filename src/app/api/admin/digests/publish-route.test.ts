import assert from "node:assert/strict";
import test from "node:test";
import * as publishRoute from "./[date]/publish/route";

test("admin digest publish route returns 400 for invalid digestDate", async () => {
  const response = await publishRoute.POST(
    new Request("http://localhost/api/admin/digests/nope/publish"),
    {
      params: Promise.resolve({
        date: "nope",
      }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: "digestDate must use YYYY-MM-DD.",
  });
});
