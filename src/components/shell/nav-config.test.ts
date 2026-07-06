import assert from "node:assert/strict";
import test from "node:test";
import { publicNavItems } from "./nav-config";

test("public navigation only includes reader-facing routes", () => {
  assert.deepEqual(
    publicNavItems.map((item) => item.href),
    ["/", "/digests"],
  );
  assert.equal(publicNavItems.some((item) => item.href.startsWith("/admin")), false);
});
