import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Flag,
  MessageCircle,
  RefreshCcw,
  Send
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { cn } from "../../lib/utils";
import { formatRelativeTime } from "../../lib/time";
import { trpc } from "../../lib/trpc";
import { useMoveSound } from "../../lib/use-move-sound";
import {
  formatMove,
  invertColor,
  type MoveHistoryEntry,
  type PieceType
} from "../../shared/chess";
import { PieceArt } from "../../components/piece-art";
import { ChessBoard } from "./chess-board";

interface GamePageProps {
  user: {
    id: string;
    username: string;
  };
}

const PROMOTION_OPTIONS: Array<Exclude<PieceType, "king" | "pawn">> = [
  "queen",
  "rook",
  "bishop",
  "knight"
];

export function GamePage({ user }: GamePageProps) {
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  const gameQuery = trpc.game.bySlug.useQuery(
    { slug },
    {
      enabled: Boolean(slug),
      retry: false
    }
  );

  const click = trpc.game.click.useMutation();
  const move = trpc.game.move.useMutation();
  const promote = trpc.game.promote.useMutation();
  const sendMessage = trpc.game.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
    }
  });
  const heartbeat = trpc.game.heartbeat.useMutation();
  const proposeUndo = trpc.game.proposeUndo.useMutation();
  const revertUndo = trpc.game.revertUndo.useMutation();
  const acceptUndo = trpc.game.acceptUndo.useMutation();
  const timeTravel = trpc.game.goBackInTime.useMutation();

  trpc.game.onChanged.useSubscription(
    { slug },
    {
      enabled: Boolean(slug),
      onData: async () => {
        await Promise.all([
          utils.game.bySlug.invalidate({ slug }),
          utils.lobby.list.invalidate()
        ]);
      }
    }
  );

  useEffect(() => {
    if (!slug) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      heartbeat.mutate({ slug });
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [heartbeat, slug]);

  const history = gameQuery.data?.game.moveHistory ?? [];
  useMoveSound(history.length);

  // Reset scrub position when new moves arrive
  useEffect(() => {
    setViewIndex(null);
  }, [history.length]);

  // When scrubbing, find the last actual move at or before viewIndex
  const effectiveIndex = viewIndex ?? history.length - 1;
  let lastMove: MoveHistoryEntry | null = null;

  for (let index = effectiveIndex; index >= 0; index -= 1) {
    const move = history[index];

    if (!("kind" in move)) {
      lastMove = move;
      break;
    }
  }

  // Build a view-only game state when scrubbing through history
  const isScrubbing = viewIndex !== null && viewIndex !== history.length - 1;
  const displayState =
    isScrubbing && gameQuery.data
      ? {
          ...gameQuery.data.game,
          board: gameQuery.data.game.oldBoards[viewIndex] ?? gameQuery.data.game.board
        }
      : gameQuery.data?.game;

  if (gameQuery.isLoading) {
    return <LoadingState />;
  }

  if (!gameQuery.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
            <CardDescription>
              This board does not exist anymore or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="size-4" />
              Back to lobby
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { game, viewer, name, updatedAt } = gameQuery.data;
  const promotionPending =
    Boolean(game.baseLinePawn) && viewer.color === game.turn && !game.archived;
  const undoOfferedBy = game.offerTakeback;

  function handleMessageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    sendMessage.mutate({
      slug,
      text: message
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" className="-ml-3" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" />
            Back to lobby
          </Button>
          <h1 className="text-4xl">{name}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="size-4" />
            Updated {formatRelativeTime(updatedAt)}
          </p>
        </div>
        <Badge variant={game.archived ? "secondary" : "success"}>
          {game.archived ? "Archived board" : "Live board"}
        </Badge>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-4">
          <ChessBoard
            archived={game.archived || isScrubbing}
            gameState={displayState!}
            lastMove={lastMove}
            onMove={(from, to) => move.mutate({ slug, from, to })}
            userId={user.id}
            viewerColor={viewer.color}
          />
          {promotionPending ? (
            <Card>
              <CardHeader>
                <CardTitle>Promote your pawn</CardTitle>
                <CardDescription>
                  Choose the piece that should replace your pawn.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {PROMOTION_OPTIONS.map((pieceType) => (
                  <Button
                    key={pieceType}
                    variant="secondary"
                    className="h-auto min-w-28 flex-col rounded-[22px] py-3"
                    onClick={() => promote.mutate({ slug, pieceType })}
                  >
                    <span className="h-16 w-16">
                      <PieceArt
                        piece={{ color: game.turn, type: pieceType }}
                        title={`${game.turn} ${pieceType}`}
                      />
                    </span>
                    <span className="capitalize">{pieceType}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Match status</CardTitle>
              <CardDescription>{getStatusText(viewer.color, game)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {game.users.map((player) => {
                  const isOnline = Date.now() - player.timeStamp < 15_000;
                  return (
                    <Badge
                      key={player.userId}
                      variant={player.color === "none" ? "outline" : "secondary"}
                      className="gap-2"
                    >
                      <span
                        className={
                          isOnline
                            ? "size-2 rounded-full bg-emerald-500"
                            : "size-2 rounded-full bg-slate-300"
                        }
                      />
                      {player.name} · {player.color}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {game.checkmate ? (
                  <Badge variant="warning">
                    <Flag className="mr-1 size-3.5" />
                    Checkmate
                  </Badge>
                ) : null}
                {game.remis ? <Badge variant="outline">Draw</Badge> : null}
                {game.check && !game.checkmate ? (
                  <Badge variant="warning">
                    <Check className="mr-1 size-3.5" />
                    Check
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Undo and replay</CardTitle>
              <CardDescription>
                Offer a takeback during live play, or scrub through the timeline after the game ends.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => proposeUndo.mutate({ slug })}
                  disabled={
                    game.archived ||
                    viewer.color === "none" ||
                    game.moveHistory.length <= 1 ||
                    proposeUndo.isPending
                  }
                >
                  <RefreshCcw className="size-4" />
                  Request undo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => revertUndo.mutate({ slug })}
                  disabled={game.archived || !undoOfferedBy || revertUndo.isPending}
                >
                  Withdraw
                </Button>
                <Button
                  onClick={() => acceptUndo.mutate({ slug })}
                  disabled={
                    game.archived ||
                    viewer.color === "none" ||
                    !undoOfferedBy ||
                    undoOfferedBy === viewer.color ||
                    acceptUndo.isPending
                  }
                >
                  Accept
                </Button>
              </div>
              <Separator />
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {game.moveHistory.map((move, index) => (
                  <button
                    key={index}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition hover:bg-stone-100",
                      viewIndex === index
                        ? "border-teal-500 bg-teal-50"
                        : "border-stone-200 bg-stone-50"
                    )}
                    onClick={() => setViewIndex(viewIndex === index ? null : index)}
                    type="button"
                  >
                    <span>{formatMove(move as MoveHistoryEntry)}</span>
                    {index === game.moveHistory.length - 1 ? (
                      <Badge variant="outline">latest</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Messages are shared live across everyone in the room.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-72 space-y-3 overflow-y-auto rounded-[24px] bg-stone-100 p-4">
                {game.messages.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-900">{entry.user}</strong>
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{entry.text}</p>
                  </div>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={handleMessageSubmit}>
                <Input
                  placeholder="Type a message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <Button disabled={sendMessage.isPending} type="submit">
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function getStatusText(
  viewerColor: "white" | "black" | "none",
  game: {
    turn: "white" | "black";
    checkmate: boolean;
    remis: boolean;
  }
) {
  if (viewerColor === "none") {
    if (game.checkmate) {
      return `${invertColor(game.turn)} wins by checkmate.`;
    }

    if (game.remis) {
      return "The game ended in a draw.";
    }

    return `It is ${game.turn}'s turn.`;
  }

  if (game.checkmate) {
    return invertColor(game.turn) === viewerColor
      ? "You win."
      : "Your opponent wins.";
  }

  if (game.remis) {
    return "This game is drawn.";
  }

  return game.turn === viewerColor ? "It is your turn." : "It is your opponent's turn.";
}

function LoadingState() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardContent className="py-20 text-center">
          <MessageCircle className="mx-auto size-8 animate-pulse text-slate-400" />
          <p className="mt-4 text-sm text-slate-500">Loading the board...</p>
        </CardContent>
      </Card>
    </main>
  );
}
