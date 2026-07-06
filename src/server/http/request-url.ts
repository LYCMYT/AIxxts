import type { NextRequest } from "next/server";

export function sameOriginUrl(pathname: string, request: NextRequest): URL {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");

  if (host) {
    return new URL(pathname, `${protocol}://${host}`);
  }

  return new URL(pathname, request.nextUrl.origin);
}
