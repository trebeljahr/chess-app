import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { Response } from "express";
import { getSessionBundle } from "./session.js";

export interface AppContext {
  user: ReturnType<typeof getSessionBundle>["user"];
  session: ReturnType<typeof getSessionBundle>["session"];
  res?: Response;
}

function buildContext(cookieHeader?: string, res?: Response): AppContext {
  const bundle = getSessionBundle(cookieHeader);
  return {
    ...bundle,
    res
  };
}

export function createExpressContext({
  req,
  res
}: CreateExpressContextOptions): AppContext {
  return buildContext(req.headers.cookie, res);
}

export function createWsContext(
  options: CreateWSSContextFnOptions
): AppContext {
  return buildContext(options.req.headers.cookie);
}
