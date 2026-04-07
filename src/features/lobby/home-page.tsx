import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Eye, Plus, Trash2, Users } from "lucide-react";
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
import { Label } from "../../components/ui/label";
import { formatRelativeTime } from "../../lib/time";
import { trpc } from "../../lib/trpc";

type Filter = "active" | "new" | "archived";

interface HomePageProps {
  user: {
    id: string;
    username: string;
  };
}

export function HomePage({ user }: HomePageProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<Filter>("active");
  const [name, setName] = useState("");
  const [color, setColor] = useState<"white" | "black" | "random">("random");
  const [error, setError] = useState<string | null>(null);
  const [gameId, setGameId] = useState("");

  const lobbyQuery = trpc.lobby.list.useQuery();

  trpc.lobby.onChanged.useSubscription(undefined, {
    onData: async () => {
      await utils.lobby.list.invalidate();
    }
  });

  const createGame = trpc.lobby.create.useMutation({
    onSuccess: async (result) => {
      setName("");
      setError(null);
      await utils.lobby.list.invalidate();
      navigate(`/games/${result.slug}`);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  const joinGame = trpc.lobby.join.useMutation({
    onSuccess: async (result) => {
      await utils.lobby.list.invalidate();
      navigate(`/games/${result.slug}`);
    }
  });

  const deleteGame = trpc.lobby.delete.useMutation({
    onSuccess: async () => {
      await utils.lobby.list.invalidate();
    }
  });

  const filteredGames = (lobbyQuery.data ?? []).filter((game) => {
    const isParticipant = game.users.some((member) => member.userId === user.id);

    if (filter === "active") {
      return isParticipant && !game.archived;
    }

    if (filter === "new") {
      return !isParticipant && !game.archived;
    }

    return game.archived;
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    createGame.mutate({ name, color });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-none bg-slate-950 text-stone-100">
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.25),transparent_32%),linear-gradient(135deg,#0f172a_0%,#1e293b_38%,#164e63_100%)]" />
            <div className="relative space-y-5">
              <Badge variant="secondary" className="w-fit bg-white/10 text-stone-100">
                Live lobby
              </Badge>
              <div className="space-y-4">
                <CardTitle className="text-4xl text-stone-50 md:text-5xl">
                  Build a match, invite a rival, make the board move.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base text-stone-200/80">
                  Games update live through tRPC subscriptions, and the UI keeps
                  itself in sync through TanStack Query invalidations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start a game</CardTitle>
            <CardDescription>
              Choose a memorable name and your preferred side.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="name">Game name</Label>
                <Input
                  id="name"
                  placeholder="Saturday rapid rematch"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <select
                  id="color"
                  className="flex h-11 w-full rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  value={color}
                  onChange={(event) =>
                    setColor(event.target.value as "white" | "black" | "random")
                  }
                >
                  <option value="random">Random</option>
                  <option value="white">White</option>
                  <option value="black">Black</option>
                </select>
              </div>
              {error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" disabled={createGame.isPending} type="submit">
                <Plus className="size-4" />
                {createGame.isPending ? "Creating..." : "Create game"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardContent className="flex items-end gap-3 pt-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="gameId">Join or spectate by game ID</Label>
              <Input
                id="gameId"
                placeholder="e.g. saturday-rapid-rematch"
                value={gameId}
                onChange={(event) => setGameId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && gameId.trim()) {
                    navigate(`/games/${gameId.trim()}`);
                  }
                }}
              />
            </div>
            <Button
              disabled={!gameId.trim()}
              onClick={() => navigate(`/games/${gameId.trim()}`)}
            >
              <Eye className="size-4" />
              Go to game
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {(["active", "new", "archived"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "default" : "secondary"}
            onClick={() => setFilter(value)}
          >
            {value}
          </Button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredGames.map((game) => {
          const isParticipant = game.users.some((member) => member.userId === user.id);
          const isOwner =
            game.users[0]?.userId === user.id && game.users.length === 1;
          const actionLabel = isParticipant
            ? game.archived
              ? "Review"
              : "Continue"
            : game.users.length < 2
              ? "Join"
              : "Spectate";

          return (
            <Card key={game.id} className="h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Clock3 className="size-4" />
                      Updated {formatRelativeTime(game.updatedAt)}
                    </CardDescription>
                  </div>
                  <Badge variant={game.archived ? "secondary" : "success"}>
                    {game.archived ? "Archived" : "Live"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="size-4" />
                  <span>{game.users.length} players connected to this board</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.users.map((player) => (
                    <Badge
                      key={player.userId}
                      variant={player.color === "none" ? "outline" : "secondary"}
                    >
                      {player.name} · {player.color}
                    </Badge>
                  ))}
                  {game.users.length === 0 ? (
                    <Badge variant="outline">No players yet</Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => joinGame.mutate({ slug: game.slug })}
                    disabled={joinGame.isPending}
                  >
                    {actionLabel}
                    <ArrowRight className="size-4" />
                  </Button>
                  {isOwner ? (
                    <Button
                      variant="outline"
                      onClick={() => deleteGame.mutate({ slug: game.slug })}
                      disabled={deleteGame.isPending}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {filteredGames.length === 0 && !lobbyQuery.isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Badge variant="outline">Nothing here yet</Badge>
            <CardTitle className="text-2xl">No games in this view</CardTitle>
            <CardDescription className="max-w-md">
              Try another filter, or create a fresh board and invite someone in.
            </CardDescription>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
