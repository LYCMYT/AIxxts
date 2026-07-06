import { prisma } from "@/server/db/prisma";
import { runCollectJob } from "@/server/jobs/collect";

async function main() {
  const summary = await runCollectJob();
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
