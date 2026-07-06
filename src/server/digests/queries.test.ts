import assert from "node:assert/strict";
import test from "node:test";
import { getHomeDigestTaskStatus, homeDigestPreviewStatuses } from "./queries";

test("home digest preview statuses prefer published and then draft", () => {
  assert.deepEqual(homeDigestPreviewStatuses, ["PUBLISHED", "DRAFT"]);
});

test("home digest task status distinguishes published and draft previews", () => {
  assert.equal(getHomeDigestTaskStatus("PUBLISHED"), "已发布");
  assert.equal(getHomeDigestTaskStatus("DRAFT"), "草稿预览");
});
