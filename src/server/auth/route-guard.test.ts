import assert from "node:assert/strict";
import test from "node:test";
import {
  getProtectedRouteDecision,
  loginRedirectPath,
  requiresAdminRoute,
} from "./route-guard";

test("requiresAdminRoute only protects admin surfaces", () => {
  const protectedPaths = [
    "/admin",
    "/admin/sources",
    "/progress",
    "/api/admin/jobs/collect",
  ];

  for (const pathname of protectedPaths) {
    assert.equal(requiresAdminRoute(pathname), true, pathname);
  }

  const publicPaths = [
    "/",
    "/digests",
    "/digests/2026-07-06",
    "/items/item-1",
    "/login",
    "/api/digests",
    "/api/health",
    "/api/auth/login",
  ];

  for (const pathname of publicPaths) {
    assert.equal(requiresAdminRoute(pathname), false, pathname);
  }
});

test("getProtectedRouteDecision allows only admin sessions on protected routes", () => {
  assert.deepEqual(getProtectedRouteDecision("/", null), { action: "allow" });
  assert.deepEqual(getProtectedRouteDecision("/admin", "ADMIN"), { action: "allow" });
  assert.deepEqual(getProtectedRouteDecision("/api/admin/jobs", "ADMIN"), { action: "allow" });

  assert.deepEqual(getProtectedRouteDecision("/admin", null), {
    action: "page-login",
    status: 401,
  });
  assert.deepEqual(getProtectedRouteDecision("/api/admin/jobs", null), {
    action: "api-error",
    status: 401,
  });
  assert.deepEqual(getProtectedRouteDecision("/admin", "READER"), {
    action: "page-login",
    status: 403,
  });
  assert.deepEqual(getProtectedRouteDecision("/api/admin/jobs", "READER"), {
    action: "api-error",
    status: 403,
  });
});

test("loginRedirectPath preserves the original protected path", () => {
  assert.equal(loginRedirectPath("/admin", 401), "/login?next=%2Fadmin&auth=required");
  assert.equal(
    loginRedirectPath("/admin?tab=jobs", 403),
    "/login?next=%2Fadmin%3Ftab%3Djobs&auth=forbidden",
  );
});
