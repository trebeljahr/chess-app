// Rewrites games whose state still holds full boards in oldBoards (releases
// before boardHistory), then vacuums so the database file shrinks.
//
//   pnpm migrate:compact-games [--dry-run]
//   node dist/server/server/compact-games.js [--dry-run]    inside the server image
//
// Safe beside running servers. Each batch is one IMMEDIATE transaction, so no
// write lands between reading a row and rewriting it. The game itself does not
// change, so version and updated_at stay: a server holding the old version can
// still save, and the lobby order stays the same.
import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { type GameState, normalizeGameState } from "../shared/chess.js";
import { sqlite } from "./db.js";

const BATCH_SIZE = 25;

export function compactGames(dryRun = false) {
  const ids = sqlite
    .prepare(
      `SELECT id FROM games
       WHERE json_array_length(state, '$.oldBoards') > 0
          OR json_extract(state, '$.boardHistory') IS NULL`,
    )
    .pluck()
    .all() as string[];
  const read = sqlite.prepare("SELECT state FROM games WHERE id = ?").pluck();
  const write = sqlite.prepare("UPDATE games SET state = ? WHERE id = ?");
  const totals = { games: 0, bytesBefore: 0, bytesAfter: 0 };

  const compactBatch = sqlite.transaction((batch: string[]) => {
    for (const id of batch) {
      const stored = read.get(id) as string | undefined;
      if (stored === undefined) continue; // deleted since the id scan

      const compact = JSON.stringify(normalizeGameState(JSON.parse(stored) as GameState));
      totals.games += 1;
      totals.bytesBefore += Buffer.byteLength(stored);
      totals.bytesAfter += Buffer.byteLength(compact);
      if (!dryRun) write.run(compact, id);
    }
  });

  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE);
    if (dryRun) compactBatch(batch);
    else compactBatch.immediate(batch);
  }

  return totals;
}

function fileBytes(): number {
  const file = sqlite.name;
  return statSync(file).size + (existsSync(`${file}-wal`) ? statSync(`${file}-wal`).size : 0);
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dryRun = process.argv.includes("--dry-run");
  const sizeBefore = fileBytes();
  const { games, bytesBefore, bytesAfter } = compactGames(dryRun);

  console.log(
    `${dryRun ? "Would compact" : "Compacted"} ${games} games in ${sqlite.name}: ` +
      `state ${mb(bytesBefore)} -> ${mb(bytesAfter)}`,
  );

  if (!dryRun && games > 0) {
    sqlite.exec("VACUUM");
    // The main file only shrinks once the WAL is checkpointed; a server's open
    // read can delay that until its next automatic checkpoint.
    sqlite.pragma("wal_checkpoint(TRUNCATE)");
    console.log(`Database file and WAL: ${mb(sizeBefore)} -> ${mb(fileBytes())}`);
  }

  sqlite.close();
}
