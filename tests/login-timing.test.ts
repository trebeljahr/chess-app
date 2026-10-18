import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { after, test } from "node:test";

const dir = mkdtempSync(join(tmpdir(), "chess-login-"));
process.env.CHESS_DB_FILE = join(dir, "chess.db");
process.env.NODE_ENV = "test";
const { appRouter } = await import("../src/server/router.js");
const { sqlite } = await import("../src/server/db.js");
after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

let peer = 0;
function caller() {
  return appRouter.createCaller({
    user: null,
    session: null,
    clientIp: `peer-${peer++}`,
    res: { setHeader() {} } as never,
    refreshSession: () => ({ user: null, session: null }),
  });
}

async function failedLogin(username: string, password: string): Promise<number> {
  const started = performance.now();
  await assert.rejects(
    caller().auth.login({ username, password }),
    /Invalid username or password\./,
  );
  return performance.now() - started;
}

test("an unknown username takes as long to reject as a wrong password", async () => {
  await caller().auth.register({ username: "player", password: "correct horse" });

  const wrongPassword = Math.min(
    await failedLogin("player", "wrong horse"),
    await failedLogin("player", "wrong horse"),
  );
  const unknownUser = Math.min(
    await failedLogin("nobody", "wrong horse"),
    await failedLogin("nobody", "wrong horse"),
  );

  // Without the decoy hash the miss returns in about 1 ms against about 200 ms.
  assert.ok(
    unknownUser > wrongPassword / 2,
    `unknown ${unknownUser.toFixed(1)} ms, wrong password ${wrongPassword.toFixed(1)} ms`,
  );
});
