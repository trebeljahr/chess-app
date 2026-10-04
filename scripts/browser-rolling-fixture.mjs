// Synthetic, loopback-only manual browser fixture. Never loads project dotenv.
// Commands on stdin: retire-server, retire-client, pause-redis, resume-redis, stop.
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request } from "node:http";
import { createServer as createProbe } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";

const directory = await mkdtemp(join(tmpdir(), "chess-browser-"));
const children = [],
  gateways = [],
  sockets = new Set();
const redisName = `chess-browser-${process.pid}-${crypto.randomUUID().slice(0, 8)}`;
let redisCreated = false,
  paused = false,
  closing = false;
const docker = (...args) =>
  execFileSync("docker", args, { stdio: ["ignore", "pipe", "pipe"], timeout: 15000 });
async function freePort() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const port = 49152 + Math.floor(Math.random() * 16384),
      server = createProbe();
    try {
      server.listen(port, "127.0.0.1");
      await once(server, "listening");
      await new Promise((r) => server.close(r));
      return port;
    } catch {
      server.close();
    }
  }
  throw new Error("No free fixture port");
}
async function health(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Fixture readiness failed");
}
async function child(entry, extra) {
  const port = await freePort();
  const process = spawn(globalThis.process.execPath, [entry], {
    cwd: resolve("."),
    env: { NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(port), ...extra },
    stdio: ["ignore", "ignore", "pipe"],
  });
  process.stderr.resume();
  children.push(process);
  return { process, origin: `http://127.0.0.1:${port}` };
}
async function gateway(target) {
  const port = await freePort();
  const server = createServer((req, res) => {
    const outgoing = request(
      new URL(req.url, target()),
      { method: req.method, headers: req.headers },
      (incoming) => {
        res.writeHead(incoming.statusCode, incoming.headers);
        incoming.pipe(res);
      },
    );
    outgoing.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(outgoing);
  });
  server.on("upgrade", (req, socket, head) => {
    const outgoing = request(new URL(req.url, target()), { headers: req.headers });
    outgoing.on("upgrade", (res, upstream, upstreamHead) => {
      sockets.add(socket);
      sockets.add(upstream);
      const close = () => {
        socket.destroy();
        upstream.destroy();
        sockets.delete(socket);
        sockets.delete(upstream);
      };
      socket.on("close", close);
      upstream.on("close", close);
      socket.on("error", close);
      upstream.on("error", close);
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(res.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n")}\r\n\r\n`,
      );
      if (head.length) upstream.write(head);
      if (upstreamHead.length) socket.write(upstreamHead);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    outgoing.on("error", () => socket.destroy());
    outgoing.on("response", () => socket.destroy());
    outgoing.end();
  });
  gateways.push(server);
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${port}`;
}
async function cleanup() {
  if (closing) return;
  closing = true;
  for (const socket of sockets) socket.destroy();
  for (const server of gateways) {
    server.closeAllConnections();
    server.close();
  }
  for (const child of children)
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null || child.signalCode !== null ? undefined : once(child, "exit"),
    ),
  );
  if (paused) docker("unpause", redisName);
  if (redisCreated) docker("rm", "-f", redisName);
  await rm(directory, { recursive: true, force: true });
}
try {
  const redisPort = await freePort();
  docker(
    "run",
    "-d",
    "--pull=never",
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
  redisCreated = true;
  const settings = {
    REDIS_URL: `redis://127.0.0.1:${redisPort}`,
    CHESS_DB_FILE: join(directory, "synthetic.db"),
  };
  const a = await child("dist/server/server/index.js", settings);
  await health(`${a.origin}/health`);
  const b = await child("dist/server/server/index.js", settings);
  await health(`${b.origin}/health`);
  let activeServer = a.origin;
  const api = await gateway(() => activeServer);
  const clientSettings = {
    CLIENT_DIST_DIR: resolve("dist/client"),
    ASSET_STORE_DIR: join(directory, "assets"),
    BACKEND_URL: api,
  };
  const ca = await child("client/server.mjs", clientSettings);
  await health(`${ca.origin}/healthz`);
  const cb = await child("client/server.mjs", clientSettings);
  await health(`${cb.origin}/healthz`);
  let activeClient = ca.origin;
  const origin = await gateway(() => activeClient);
  console.log(JSON.stringify({ browserFixture: origin, syntheticOnly: true }));
  process.once("SIGINT", () => {
    void cleanup().then(() => process.exit());
  });
  process.once("SIGTERM", () => {
    void cleanup().then(() => process.exit());
  });
  for await (const command of createInterface({ input: process.stdin })) {
    if (command === "stop") break;
    if (command === "retire-server") {
      activeServer = b.origin;
      a.process.kill("SIGTERM");
    } else if (command === "retire-client") {
      activeClient = cb.origin;
      ca.process.kill("SIGTERM");
    } else if (command === "pause-redis") {
      docker("pause", redisName);
      paused = true;
    } else if (command === "resume-redis") {
      docker("unpause", redisName);
      paused = false;
    } else {
      console.log(JSON.stringify({ error: "Unknown fixture command" }));
      continue;
    }
    console.log(JSON.stringify({ accepted: command }));
  }
} finally {
  await cleanup();
}
// Interactive terminals can retain stdin even after the readline iterator ends.
process.exit(0);
