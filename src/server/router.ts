import { compareSync, hashSync } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addChatMessage,
  addPlayerToGame,
  canDeleteGame,
  createDefaultGameState,
  createTimedGameState,
  getJoinColor,
  getViewerColor,
  acceptDraw,
  executeMove,
  forfeitGame,
  invertColor,
  proposeDraw,
  rejectDraw,
  handlePawnPromotion,
  handleUndo,
  isUserInGame,
  pieceToGlyph,
  proposeUndo,
  revertUndoProposal,
  touchPlayer,
  type PieceType,
  type ViewerColor
} from "../shared/chess.js";
import {
  clearSessionCookie,
  createSessionRecord,
  attachSessionCookie
} from "./session.js";
import {
  deleteSession,
  findGameBySlug,
  findUserByUsername,
  getUserProfile,
  insertGame,
  insertSession,
  insertUser,
  listGames,
  recordGameResult,
  removeGame,
  updateGame
} from "./data.js";
import { emitGameUpdate, emitLobbyUpdate, subscribeToChannel } from "./realtime.js";
import { protectedProcedure, publicProcedure, router } from "./trpc.js";

const authSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes, or underscores."),
  password: z.string().min(8).max(72)
});

const createGameSchema = z.object({
  name: z.string().trim().min(3).max(40),
  color: z.enum(["white", "black", "random"]),
  timeControl: z.enum(["untimed", "1+0", "3+0", "3+2", "5+0", "5+3", "10+0", "15+10", "30+0"]).default("untimed")
});

const slugSchema = z.object({
  slug: z.string().trim().min(1)
});

const moveSchema = slugSchema.extend({
  from: z.string().regex(/^[A-H][1-8]$/),
  to: z.string().regex(/^[A-H][1-8]$/)
});

const promoteSchema = slugSchema.extend({
  pieceType: z.enum(["queen", "rook", "bishop", "knight"] satisfies [
    Exclude<PieceType, "king" | "pawn">,
    ...Array<Exclude<PieceType, "king" | "pawn">>
  ])
});

const messageSchema = slugSchema.extend({
  text: z.string().trim().min(1).max(300)
});

function requireResponse(res: unknown): asserts res is NonNullable<typeof res> {
  if (!res) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Response object missing from context."
    });
  }
}

function chooseColor(preference: "white" | "black" | "random"): ViewerColor {
  if (preference !== "random") {
    return preference;
  }

  return Math.random() > 0.5 ? "white" : "black";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function createUniqueSlug(name: string): string {
  const base = slugify(name) || "game";
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

function toLobbySummary(game: NonNullable<ReturnType<typeof findGameBySlug>>) {
  const state = game.state;

  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    archived: state.archived,
    users: state.users,
    moveCount: state.moveHistory.length - 1
  };
}

function saveGameState(
  gameId: string,
  slug: string,
  state: NonNullable<ReturnType<typeof findGameBySlug>>["state"],
  reason: string,
  previouslyArchived = false
): void {
  updateGame(gameId, {
    state,
    updatedAt: Date.now()
  });
  emitGameUpdate(slug, reason);

  // Record ELO when game ends
  if (state.archived && !previouslyArchived && state.users.length === 2) {
    const whiteUser = state.users.find((u) => u.color === "white");
    const blackUser = state.users.find((u) => u.color === "black");
    if (!whiteUser || !blackUser) return;

    if (state.checkmate) {
      const winnerId = invertColor(state.turn) === "white" ? whiteUser.userId : blackUser.userId;
      const loserId = winnerId === whiteUser.userId ? blackUser.userId : whiteUser.userId;
      recordGameResult(winnerId, loserId, false);
    } else if (state.remis) {
      recordGameResult(whiteUser.userId, blackUser.userId, true);
    } else if (state.clock?.flagged) {
      const loserId = state.clock.flagged === "white" ? whiteUser.userId : blackUser.userId;
      const winnerId = loserId === whiteUser.userId ? blackUser.userId : whiteUser.userId;
      recordGameResult(winnerId, loserId, false);
    }
  }
}

export const appRouter = router({
  auth: router({
    session: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        return null;
      }

      return {
        id: ctx.user.id,
        username: ctx.user.username,
        rating: ctx.user.rating
      };
    }),
    profile: protectedProcedure
      .input(z.object({ userId: z.string().optional() }))
      .query(({ input, ctx }) => {
        const targetId = input.userId ?? ctx.user.id;
        const profile = getUserProfile(targetId);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
        }
        return profile;
      }),
    register: publicProcedure.input(authSchema).mutation(({ input, ctx }) => {
      requireResponse(ctx.res);

      if (findUserByUsername(input.username)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That username is already taken."
        });
      }

      const user = {
        id: crypto.randomUUID(),
        username: input.username,
        passwordHash: hashSync(input.password, 12),
        createdAt: Date.now()
      };

      insertUser(user);

      const session = createSessionRecord(user.id);
      insertSession(session);
      attachSessionCookie(ctx.res, session.id, session.expiresAt);

      return {
        id: user.id,
        username: user.username
      };
    }),
    login: publicProcedure.input(authSchema).mutation(({ input, ctx }) => {
      requireResponse(ctx.res);

      const user = findUserByUsername(input.username);

      if (!user || !compareSync(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password."
        });
      }

      const session = createSessionRecord(user.id);
      insertSession(session);
      attachSessionCookie(ctx.res, session.id, session.expiresAt);

      return {
        id: user.id,
        username: user.username
      };
    }),
    logout: protectedProcedure.mutation(({ ctx }) => {
      requireResponse(ctx.res);

      if (ctx.session) {
        deleteSession(ctx.session.id);
      }

      clearSessionCookie(ctx.res);
      return { success: true };
    })
  }),
  lobby: router({
    list: protectedProcedure.query(() => {
      return listGames()
        .map(toLobbySummary)
        .sort((left, right) => right.updatedAt - left.updatedAt);
    }),
    create: protectedProcedure
      .input(createGameSchema)
      .mutation(({ input, ctx }) => {
        const slug = createUniqueSlug(input.name);
        const timePresets: Record<string, [number, number]> = {
          "1+0": [60_000, 0], "3+0": [180_000, 0], "3+2": [180_000, 2_000],
          "5+0": [300_000, 0], "5+3": [300_000, 3_000], "10+0": [600_000, 0],
          "15+10": [900_000, 10_000], "30+0": [1_800_000, 0]
        };
        const baseState = input.timeControl !== "untimed" && timePresets[input.timeControl]
          ? createTimedGameState(...timePresets[input.timeControl])
          : createDefaultGameState();
        const state = addPlayerToGame(baseState, {
          userId: ctx.user.id,
          name: ctx.user.username,
          color: chooseColor(input.color)
        });

        insertGame({
          id: crypto.randomUUID(),
          slug,
          name: input.name,
          createdById: ctx.user.id,
          state,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        emitLobbyUpdate("game-created", slug);

        return { slug };
      }),
    join: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      if (!isUserInGame(game.state, ctx.user.id)) {
        const nextState = addPlayerToGame(game.state, {
          userId: ctx.user.id,
          name: ctx.user.username,
          color: getJoinColor(game.state)
        });

        saveGameState(game.id, game.slug, nextState, "player-joined");
      }

      return {
        slug: game.slug
      };
    }),
    delete: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      if (!canDeleteGame(game.state, ctx.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator of an empty game can delete it."
        });
      }

      removeGame(game.id);
      emitLobbyUpdate("game-deleted", game.slug);
      return { success: true };
    }),
    onChanged: protectedProcedure.subscription(async function* (opts) {
      yield* subscribeToChannel("lobby", opts.signal);
    })
  }),
  game: router({
    bySlug: protectedProcedure.input(slugSchema).query(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const viewerColor = getViewerColor(game.state, ctx.user.id);

      return {
        id: game.id,
        slug: game.slug,
        name: game.name,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        viewer: {
          id: ctx.user.id,
          username: ctx.user.username,
          color: viewerColor
        },
        game: game.state,
        glyphPreview: pieceToGlyph(game.state.board[0][0].figure)
      };
    }),
    move: protectedProcedure.input(moveSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      try {
        const result = executeMove(
          game.state,
          ctx.user.id,
          input.from,
          input.to
        );
        saveGameState(game.id, game.slug, result.state, "move-made", game.state.archived);
        return { success: true, promotion: result.promotion };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid move.";
        // Only log unexpected errors, not user input validation
        if (!msg.startsWith("Illegal move") && !msg.startsWith("Not your turn")) {
          console.error(`[move] ${input.from} -> ${input.to} failed:`, msg);
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: msg
        });
      }
    }),
    promote: protectedProcedure.input(promoteSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = handlePawnPromotion(game.state, ctx.user.id, input.pieceType);
      saveGameState(game.id, game.slug, nextState, "pawn-promoted", game.state.archived);

      return { success: true };
    }),
    sendMessage: protectedProcedure.input(messageSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = addChatMessage(game.state, {
        text: input.text,
        user: ctx.user.username
      });

      saveGameState(game.id, game.slug, nextState, "message-added");
      return { success: true };
    }),
    proposeUndo: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = proposeUndo(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "undo-proposed");
      return { success: true };
    }),
    revertUndo: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = revertUndoProposal(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "undo-reverted");
      return { success: true };
    }),
    acceptUndo: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = handleUndo(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "undo-accepted");
      return { success: true };
    }),
    proposeDraw: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);
      if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
      const nextState = proposeDraw(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "draw-proposed");
      return { success: true };
    }),
    acceptDraw: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);
      if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
      const nextState = acceptDraw(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "draw-accepted", game.state.archived);
      return { success: true };
    }),
    rejectDraw: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);
      if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
      const nextState = rejectDraw(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "draw-rejected");
      return { success: true };
    }),
    forfeit: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = forfeitGame(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "game-forfeited", game.state.archived);
      return { success: true };
    }),
    rematch: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      if (!game.state.archived) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game is still in progress."
        });
      }

      // If a rematch already exists, just return its slug
      if (game.state.rematchSlug) {
        return { slug: game.state.rematchSlug };
      }

      const viewer = getViewerColor(game.state, ctx.user.id);
      const rematchName = `${game.name} — rematch`;
      const slug = createUniqueSlug(rematchName);
      const state = addPlayerToGame(createDefaultGameState(), {
        userId: ctx.user.id,
        name: ctx.user.username,
        color: chooseColor(viewer === "none" ? "random" : invertColor(viewer))
      });

      insertGame({
        id: crypto.randomUUID(),
        slug,
        name: rematchName,
        createdById: ctx.user.id,
        state,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Link rematch to original game so opponent can find it
      const nextState = { ...game.state, rematchSlug: slug };
      saveGameState(game.id, game.slug, nextState, "rematch-created");
      emitLobbyUpdate("game-created", slug);

      return { slug };
    }),
    heartbeat: protectedProcedure.input(slugSchema).mutation(({ input, ctx }) => {
      const game = findGameBySlug(input.slug);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found."
        });
      }

      const nextState = touchPlayer(game.state, ctx.user.id);
      saveGameState(game.id, game.slug, nextState, "presence-updated");
      return { success: true };
    }),
    onChanged: protectedProcedure.input(slugSchema).subscription(async function* (opts) {
      yield* subscribeToChannel(`game:${opts.input.slug}`, opts.signal);
    })
  })
});

export type AppRouter = typeof appRouter;
