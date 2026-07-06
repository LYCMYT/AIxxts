import { mkdirSync, openSync, closeSync, existsSync } from "node:fs";
import path from "node:path";
import { env } from "@/server/env";

const filePrefix = "file:";

if (!env.DATABASE_URL.startsWith(filePrefix)) {
  console.log("DATABASE_URL is not a local SQLite file URL; skipping database file preparation.");
  process.exit(0);
}

const configuredPath = env.DATABASE_URL.slice(filePrefix.length);
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

mkdirSync(path.dirname(databasePath), { recursive: true });

if (!existsSync(databasePath)) {
  closeSync(openSync(databasePath, "w"));
  console.log(`Created SQLite database file: ${databasePath}`);
} else {
  console.log(`SQLite database file exists: ${databasePath}`);
}
