import { loadEnvConfig } from "@next/env";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { hashPassword } from "@/server/auth/password";

const DEFAULT_ADMIN_EMAIL = "admin@xone.local";
const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!";

loadEnvConfig(process.cwd());

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./data/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const usesDefaultEmail = email === DEFAULT_ADMIN_EMAIL;
  const usesDefaultPassword = password === DEFAULT_ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL cannot be empty.");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD cannot be empty.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    create: {
      email,
      name: "默认管理员",
      passwordHash,
      role: UserRole.ADMIN,
    },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
    },
    where: {
      email,
    },
  });

  console.log(`管理员账号已创建或更新：${user.email}`);

  if (usesDefaultEmail || usesDefaultPassword) {
    console.warn(
      `警告：当前使用默认管理员凭据 ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}，生产环境必须通过 ADMIN_EMAIL 和 ADMIN_PASSWORD 替换。`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
