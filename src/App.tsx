import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LogOut, Volume2, VolumeOff } from "lucide-react";
import { useToggleSound } from "./lib/use-move-sound";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { AuthScreen } from "./features/auth/auth-screen";
import { GamePage } from "./features/game/game-page";
import { HomePage } from "./features/lobby/home-page";
import { trpc } from "./lib/trpc";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppShell() {
  const utils = trpc.useUtils();
  const sessionQuery = trpc.auth.session.useQuery(undefined, {
    retry: 3,
    retryDelay: 1000
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.session.invalidate();
      await utils.lobby.list.reset();
    }
  });

  if (sessionQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading session...</p>
      </main>
    );
  }

  if (sessionQuery.isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-slate-500">Failed to connect to the server.</p>
        <Button variant="secondary" onClick={() => sessionQuery.refetch()}>
          Retry
        </Button>
      </main>
    );
  }

  if (!sessionQuery.data) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/30 bg-[rgba(248,244,237,0.82)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl">Online Chess</h1>
          </div>
          <div className="flex items-center gap-3">
            <SoundToggle />
            <Badge variant="secondary">{sessionQuery.data.username}</Badge>
            <Button
              variant="ghost"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage user={sessionQuery.data} />} />
        <Route path="/games/:slug" element={<GamePage user={sessionQuery.data} />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}

function SoundToggle() {
  const [enabled, toggle] = useToggleSound();
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label={enabled ? "Mute sounds" : "Unmute sounds"}>
      {enabled ? <Volume2 className="size-4" /> : <VolumeOff className="size-4" />}
    </Button>
  );
}

class ErrorBoundary extends Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-slate-500">
            An unexpected error occurred. Please refresh the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </main>
      );
    }

    return this.props.children;
  }
}
