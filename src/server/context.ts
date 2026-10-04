import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { Response } from "express";
import { getSessionBundle } from "./session.js";

export interface AppContext {
  user: ReturnType<typeof getSessionBundle>["user"];
  session: ReturnType<typeof getSessionBundle>["session"];
  res?: Response;
  clientIp: string;
  refreshSession: () => ReturnType<typeof getSessionBundle>;
}

function buildContext(clientIp: string, cookieHeader?: string, res?: Response): AppContext {
  const bundle = getSessionBundle(cookieHeader);
  return {
    ...bundle,
    clientIp,
    res,
    refreshSession: () => getSessionBundle(cookieHeader),
  };
}

export function createExpressContext({ req, res }: CreateExpressContextOptions): AppContext {
  return buildContext(req.socket.remoteAddress ?? "unknown", req.headers.cookie, res);
}

export function createWsContext(options: CreateWSSContextFnOptions): AppContext {
  return buildContext(options.req.socket.remoteAddress ?? "unknown", options.req.headers.cookie);
}
