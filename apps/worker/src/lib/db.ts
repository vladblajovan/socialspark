import { createDb, type Database } from "@socialspark/db";
import { getEnv } from "./env";

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = createDb(getEnv().DATABASE_URL);
  }
  return _db;
}
