import { useLocation } from "wouter";
import { LayoutDashboard, ListChecks, CalendarDays, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",             icon: LayoutDashboard, label: "Home"    },
  { path: "/habits",       icon: ListChecks,      label: "Habits"  },
  { path: "/history",      icon: CalendarDays,    label: "History" },
  { path: "/stats",        icon: BarChart3,       label: "Stats"   },
  { path: "/achievements", icon: Trophy,          label: "Awards"  },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                active && "bg-primary/15"
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-wide transition-all duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
