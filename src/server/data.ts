import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { games, sessions, users, type GameRecord, type UserRecord } from "./schema.js";

export function findUserById(userId: string): UserRecord | null {
  return db.select().from(users).where(eq(users.id, userId)).all()[0] ?? null;
}

export function findUserByUsername(username: string): UserRecord | null {
  return db.select().from(users).where(eq(users.username, username)).all()[0] ?? null;
}

export function insertUser(user: typeof users.$inferInsert): void {
  db.insert(users).values(user).run();
}

export function insertSession(session: typeof sessions.$inferInsert): void {
  db.insert(sessions).values(session).run();
}

export function deleteSession(sessionId: string): void {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function listGames(): GameRecord[] {
  return db.select().from(games).all();
}

export function findGameBySlug(slug: string): GameRecord | null {
  return db.select().from(games).where(eq(games.slug, slug)).all()[0] ?? null;
}

export function findGameByName(name: string): GameRecord | null {
  return db.select().from(games).where(eq(games.name, name)).all()[0] ?? null;
}

export function insertGame(game: typeof games.$inferInsert): void {
  db.insert(games).values(game).run();
}

export function updateGame(
  gameId: string,
  changes: Pick<GameRecord, "state" | "updatedAt">
): void {
  db.update(games).set(changes).where(eq(games.id, gameId)).run();
}

export function removeGame(gameId: string): void {
  db.delete(games).where(eq(games.id, gameId)).run();
}
