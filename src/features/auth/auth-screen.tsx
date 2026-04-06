import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { trpc } from "../../lib/trpc";

type AuthMode = "login" | "register";

export function AuthScreen() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setError(null);
      await utils.auth.session.invalidate();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setError(null);
      await utils.auth.session.invalidate();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  const isPending = login.isPending || register.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "login") {
      login.mutate({ username, password });
      return;
    }

    register.mutate({ username, password });
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-none bg-slate-950 text-stone-100 shadow-[0_30px_100px_-45px_rgba(2,6,23,0.9)]">
          <CardHeader className="relative overflow-hidden pb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.22),transparent_32%),linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)]" />
            <div className="relative space-y-5">
              <div className="space-y-4">
                <CardTitle className="text-4xl text-stone-50 md:text-6xl">
                  Online Chess
                </CardTitle>
                <CardDescription className="max-w-xl text-base text-stone-200/80 md:text-lg">
                  Play chess against other people online. Create a game, invite a
                  friend, and enjoy a match in real time.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
            <FeatureCard
              title="Play Live"
              description="Challenge friends or other players to a real-time chess match."
            />
            <FeatureCard
              title="Instant Updates"
              description="See your opponent's moves appear on the board the moment they play."
            />
            <FeatureCard
              title="Pick Up Anytime"
              description="Games are saved automatically so you can come back and finish later."
            />
          </CardContent>
        </Card>

        <Card className="border-stone-200/80">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{mode === "login" ? "Welcome back" : "Create an account"}</CardTitle>
                <CardDescription>
                  Sign in with a username and password to create, join, and track live games.
                </CardDescription>
              </div>
              <Badge variant="outline">{mode === "login" ? "Login" : "Register"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 rounded-full bg-stone-100 p-1">
              <Button
                variant={mode === "login" ? "default" : "ghost"}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </Button>
              <Button
                variant={mode === "register" ? "default" : "ghost"}
                onClick={() => setMode("register")}
                type="button"
              >
                Register
              </Button>
            </div>
            <Separator />
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  autoComplete="username"
                  id="username"
                  placeholder="rook-and-roll"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  id="password"
                  placeholder="at least 8 characters"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" size="lg" disabled={isPending} type="submit">
                {isPending
                  ? "Working..."
                  : mode === "login"
                    ? "Enter the lobby"
                    : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <h3 className="text-xl text-stone-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-200/75">{description}</p>
    </div>
  );
}
