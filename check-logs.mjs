import { getDb } from "./server/db.js";
import { monitorLogs } from "./drizzle/schema.js";
import { desc } from "drizzle-orm";

const db = await getDb();
const logs = await db.select().from(monitorLogs).orderBy(desc(monitorLogs.checkedAt)).limit(10);

console.log("Recent monitor logs:");
logs.forEach((l) => {
  console.log(`  ${l.checkedAt}: status=${l.status}, dealsFound=${l.dealsFound}`);
});

process.exit(0);
