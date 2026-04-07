import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const databaseFile = resolve(
  process.cwd(),
  process.env.CHESS_DB_FILE ?? "data/chess.db"
);

mkdirSync(dirname(databaseFile), { recursive: true });

const sqlite = new Database(databaseFile);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 1200,
    games_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS games_slug_idx ON games(slug);
  CREATE INDEX IF NOT EXISTS games_updated_at_idx ON games(updated_at);
`);

// Migrations for existing databases
try { sqlite.exec(`ALTER TABLE users ADD COLUMN rating INTEGER NOT NULL DEFAULT 1200`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN games_played INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN wins INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN losses INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
try { sqlite.exec(`ALTER TABLE users ADD COLUMN draws INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
try { sqlite.exec(`DROP INDEX IF EXISTS sqlite_autoindex_games_2`); } catch { /* ignore */ }

export const db = drizzle(sqlite);
export { sqlite };
