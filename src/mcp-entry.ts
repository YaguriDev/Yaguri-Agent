import { getDb } from "./db";
import { startMcpServer } from "./mcp/server";

process.on("uncaughtException", (err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[fatal]", err);
  process.exit(1);
});

getDb();
startMcpServer();
