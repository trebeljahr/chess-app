import { findGameBySlug, updateGame } from "../src/server/data.js";
import { sqlite } from "../src/server/db.js";

const game = findGameBySlug(process.argv[2]);
if (!game) throw new Error("Synthetic game missing");
process.send?.({ ready: true, version: game.version });
process.once("message", () => {
  const changed = updateGame(game.id, game.version, { state: game.state, updatedAt: Date.now() });
  process.send?.({ changed });
  sqlite.close();
  process.disconnect();
});
