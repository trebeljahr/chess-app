import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { AuthScreen } from "./features/auth/auth-screen";
import { GamePage } from "./features/game/game-page";
import { HomePage } from "./features/lobby/home-page";
import { trpc } from "./lib/trpc";

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const utils = trpc.useUtils();
  const sessionQuery = trpc.auth.session.useQuery(undefined, {
    retry: false
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
