import { NextResponse, type NextRequest } from "next/server";
import {
  getProtectedRouteDecision,
  loginRedirectPath,
} from "@/server/auth/route-guard";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const decision = getProtectedRouteDecision(pathname, session?.role);

  if (decision.action === "allow") {
    return NextResponse.next();
  }

  if (decision.action === "api-error") {
    return NextResponse.json(
      {
        error:
          decision.status === 403
            ? "Admin access required."
            : "Authentication required.",
      },
      {
        status: decision.status,
      },
    );
  }

  const pathAndSearch = `${pathname}${request.nextUrl.search}`;

  return NextResponse.redirect(
    new URL(loginRedirectPath(pathAndSearch, decision.status), request.url),
  );
}

export const config = {
  matcher: ["/admin/:path*", "/progress/:path*", "/api/admin/:path*"],
};
