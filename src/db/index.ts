import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { runMigrations } from "./migrations";

let _db: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (_db) return _db;

  const dir = path.dirname(config.paths.db);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(config.paths.db);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  runMigrations(_db);

  console.log("[db] Ready:", config.paths.db);
  return _db;
};
