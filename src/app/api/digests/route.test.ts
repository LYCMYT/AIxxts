import assert from "node:assert/strict";
import test from "node:test";
import { digestArchiveFiltersFromRequest } from "./route";

test("digest API reads archive filter params from the request URL", () => {
  const filters = digestArchiveFiltersFromRequest(
    new Request("http://localhost/api/digests?q=agent&status=success&topic=AI%20Agent"),
  );

  assert.deepEqual(filters, {
    q: "agent",
    status: "success",
    topic: "AI Agent",
  });
});
