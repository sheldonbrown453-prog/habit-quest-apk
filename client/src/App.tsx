import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import History from "./pages/History";
import Statistics from "./pages/Statistics";
import Achievements from "./pages/Achievements";
import BottomNav from "./components/BottomNav";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center">
              <span className="text-3xl">⚔️</span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm font-display tracking-wider">LOADING QUEST...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-lg">
            <span className="text-5xl">⚔️</span>
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground tracking-wide">
              HabitQuest
            </h1>
            <p className="text-muted-foreground text-sm mt-1 tracking-wider">RPG HABIT TRACKER</p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="w-full space-y-3">
          {[
            { icon: "🏆", text: "Level up by completing habits" },
            { icon: "⚡", text: "Earn XP and unlock warrior tiers" },
            { icon: "🔥", text: "Build streaks and earn achievements" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 bg-card/50 rounded-xl px-4 py-3 border border-border">
              <span className="text-xl">{item.icon}</span>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Login button */}
        <a
          href={getLoginUrl()}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-primary/25"
        >
          <span className="text-lg">⚔️</span>
          Begin Your Quest
        </a>

        <p className="text-xs text-muted-foreground text-center">
          Sign in to track your habits and level up your life
        </p>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/habits" component={Habits} />
          <Route path="/history" component={History} />
          <Route path="/stats" component={Statistics} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-center" />
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
