import type { SessionRole } from "./session";

export type ProtectedRouteDecision =
  | { action: "allow" }
  | { action: "api-error"; status: 401 | 403 }
  | { action: "page-login"; status: 401 | 403 };

export function requiresAdminRoute(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/progress" ||
    pathname.startsWith("/progress/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

export function getProtectedRouteDecision(
  pathname: string,
  role: SessionRole | null | undefined,
): ProtectedRouteDecision {
  if (!requiresAdminRoute(pathname)) {
    return {
      action: "allow",
    };
  }

  if (role === "ADMIN") {
    return {
      action: "allow",
    };
  }

  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return {
      action: "api-error",
      status: role ? 403 : 401,
    };
  }

  return {
    action: "page-login",
    status: role ? 403 : 401,
  };
}

export function loginRedirectPath(pathAndSearch: string, status: 401 | 403) {
  const params = new URLSearchParams({
    next: pathAndSearch,
    auth: status === 403 ? "forbidden" : "required",
  });

  return `/login?${params.toString()}`;
}
