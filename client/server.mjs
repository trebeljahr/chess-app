import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { extname, join } from "node:path";
import { URL } from "node:url";
import { retainAssets, retainedAssetPath } from "./assets.mjs";

const PORT = Number(process.env.PORT ?? 80);
const HOST = process.env.HOST ?? "0.0.0.0";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:3514";
// Off when a router health-checks the API itself (Traefik routes /trpc on
// Coolify). Readiness then covers only HTML and assets, so one draining API
// replica behind a shared alias cannot withdraw every client replica.
const BACKEND_HEALTH_REQUIRED = process.env.BACKEND_HEALTH_REQUIRED !== "false";
const DIST_DIR = process.env.CLIENT_DIST_DIR
  ? process.env.CLIENT_DIST_DIR
  : join(import.meta.dirname, "dist");
const ASSET_STORE_DIR = process.env.ASSET_STORE_DIR;
if (process.env.NODE_ENV === "production" && !ASSET_STORE_DIR)
  throw new Error("ASSET_STORE_DIR must mount the persistent shared asset directory");
retainAssets(DIST_DIR, ASSET_STORE_DIR);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".webp": "image/webp",
};

const indexHtml = readFileSync(join(DIST_DIR, "index.html"));
const sockets = new Set();
let draining = false;

function backendTarget(url) {
  const incoming = new URL(url, "http://client.invalid");
  const target = new URL(BACKEND_URL);
  target.pathname = incoming.pathname;
  target.search = incoming.search;
  return target;
}

function proxyRequest(req, res) {
  const target = backendTarget(req.url);

  const proxyReq = httpRequest(
    {
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.on("error", () => res.destroy());
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on("error", () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.writeHead(502);
    res.end("Bad Gateway");
  });
  req.on("aborted", () => proxyReq.destroy());
  proxyReq.setTimeout(30_000, () => proxyReq.destroy());
  res.on("close", () => {
    if (!res.writableFinished) proxyReq.destroy();
  });

  req.pipe(proxyReq, { end: true });
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;

  // Health check
  if (pathname === "/healthz") {
    let ready = !draining;
    if (ready && BACKEND_HEALTH_REQUIRED) {
      try {
        ready =
          (await fetch(new URL("/health", BACKEND_URL), { signal: AbortSignal.timeout(2500) }))
            .ok && !draining;
      } catch {
        ready = false;
      }
    }
    res.writeHead(ready ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: ready }));
    return;
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  // Proxy /trpc to backend
  if (pathname.startsWith("/trpc")) {
    proxyRequest(req, res);
    return;
  }

  // Serve static files
  let filePath = join(DIST_DIR, pathname);
  try {
    const retained = retainedAssetPath(ASSET_STORE_DIR, pathname);
    if (retained && existsSync(retained)) filePath = retained;
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath);
    const mime = MIME_TYPES[ext] ?? "application/octet-stream";
    const isAsset = pathname.startsWith("/assets/");
    const cacheControl = isAsset
      ? "public, max-age=31536000, immutable"
      : "public, max-age=0, must-revalidate";

    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": cacheControl,
    });
    res.end(readFileSync(filePath));
    return;
  }

  if (pathname.startsWith("/assets/")) {
    res.writeHead(404, { "Cache-Control": "no-store" });
    res.end("Asset unavailable");
    return;
  }

  // SPA fallback
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=0, must-revalidate",
  });
  res.end(indexHtml);
});

// WebSocket upgrade — proxy to backend
server.on("upgrade", (req, socket, head) => {
  if (draining) {
    socket.destroy();
    return;
  }
  if (!req.url?.startsWith("/trpc")) {
    socket.destroy();
    return;
  }

  const target = backendTarget(req.url);

  const proxyReq = httpRequest({
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host,
    },
  });

  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    sockets.add(socket);
    sockets.add(proxySocket);
    const closePair = () => {
      sockets.delete(socket);
      sockets.delete(proxySocket);
      socket.destroy();
      proxySocket.destroy();
    };
    socket.on("close", closePair);
    proxySocket.on("close", closePair);
    socket.on("error", closePair);
    proxySocket.on("error", closePair);
    const responseHeaders = [
      `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}`,
    ];
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) responseHeaders.push(`${key}: ${v}`);
      } else if (value) {
        responseHeaders.push(`${key}: ${value}`);
      }
    }

    socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");
    if (proxyHead.length) socket.write(proxyHead);
    if (head.length) proxySocket.write(head);

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on("error", () => {
    socket.destroy();
  });
  proxyReq.on("response", () => socket.destroy());
  socket.on("close", () => proxyReq.destroy());

  proxyReq.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Client serving on http://${HOST}:${server.address().port}`);
  console.log("Proxying /trpc to the configured backend");
});

function shutdown() {
  if (draining) return;
  draining = true;
  const deadline = setTimeout(() => {
    for (const socket of sockets) socket.destroy();
    server.closeAllConnections();
    process.exit(1);
  }, 28_000);
  deadline.unref();
  setTimeout(() => {
    for (const socket of sockets) socket.end();
    server.close(() => {
      clearTimeout(deadline);
      process.exit(0);
    });
    server.closeIdleConnections();
  }, 20_000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
