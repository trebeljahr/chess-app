import { spawn } from "node:child_process";
import { createServer } from "node:net";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return String(port);
}
const apiPort = process.env.API_PORT || (await freePort());
const clientPort = process.env.PORT || (await freePort());
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
}
for (const [command, env] of [
  [["exec", "tsx", "watch", "src/server/index.ts"], { PORT: apiPort, HOST: "127.0.0.1" }],
  [["exec", "vite"], { PORT: clientPort, API_PORT: apiPort }],
]) {
  const child = spawn("pnpm", command, { stdio: "inherit", env: { ...process.env, ...env } });
  children.push(child);
  child.once("error", () => stop(1));
  child.once("exit", (code) => stop(code ?? 1));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
