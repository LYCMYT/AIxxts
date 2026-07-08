import assert from "node:assert/strict";
import test from "node:test";
import * as collectRoute from "./collect/route";
import * as dailyRoute from "./daily/route";
import * as enrichArticlesRoute from "./enrich-articles/route";
import * as translateRoute from "./translate/route";
import * as topicBackfillRoute from "./backfill-topics/route";

test("admin job trigger routes expose POST handlers", () => {
  assert.equal(typeof collectRoute.POST, "function");
  assert.equal(typeof dailyRoute.POST, "function");
  assert.equal(typeof enrichArticlesRoute.POST, "function");
  assert.equal(typeof translateRoute.POST, "function");
  assert.equal(typeof topicBackfillRoute.POST, "function");
});

test("admin article enrichment route rejects invalid options with 400", async () => {
  const response = await enrichArticlesRoute.POST(
    new Request("http://localhost/api/admin/jobs/enrich-articles", {
      method: "POST",
      body: JSON.stringify({
        selectedOnly: "true",
      }),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "selectedOnly must be a boolean.",
  });
});

test("admin translation route rejects invalid options with 400", async () => {
  const response = await translateRoute.POST(
    new Request("http://localhost/api/admin/jobs/translate", {
      method: "POST",
      body: JSON.stringify({
        limit: 0,
      }),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "limit must be a positive number.",
  });
});
