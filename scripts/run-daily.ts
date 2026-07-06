import { runDailyDigestJob } from "@/server/jobs/daily";
import { prisma } from "@/server/db/prisma";

async function main() {
  const result = await runDailyDigestJob({
    digestDate: parseDigestDateArg(process.argv.slice(2)),
  });

  console.log(JSON.stringify(result, null, 2));
}

function parseDigestDateArg(args: string[]) {
  for (const arg of args) {
    if (arg.startsWith("--date=")) {
      return arg.slice("--date=".length);
    }

    if (arg.startsWith("--digestDate=")) {
      return arg.slice("--digestDate=".length);
    }

    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return undefined;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
