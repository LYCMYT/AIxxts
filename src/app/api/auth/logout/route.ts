import { NextResponse, type NextRequest } from "next/server";
import {
  getExpiredSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session";
import { sameOriginUrl } from "@/server/http/request-url";

export const runtime = "nodejs";

function isJsonRequest(request: NextRequest): boolean {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = isJsonRequest(request)
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(sameOriginUrl("/", request), 303);

  response.cookies.set(SESSION_COOKIE_NAME, "", getExpiredSessionCookieOptions());

  return response;
}
