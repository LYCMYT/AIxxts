import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session";
import { sameOriginUrl } from "@/server/http/request-url";
import { verifyPassword } from "@/server/auth/password";

export const runtime = "nodejs";

type Credentials = {
  email: string;
  nextPath: string;
  password: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isJsonRequest(request: NextRequest): boolean {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

function safeNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string") {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/api/")) {
    return "/";
  }

  return value;
}

async function readCredentials(request: NextRequest): Promise<Credentials> {
  if (isJsonRequest(request)) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    return {
      email: typeof body.email === "string" ? body.email : "",
      nextPath: safeNextPath(typeof body.next === "string" ? body.next : null),
      password: typeof body.password === "string" ? body.password : "",
    };
  }

  const formData = await request.formData();

  return {
    email: String(formData.get("email") ?? ""),
    nextPath: safeNextPath(formData.get("next")),
    password: String(formData.get("password") ?? ""),
  };
}

function invalidLoginResponse(request: NextRequest, nextPath: string): NextResponse {
  if (isJsonRequest(request)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const url = sameOriginUrl("/", request);
  url.searchParams.set("auth", "disabled");

  if (nextPath !== "/") {
    url.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const credentials = await readCredentials(request);
  const email = normalizeEmail(credentials.email);

  if (!email || !credentials.password) {
    return invalidLoginResponse(request, credentials.nextPath);
  }

  const user = await prisma.user.findUnique({
    select: {
      id: true,
      passwordHash: true,
      role: true,
    },
    where: {
      email,
    },
  });

  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    return invalidLoginResponse(request, credentials.nextPath);
  }

  const token = await createSessionToken({
    role: user.role,
    userId: user.id,
  });

  const response = isJsonRequest(request)
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(sameOriginUrl(credentials.nextPath, request), 303);

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}
