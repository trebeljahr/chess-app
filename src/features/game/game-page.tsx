import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Eye,
  Flag,
  Link,
  MessageCircle,
  RefreshCcw,
  Send,
  UserPlus
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
  type ChessMove,
  type MoveHistoryEntry,
  type PieceColor,
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
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [copied, setCopied] = useState<"link" | "id" | null>(null);

  const gameQuery = trpc.game.bySlug.useQuery(
    { slug },
    {
      enabled: Boolean(slug),
      retry: false
    }
  );

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
  const forfeit = trpc.game.forfeit.useMutation({
    onSuccess: () => setShowForfeitConfirm(false)
  });
  const rematch = trpc.game.rematch.useMutation({
    onSuccess: (data) => navigate(`/games/${data.slug}`)
  });
  const joinRematch = trpc.lobby.join.useMutation({
    onSuccess: (data) => navigate(`/games/${data.slug}`)
  });
  const joinGame = trpc.lobby.join.useMutation({
    onSuccess: async () => {
      await utils.game.bySlug.invalidate({ slug });
    }
  });

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
  const gameData = gameQuery.data?.game;
  const oldBoards = gameData?.oldBoards ?? [];
  let displayBoard = gameData?.board;

  if (viewIndex !== null && gameData) {
    // Use the oldBoard at this index if it exists, otherwise use the
    // current board (handles the last entry and missing entries)
    displayBoard = oldBoards[viewIndex] ?? gameData.board;
  }

  const displayState = gameData
    ? { ...gameData, board: displayBoard ?? gameData.board }
    : undefined;
  const isScrubbing =
    viewIndex !== null && displayBoard !== gameData?.board;

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

  const whitePlayer = game.users.find((u) => u.color === "white");
  const blackPlayer = game.users.find((u) => u.color === "black");
  const topPlayer =
    viewer.color === "black" ? whitePlayer : blackPlayer;
  const bottomPlayer =
    viewer.color === "black" ? blackPlayer : whitePlayer;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-3 py-6 md:px-8 md:py-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" className="-ml-3" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" />
            Back to lobby
          </Button>
          <h1 className="text-3xl md:text-4xl">{name}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="size-4" />
            Updated {formatRelativeTime(updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewer.color === "none" && game.users.length < 2 && !game.archived ? (
            <Button
              onClick={() => joinGame.mutate({ slug })}
              disabled={joinGame.isPending}
            >
              <UserPlus className="size-4" />
              {joinGame.isPending ? "Joining..." : "Join game"}
            </Button>
          ) : null}
          {viewer.color === "none" ? (
            <Badge variant="outline">
              <Eye className="size-3" />
              Spectating
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied("link");
              setTimeout(() => setCopied(null), 2000);
            }}
          >
            {copied === "link" ? (
              <Check className="size-4" />
            ) : (
              <Link className="size-4" />
            )}
            <span className="hidden sm:inline">
              {copied === "link" ? "Copied!" : "Copy link"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(slug);
              setCopied("id");
              setTimeout(() => setCopied(null), 2000);
            }}
          >
            {copied === "id" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="hidden sm:inline">
              {copied === "id" ? "Copied!" : slug}
            </span>
          </Button>
          <Badge variant={game.archived ? "secondary" : "success"}>
            {game.archived ? "Archived" : "Live"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="mx-auto w-full max-w-[min(100%,560px)] space-y-3 lg:max-w-none">
          <div className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium",
            game.archived
              ? "bg-stone-100 text-stone-600"
              : game.turn === viewer.color
                ? "border border-teal-200 bg-teal-50 text-teal-800"
                : "bg-stone-100 text-stone-600"
          )}>
            <span className={cn(
              "size-3 rounded-full border border-stone-300",
              game.turn === "white" ? "bg-white" : "bg-stone-900"
            )} />
            {game.archived
              ? getStatusText(viewer.color, game)
              : game.turn === viewer.color
                ? "Your turn"
                : viewer.color === "none"
                  ? `${game.turn}'s turn`
                  : "Opponent's turn"}
          </div>
          <PlayerBar player={topPlayer} isActive={!game.archived && topPlayer?.color === game.turn} timestamp={game.timestamp} />
          <ChessBoard
            archived={game.archived || isScrubbing}
            gameState={displayState!}
            lastMove={lastMove}
            onMove={(from, to) => move.mutate({ slug, from, to })}
            userId={user.id}
            viewerColor={viewer.color}
          />
          <PlayerBar player={bottomPlayer} isActive={!game.archived && bottomPlayer?.color === game.turn} timestamp={game.timestamp} />
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
              <div className="space-y-2">
                {whitePlayer ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="size-3 rounded-full border border-stone-300 bg-white" />
                    <span className="font-medium">White:</span>
                    <span>{whitePlayer.name}</span>
                    <span className={cn(
                      "size-2 rounded-full",
                      Date.now() - whitePlayer.timeStamp < 15_000 ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">White: waiting for player...</div>
                )}
                {blackPlayer ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="size-3 rounded-full border border-stone-300 bg-stone-900" />
                    <span className="font-medium">Black:</span>
                    <span>{blackPlayer.name}</span>
                    <span className={cn(
                      "size-2 rounded-full",
                      Date.now() - blackPlayer.timeStamp < 15_000 ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Black: waiting for player...</div>
                )}
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
              <CardTitle>{game.archived ? "Game over" : "Actions"}</CardTitle>
              <CardDescription>
                {game.archived
                  ? "Scrub through the move history or start a rematch."
                  : "Request a takeback, forfeit, or review moves."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.archived ? (
                game.rematchSlug ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      joinRematch.mutate({ slug: game.rematchSlug! })
                    }
                    disabled={joinRematch.isPending}
                  >
                    {joinRematch.isPending ? "Joining..." : "Join rematch"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => rematch.mutate({ slug })}
                    disabled={rematch.isPending}
                  >
                    {rematch.isPending ? "Creating..." : "Rematch"}
                  </Button>
                )
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {!undoOfferedBy ? (
                      <Button
                        variant="secondary"
                        onClick={() => proposeUndo.mutate({ slug })}
                        disabled={
                          viewer.color === "none" ||
                          game.moveHistory.length <= 1 ||
                          proposeUndo.isPending
                        }
                      >
                        <RefreshCcw className="size-4" />
                        Request undo
                      </Button>
                    ) : null}
                    {undoOfferedBy === viewer.color ? (
                      <Button
                        variant="outline"
                        onClick={() => revertUndo.mutate({ slug })}
                        disabled={revertUndo.isPending}
                      >
                        Withdraw undo request
                      </Button>
                    ) : null}
                    {undoOfferedBy && undoOfferedBy !== viewer.color ? (
                      <>
                        <Button
                          onClick={() => acceptUndo.mutate({ slug })}
                          disabled={viewer.color === "none" || acceptUndo.isPending}
                        >
                          <Check className="size-4" />
                          Accept undo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => revertUndo.mutate({ slug })}
                          disabled={revertUndo.isPending}
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="destructive"
                      onClick={() => setShowForfeitConfirm(true)}
                      disabled={viewer.color === "none"}
                    >
                      <Flag className="size-4" />
                      Forfeit
                    </Button>
                  </div>
                  {showForfeitConfirm ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                      <p className="text-sm font-medium text-rose-900">
                        Do you really want to forfeit? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={forfeit.isPending}
                          onClick={() => forfeit.mutate({ slug })}
                        >
                          {forfeit.isPending ? "Forfeiting..." : "Yes, forfeit"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowForfeitConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
              <Separator />
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {game.moveHistory.map((move, index) => {
                  const entry = move as MoveHistoryEntry;
                  let moveColor: PieceColor | null = null;
                  if ("kind" in entry) {
                    if (entry.kind === "forfeit") moveColor = entry.color;
                  } else {
                    moveColor = (entry as ChessMove).figure.color;
                  }

                  return (
                    <button
                      key={index}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition hover:bg-stone-100",
                        viewIndex === index
                          ? "border-teal-500 bg-teal-50"
                          : "border-stone-200 bg-stone-50"
                      )}
                      onClick={() => setViewIndex(viewIndex === index ? null : index)}
                      type="button"
                    >
                      {moveColor ? (
                        <span
                          className={cn(
                            "size-3 shrink-0 rounded-full border border-stone-300",
                            moveColor === "white" ? "bg-white" : "bg-stone-900"
                          )}
                        />
                      ) : null}
                      <span className="flex-1">{formatMove(entry)}</span>
                      {index === game.moveHistory.length - 1 ? (
                        <Badge variant="outline">latest</Badge>
                      ) : null}
                    </button>
                  );
                })}
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

function useElapsedTime(timestamp: number, active: boolean): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    setNow(Date.now());
  }, [timestamp]);

  if (!active) return "";

  const elapsed = Math.max(0, Math.floor((now - timestamp) / 1000));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface GameUser {
  userId: string;
  name: string;
  color: "white" | "black" | "none";
  timeStamp: number;
}

function PlayerBar({
  player,
  isActive,
  timestamp
}: {
  player: GameUser | undefined;
  isActive: boolean;
  timestamp: number;
}) {
  const elapsed = useElapsedTime(timestamp, isActive);

  if (!player) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-2 text-sm text-slate-400">
        Waiting for opponent...
      </div>
    );
  }

  const isOnline = Date.now() - player.timeStamp < 15_000;

  return (
    <div className={cn(
      "flex items-center justify-between rounded-2xl px-4 py-2 text-sm",
      isActive ? "bg-teal-50 border border-teal-200" : "bg-stone-100"
    )}>
      <div className="flex items-center gap-2">
        <span className={cn(
          "size-3 rounded-full border border-stone-300",
          player.color === "white" ? "bg-white" : "bg-stone-900"
        )} />
        <span className="font-medium">{player.name}</span>
        <span className={cn(
          "size-2 rounded-full",
          isOnline ? "bg-emerald-500" : "bg-slate-300"
        )} />
      </div>
      {elapsed ? (
        <span className="tabular-nums text-xs text-slate-500">{elapsed}</span>
      ) : null}
    </div>
  );
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
