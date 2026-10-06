import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket, { WebSocketServer } from "ws";

test("mixed client routing preserves assets and paired proxy sockets", {
  timeout: 15000,
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), "chess-client-runtime-"));
  const children = [];
  let ready = true;
  const backend = createServer((req, res) => {
    if (req.url === "/trpc/partial") {
      res.writeHead(200);
      res.write("incomplete");
      setTimeout(() => res.destroy(), 20);
      return;
    }
    res.writeHead(ready ? 200 : 503);
    res.end(req.url);
  });
  const wss = new WebSocketServer({ server: backend, path: "/trpc" });
  wss.on("connection", (socket) => socket.on("message", (value) => socket.send(value)));
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  const backendUrl = `http://127.0.0.1:${backend.address().port}`;
  let socket;
  try {
    async function client(release, env = {}) {
      const dist = join(directory, release);
      await mkdir(join(dist, "assets"), { recursive: true });
      await writeFile(
        join(dist, "index.html"),
        `<script src="/assets/entry-${release}.js"></script>`,
      );
      await writeFile(join(dist, "assets", `entry-${release}.js`), `release-${release}`);
      const child = spawn(process.execPath, ["client/server.mjs"], {
        cwd: resolve("."),
        env: {
          HOST: "127.0.0.1",
          PORT: "0",
          NODE_ENV: "production",
          CLIENT_DIST_DIR: dist,
          ASSET_STORE_DIR: join(directory, "retained"),
          BACKEND_URL: backendUrl,
          ...env,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      children.push(child);
      child.stderr.resume();
      let output = "";
      child.stdout.on("data", (value) => {
        output += value;
      });
      for (let attempt = 0; attempt < 100; attempt++) {
        const origin = output.match(/Client serving on (http:\/\/127.0.0.1:\d+)/)?.[1];
        if (origin) return origin;
        await delay(20);
      }
      throw new Error("Client start timed out");
    }
    const a = await client("a"),
      b = await client("b"),
      routerChecked = await client("c", { BACKEND_HEALTH_REQUIRED: "false" });
    for (const origin of [a, b]) {
      for (const release of ["a", "b"]) {
        const response = await fetch(`${origin}/assets/entry-${release}.js`);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("cache-control"), /immutable/);
        assert.equal(await response.text(), `release-${release}`);
      }
      assert.equal((await fetch(`${origin}/assets/missing.js`)).status, 404);
      assert.equal((await fetch(`${origin}/healthz`)).status, 200);
    }
    // Absolute-form request targets must not replace the configured backend host.
    const routed = await new Promise((resolve, reject) => {
      const req = request(a, { path: "http://127.0.0.1:1/trpc/test" }, (res) => {
        let text = "";
        res.on("data", (value) => {
          text += value;
        });
        res.on("end", () => resolve(text));
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(routed, "/trpc/test");
    await assert.rejects(fetch(`${a}/trpc/partial`).then((response) => response.text()));
    assert.equal(
      (await fetch(`${a}/healthz`)).status,
      200,
      "upstream reset cannot crash the client proxy",
    );
    socket = new WebSocket(a.replace("http:", "ws:") + "/trpc");
    await once(socket, "open");
    const reply = once(socket, "message");
    socket.send("synthetic");
    assert.equal((await reply)[0].toString(), "synthetic");
    const closed = once(socket, "close");
    for (const upstream of wss.clients) upstream.terminate();
    await Promise.race([
      closed,
      delay(1000).then(() => {
        throw new Error("Proxy retained orphan socket");
      }),
    ]);
    ready = false;
    assert.equal((await fetch(`${b}/healthz`)).status, 503);
    assert.equal(
      (await fetch(`${routerChecked}/healthz`)).status,
      200,
      "a router-checked API cannot withdraw the client",
    );
    console.log(
      JSON.stringify({
        mixedAssetRoutingBothDirections: true,
        backendReadiness: true,
        optionalBackendReadiness: true,
        pairedWebsocketClose: true,
      }),
    );
  } finally {
    socket?.terminate();
    for (const upstream of wss.clients) upstream.terminate();
    wss.close();
    backend.closeAllConnections();
    backend.close();
    for (const child of children)
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await Promise.all(
      children.map((child) =>
        child.exitCode !== null || child.signalCode !== null ? undefined : once(child, "exit"),
      ),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
