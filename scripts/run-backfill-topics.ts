import { prisma } from "@/server/db/prisma";
import { runTopicBackfillJob } from "@/server/jobs/backfill-topics";

async function main() {
  const result = await runTopicBackfillJob(parseArgs(process.argv.slice(2)));

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(args: string[]) {
  let digestDate: string | undefined;
  let force = false;
  let limit: number | undefined;
  let selectedOnly = true;

  for (const arg of args) {
    if (arg.startsWith("--date=")) {
      digestDate = arg.slice("--date=".length);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg === "--all") {
      selectedOnly = false;
      continue;
    }

    if (arg === "--force") {
      force = true;
    }
  }

  return {
    digestDate,
    force,
    limit,
    selectedOnly,
  };
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
