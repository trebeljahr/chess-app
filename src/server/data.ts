import { eq, sql } from "drizzle-orm";
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

function calculateElo(
  rating: number,
  opponentRating: number,
  score: number // 1 = win, 0.5 = draw, 0 = loss
): number {
  const K = 32;
  const expected = 1 / (1 + 10 ** ((opponentRating - rating) / 400));
  return Math.round(rating + K * (score - expected));
}

export function recordGameResult(
  winnerId: string | null,
  loserId: string | null,
  isDraw: boolean
): void {
  if (isDraw && winnerId && loserId) {
    const p1 = findUserById(winnerId);
    const p2 = findUserById(loserId);
    if (!p1 || !p2) return;

    const newP1Rating = calculateElo(p1.rating, p2.rating, 0.5);
    const newP2Rating = calculateElo(p2.rating, p1.rating, 0.5);

    db.update(users).set({
      rating: newP1Rating,
      gamesPlayed: sql`games_played + 1`,
      draws: sql`draws + 1`
    }).where(eq(users.id, winnerId)).run();

    db.update(users).set({
      rating: newP2Rating,
      gamesPlayed: sql`games_played + 1`,
      draws: sql`draws + 1`
    }).where(eq(users.id, loserId)).run();
    return;
  }

  if (!winnerId || !loserId) return;

  const winner = findUserById(winnerId);
  const loser = findUserById(loserId);
  if (!winner || !loser) return;

  const newWinnerRating = calculateElo(winner.rating, loser.rating, 1);
  const newLoserRating = calculateElo(loser.rating, winner.rating, 0);

  db.update(users).set({
    rating: newWinnerRating,
    gamesPlayed: sql`games_played + 1`,
    wins: sql`wins + 1`
  }).where(eq(users.id, winnerId)).run();

  db.update(users).set({
    rating: newLoserRating,
    gamesPlayed: sql`games_played + 1`,
    losses: sql`losses + 1`
  }).where(eq(users.id, loserId)).run();
}

export function getUserProfile(userId: string): {
  username: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
} | null {
  const user = findUserById(userId);
  if (!user) return null;
  return {
    username: user.username,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws
  };
}
