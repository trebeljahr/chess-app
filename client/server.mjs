import { createServer, request as httpRequest } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { URL } from "node:url";

const PORT = Number(process.env.PORT ?? 80);
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:3514";
const DIST_DIR = join(import.meta.dirname, "dist");

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

function proxyRequest(req, res) {
  const target = new URL(req.url, BACKEND_URL);

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
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", () => {
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.pipe(proxyReq, { end: true });
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;

  // Health check
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
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
  const filePath = join(DIST_DIR, pathname);

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

  // SPA fallback
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=0, must-revalidate",
  });
  res.end(indexHtml);
});

// WebSocket upgrade — proxy to backend
server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/trpc")) {
    socket.destroy();
    return;
  }

  const target = new URL(req.url, BACKEND_URL);

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

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on("error", () => {
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Client serving on http://0.0.0.0:${PORT}`);
  console.log(`Proxying /trpc to ${BACKEND_URL}`);
});
