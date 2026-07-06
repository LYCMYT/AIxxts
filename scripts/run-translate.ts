import { prisma } from "@/server/db/prisma";
import { runCandidateTranslationJob } from "@/server/jobs/translate-candidates";

async function main() {
  const result = await runCandidateTranslationJob(parseArgs(process.argv.slice(2)));

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(args: string[]) {
  let limit: number | undefined;
  let selectedOnly = true;

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg === "--all") {
      selectedOnly = false;
    }
  }

  return {
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
