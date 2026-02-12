import { createDb, type Database } from "@socialspark/db";

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = createDb(process.env.DATABASE_URL!);
  }
  return _db;
}
