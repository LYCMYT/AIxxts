import assert from "node:assert/strict";
import test from "node:test";
import { adminJobActions } from "./job-action-config";

test("admin job actions include collection, daily digest, article enrichment, and translation", () => {
  assert.deepEqual(
    adminJobActions.map((action) => action.kind),
    ["daily", "collect", "enrichArticles", "translate"],
  );
  assert.deepEqual(
    adminJobActions.map((action) => action.url),
    [
      "/api/admin/jobs/daily",
      "/api/admin/jobs/collect",
      "/api/admin/jobs/enrich-articles",
      "/api/admin/jobs/translate",
    ],
  );
});
