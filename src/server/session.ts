import type { Response } from "express";
import { eq, lt } from "drizzle-orm";
import { parse, serialize } from "cookie";
import { db } from "./db.js";
import { sessions, users, type SessionRecord, type UserRecord } from "./schema.js";

const SESSION_COOKIE_NAME = "chess_app_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export interface SessionBundle {
  session: SessionRecord | null;
  user: UserRecord | null;
}

export function createSessionCookie(sessionId: string, expiresAt: number): string {
  return serialize(SESSION_COOKIE_NAME, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt)
  });
}

export function createExpiredSessionCookie(): string {
  return serialize(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0)
  });
}

export function attachSessionCookie(
  response: Response,
  sessionId: string,
  expiresAt: number
): void {
  response.setHeader("Set-Cookie", createSessionCookie(sessionId, expiresAt));
}

export function clearSessionCookie(response: Response): void {
  response.setHeader("Set-Cookie", createExpiredSessionCookie());
}

export function createSessionRecord(userId: string): SessionRecord {
  return {
    id: crypto.randomUUID(),
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
}

export function getSessionIdFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = parse(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

export function purgeExpiredSessions(): void {
  db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run();
}

export function getSessionBundle(cookieHeader?: string): SessionBundle {
  purgeExpiredSessions();

  const sessionId = getSessionIdFromCookie(cookieHeader);

  if (!sessionId) {
    return {
      session: null,
      user: null
    };
  }

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .all()[0] ?? null;

  if (!session) {
    return {
      session: null,
      user: null
    };
  }

  const user =
    db.select().from(users).where(eq(users.id, session.userId)).all()[0] ?? null;

  return {
    session,
    user
  };
}
