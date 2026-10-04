import assert from "node:assert/strict";
import { execFileSync, fork, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createTRPCClient, createWSClient, httpBatchLink, wsLink } from "@trpc/client";
import superjson from "superjson";
import WebSocket from "ws";

async function until(predicate, label, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await predicate()) return;
    await delay(50);
  }
  throw new Error(`Timed out: ${label}`);
}

async function freePort() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const port = 49152 + Math.floor(Math.random() * 16384);
    const listener = createServer();
    try {
      listener.listen(port, "127.0.0.1");
      await once(listener, "listening");
      await new Promise((done) => listener.close(done));
      return port;
    } catch {
      listener.close();
    }
  }
  throw new Error("No free fixture port");
}

test("two real servers share SQLite, recover Redis gaps, and preserve authenticated subscriptions across retirement", {
  timeout: 90000,
}, async () => {
  const dir = await mkdtemp(join(tmpdir(), "chess-rolling-"));
  const dbFile = join(dir, "synthetic.db");
  const assetStore = join(dir, "retained-assets");
  const clientDist = join(dir, "client");
  await mkdir(join(clientDist, "assets"), { recursive: true });
  await writeFile(join(clientDist, "index.html"), "<title>Synthetic Chess client</title>");
  await writeFile(join(clientDist, "assets", "synthetic-entry.js"), "/* fixture */");
  const redisPort = await freePort();
  const redisName = `chess-rolling-${process.pid}-${crypto.randomUUID().slice(0, 8)}`;
  const docker = (...args) =>
    execFileSync("docker", args, {
      encoding: "utf8",
      timeout: 15000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  const children = [],
    sockets = [],
    subscriptions = [];
  const env = {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: "0",
    CHESS_DB_FILE: dbFile,
    REDIS_URL: `redis://127.0.0.1:${redisPort}`,
  };
  let paused = false;
  let created = false;
  let stopSampling = async () => {};
  async function server() {
    const child = spawn(process.execPath, ["--import", "tsx", "src/server/index.ts"], {
      cwd: resolve("."),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.push(child);
    child.stdout.setEncoding("utf8");
    child.stderr.resume();
    let output = "";
    child.stdout.on("data", (chunk) => {
      output = (output + chunk).slice(-10000);
    });
    await until(() => /Chess app listening on http:\/\/127.0.0.1:\d+/.test(output), "server start");
    const origin = output.match(/Chess app listening on (http:\/\/127.0.0.1:\d+)/)[1];
    await until(async () => (await fetch(`${origin}/health`)).status === 200, "server readiness");
    const proxy = spawn(process.execPath, ["client/server.mjs"], {
      cwd: resolve("."),
      env: {
        ...env,
        CLIENT_DIST_DIR: clientDist,
        ASSET_STORE_DIR: assetStore,
        BACKEND_URL: origin,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.push(proxy);
    let proxyOutput = "";
    proxy.stdout.on("data", (chunk) => {
      proxyOutput = (proxyOutput + chunk).slice(-5000);
    });
    proxy.stderr.resume();
    await until(() => /Client serving on http:\/\/127.0.0.1:\d+/.test(proxyOutput), "proxy start");
    const proxyOrigin = proxyOutput.match(/Client serving on (http:\/\/127.0.0.1:\d+)/)[1];
    await until(
      async () => (await fetch(`${proxyOrigin}/healthz`)).status === 200,
      "proxy readiness",
    );
    return { child, proxy, origin: proxyOrigin };
  }
  function http(origin, initialCookie = "") {
    let cookie = initialCookie;
    const client = createTRPCClient({
      links: [
        httpBatchLink({
          url: `${origin}/trpc`,
          transformer: superjson,
          headers: () => ({ cookie }),
          fetch: async (url, options) => {
            const response = await fetch(url, options);
            const value = response.headers.get("set-cookie");
            if (value) cookie = value.split(";")[0];
            return response;
          },
        }),
      ],
    });
    return { client, cookie: () => cookie };
  }
  function ws(origin, cookie, events) {
    class AuthSocket extends WebSocket {
      constructor(url, protocols) {
        super(url, protocols, { headers: { Cookie: cookie } });
      }
    }
    const transport = createWSClient({
      url: () => `${origin().replace("http:", "ws:")}/trpc`,
      WebSocket: AuthSocket,
      retryDelayMs: () => 100,
    });
    sockets.push(transport);
    const client = createTRPCClient({
      links: [wsLink({ client: transport, transformer: superjson })],
    });
    subscriptions.push(
      client.lobby.onChanged.subscribe(undefined, {
        onData: (event) => events.push(event),
        onError: () => {},
      }),
    );
    return client;
  }
  try {
    docker(
      "run",
      "-d",
      "--name",
      redisName,
      "--memory",
      "64m",
      "--cpus",
      "0.25",
      "-p",
      `127.0.0.1:${redisPort}:6379`,
      "redis:7-alpine",
      "redis-server",
      "--save",
      "",
      "--appendonly",
      "no",
      "--maxmemory",
      "16mb",
    );
    created = true;
    const a = await server(),
      b = await server();
    const one = http(a.origin),
      two = http(b.origin);
    await one.client.auth.register.mutate({
      username: "rolling_white",
      password: "synthetic-fixture-password",
    });
    await two.client.auth.register.mutate({
      username: "rolling_black",
      password: "synthetic-fixture-password",
    });
    const oneB = http(b.origin, one.cookie());
    const revokedUser = http(a.origin);
    await revokedUser.client.auth.register.mutate({
      username: "rolling_revoked",
      password: "synthetic-fixture-password",
    });
    const revokedEvents = [];
    const revokedSocket = ws(() => a.origin, revokedUser.cookie(), revokedEvents);
    await until(() => revokedEvents.length > 0, "pre-revocation authenticated socket");
    await http(b.origin, revokedUser.cookie()).client.auth.logout.mutate();
    await assert.rejects(
      revokedSocket.lobby.create.mutate({
        name: "Must not create",
        color: "white",
        timeControl: "untimed",
      }),
      /Please sign in first/,
    );
    const game = await one.client.lobby.create.mutate({
      name: "Synthetic rolling game",
      color: "white",
      timeControl: "untimed",
    });
    await two.client.lobby.join.mutate({ slug: game.slug });
    assert.equal((await oneB.client.game.bySlug.query({ slug: game.slug })).game.users.length, 2);

    // Independent SQLite connections read the same version, then race a CAS.
    const workers = [0, 1].map(() =>
      fork("tests/rolling-cas-worker.ts", [game.slug], {
        cwd: resolve("."),
        env,
        execArgv: ["--import", "tsx"],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      }),
    );
    children.push(...workers);
    const ready = await Promise.all(workers.map((child) => once(child, "message")));
    assert.equal(ready[0][0].version, ready[1][0].version);
    const results = workers.map((child) => once(child, "message"));
    for (const child of workers) child.send("write");
    assert.equal((await Promise.all(results)).filter(([result]) => result.changed).length, 1);

    let activeOrigin = a.origin;
    const eventsA = [],
      eventsB = [];
    const socketA = ws(() => activeOrigin, one.cookie(), eventsA);
    ws(() => b.origin, two.cookie(), eventsB);
    await until(() => eventsA.length > 0 && eventsB.length > 0, "initial subscription snapshots");
    const unrelated = await two.client.lobby.create.mutate({
      name: "Another synthetic game",
      color: "white",
      timeControl: "untimed",
    });
    const gameEvents = [],
      unrelatedEvents = [];
    subscriptions.push(
      socketA.game.onChanged.subscribe(
        { slug: game.slug },
        { onData: (event) => gameEvents.push(event), onError: () => {} },
      ),
    );
    subscriptions.push(
      socketA.game.onChanged.subscribe(
        { slug: unrelated.slug },
        { onData: (event) => unrelatedEvents.push(event), onError: () => {} },
      ),
    );
    await until(() => gameEvents.length && unrelatedEvents.length, "game subscriptions");
    const unrelatedCount = unrelatedEvents.length;
    let countA = eventsA.length,
      countB = eventsB.length;
    await oneB.client.game.move.mutate({ slug: game.slug, from: "E2", to: "E4" });
    await until(() => eventsA.length > countA && eventsB.length > countB, "cross-replica move");
    await until(() => gameEvents.some((event) => event.type === "move-made"), "game channel move");
    assert.equal(
      unrelatedEvents.length,
      unrelatedCount,
      "a move cannot invalidate another game's channel",
    );

    countA = eventsA.length;
    countB = eventsB.length;
    docker("pause", redisName);
    paused = true;
    assert.equal((await fetch(`${a.origin}/healthz`)).status, 503);
    assert.equal((await fetch(`${b.origin}/healthz`)).status, 503);
    docker("unpause", redisName);
    paused = false;
    await until(
      async () =>
        (await fetch(`${a.origin}/healthz`)).status === 200 &&
        (await fetch(`${b.origin}/healthz`)).status === 200,
      "Redis recovery",
    );
    await until(
      () =>
        eventsA.slice(countA).some((e) => e.type === "snapshot-required") &&
        eventsB.slice(countB).some((e) => e.type === "snapshot-required"),
      "same-websocket Redis resnapshot",
    );
    assert.equal(
      (await oneB.client.game.bySlug.query({ slug: game.slug })).game.moveHistory.length,
      2,
    );

    let samples = 0,
      failures = 0,
      sample = true;
    const sampling = (async () => {
      while (sample) {
        try {
          if (
            (await fetch(`${b.origin}/healthz`, { signal: AbortSignal.timeout(3000) })).status !==
            200
          )
            failures++;
        } catch {
          failures++;
        }
        samples++;
        await delay(150);
      }
    })();
    stopSampling = async () => {
      sample = false;
      await sampling;
    };
    const exit = once(a.child, "exit");
    activeOrigin = b.origin;
    countA = eventsA.length;
    const started = Date.now();
    a.child.kill("SIGTERM");
    await until(async () => (await fetch(`${a.origin}/healthz`)).status === 503, "draining health");
    await delay(18500);
    const body = JSON.stringify({ json: { slug: game.slug } });
    const response = new Promise((done, reject) => {
      const req = request(
        `${a.origin}/trpc/game.heartbeat`,
        {
          method: "POST",
          headers: {
            Cookie: one.cookie(),
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          res.resume();
          res.on("end", () => done(res.statusCode));
        },
      );
      req.on("error", reject);
      req.write(body.slice(0, 5));
      // Complete a request accepted before listener close, after the 20s drain.
      void delay(3000).then(() => req.end(body.slice(5)));
    });
    assert.equal(await response, 200);
    const [code, signal] = await exit;
    const drainMs = Date.now() - started;
    assert.equal(code, 0);
    assert.equal(signal, null);
    assert.ok(drainMs >= 20000 && drainMs < 28000);
    await until(() => eventsA.length > countA, "WebSocket reconnect snapshot");
    await two.client.game.move.mutate({ slug: game.slug, from: "E7", to: "E5" });
    assert.equal(
      (await oneB.client.game.bySlug.query({ slug: game.slug })).game.moveHistory.length,
      3,
    );
    sample = false;
    await sampling;
    assert.equal(failures, 0);
    console.log(
      JSON.stringify({
        proof: "chess-two-process",
        samples,
        failures,
        drainMs,
        sharedSqliteCAS: true,
        gameChannelIsolation: true,
        redisPauseReadiness: true,
        redisResnapshot: true,
        authenticatedReconnect: true,
        revokedWebsocketMutationRefused: true,
        actualClientProxies: true,
        acceptedRequestCrossedListenerClose: true,
        preservedMoves: 2,
      }),
    );
  } finally {
    await stopSampling();
    for (const sub of subscriptions) sub.unsubscribe();
    for (const socket of sockets) await socket.close();
    for (const child of children)
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await Promise.all(
      children.map((child) =>
        child.exitCode !== null || child.signalCode !== null ? undefined : once(child, "exit"),
      ),
    );
    if (paused) docker("unpause", redisName);
    if (created) docker("rm", "-f", redisName);
    await rm(dir, { recursive: true, force: true });
  }
});
