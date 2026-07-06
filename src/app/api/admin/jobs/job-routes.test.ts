import assert from "node:assert/strict";
import test from "node:test";
import * as collectRoute from "./collect/route";
import * as dailyRoute from "./daily/route";

test("admin collect and daily job trigger routes expose POST handlers", () => {
  assert.equal(typeof collectRoute.POST, "function");
  assert.equal(typeof dailyRoute.POST, "function");
});
