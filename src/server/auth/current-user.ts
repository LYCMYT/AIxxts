import { cookies } from "next/headers";
import { UserRole, type UserRole as UserRoleValue } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export type CurrentUser = {
  email: string;
  id: string;
  name: string | null;
  role: UserRoleValue;
};

export class AuthenticationError extends Error {
  readonly status = 401;

  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message = "Admin access required.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      name: true,
      role: true,
    },
    where: {
      id: session.userId,
    },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    throw new AuthorizationError();
  }

  return user;
}
