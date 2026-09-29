import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = resolve(import.meta.dirname, "..");
const controller = new AbortController();
const interrupt = () => controller.abort(new Error("Smoke check interrupted"));
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

async function availablePort() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const port = randomInt(49152, 65536);
    const probe = createServer();
    const available = await new Promise((resolve, reject) => {
      probe.once("error", (error) => {
        if (error.code === "EADDRINUSE") resolve(false);
        else reject(error);
      });
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (available) return port;
  }
  throw new Error("No free smoke-test port after three attempts");
}

function startProcess(entry, extraEnv) {
  controller.signal.throwIfAborted();
  const child = spawn(process.execPath, [entry], {
    cwd: rootDir,
    env: { NODE_ENV: "production", HOST: "127.0.0.1", ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  let spawnError;
  child.stdout.on("data", (chunk) => {
    logs = (logs + chunk).slice(-8000);
  });
  child.stderr.on("data", (chunk) => {
    logs = (logs + chunk).slice(-8000);
  });
  const closed = new Promise((resolve) => {
    child.once("error", (error) => {
      spawnError = error;
    });
    child.once("close", resolve);
  });
  return {
    child,
    closed,
    assertRunning() {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`Smoke process exited early.\n${logs}`);
      }
    },
  };
}

function request(url) {
  return fetch(url, {
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2000)]),
  });
}

async function waitForHealth(url, process) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    controller.signal.throwIfAborted();
    process.assertRunning();
    try {
      const response = await request(url);
      const body = await response.json();
      process.assertRunning();
      if (response.ok && body.ok === true) return;
    } catch {
      controller.signal.throwIfAborted();
    }
    await delay(200, undefined, { signal: controller.signal });
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopProcess({ child, closed }) {
  if (child.exitCode !== null || child.signalCode !== null) return closed;
  const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
  child.kill("SIGTERM");
  try {
    await closed;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const processes = [];
  const dataDir = mkdtempSync(join(tmpdir(), "chess-smoke-"));
  try {
    const serverPort = await availablePort();
    const server = startProcess(resolve(rootDir, "dist/server/server/index.js"), {
      PORT: String(serverPort),
      REDIS_URL: "",
      CHESS_DB_FILE: join(dataDir, "chess.db"),
    });
    processes.push(server);
    await waitForHealth(`http://127.0.0.1:${serverPort}/health`, server);

    const clientPort = await availablePort();
    const client = startProcess(resolve(rootDir, "client/server.mjs"), {
      PORT: String(clientPort),
      BACKEND_URL: `http://127.0.0.1:${serverPort}`,
      CLIENT_DIST_DIR: resolve(rootDir, "dist/client"),
    });
    processes.push(client);
    await waitForHealth(`http://127.0.0.1:${clientPort}/healthz`, client);
    const response = await request(`http://127.0.0.1:${clientPort}/`);
    const html = await response.text();
    if (!response.ok || !html.includes('<div id="root"></div>')) {
      throw new Error("Client homepage did not return the built app shell");
    }
    server.assertRunning();
    client.assertRunning();
    console.log("Smoke health check passed.");
  } finally {
    for (const process of processes.reverse()) await stopProcess(process);
    rmSync(dataDir, { recursive: true, force: true });
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
