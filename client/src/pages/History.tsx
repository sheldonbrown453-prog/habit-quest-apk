import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "year";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const STATUS_COLORS = {
  completed: "bg-green-500/80 border-green-400/60",
  missed:    "bg-red-500/70 border-red-400/50",
  skipped:   "bg-yellow-500/60 border-yellow-400/50",
  none:      "bg-secondary border-border",
};

const STATUS_ICONS = {
  completed: "✓",
  missed:    "✗",
  skipped:   "–",
  none:      "",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function History() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ date: string; status: string; xp: number } | null>(null);

  const { data: habits } = trpc.habits.list.useQuery();

  const fromDate = viewMode === "month"
    ? formatDate(year, month, 1)
    : `${year}-01-01`;
  const toDate = viewMode === "month"
    ? formatDate(year, month, getDaysInMonth(year, month))
    : `${year}-12-31`;

  const { data: logs } = trpc.habits.logsForHabit.useQuery(
    { habitId: selectedHabitId ?? 0, fromDate, toDate },
    { enabled: selectedHabitId !== null }
  );

  const logMap = useMemo(() => {
    const m = new Map<string, { status: string; xp: number }>();
    logs?.forEach((l) => {
      const d = typeof l.logDate === "string" ? l.logDate : new Date(l.logDate).toISOString().split("T")[0];
      m.set(d, { status: l.status, xp: l.xpEarned });
    });
    return m;
  }, [logs]);

  const selectedHabit = habits?.find((h) => h.id === selectedHabitId);

  function prevPeriod() {
    if (viewMode === "month") {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      setYear(y => y - 1);
    }
  }

  function nextPeriod() {
    if (viewMode === "month") {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else {
      setYear(y => y + 1);
    }
  }

  // Month grid
  function renderMonthGrid() {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: React.ReactNode[] = [];

    // Day headers
    DAY_NAMES.forEach((d) => (
      cells.push(
        <div key={`h-${d}`} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
      )
    ));

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const log = logMap.get(dateStr);
      const status = (log?.status ?? "none") as keyof typeof STATUS_COLORS;
      const isToday = dateStr === today.toISOString().split("T")[0];

      cells.push(
        <button
          key={day}
          onClick={() => setTooltip(tooltip?.date === dateStr ? null : { date: dateStr, status: log?.status ?? "none", xp: log?.xp ?? 0 })}
          className={cn(
            "aspect-square rounded-md flex items-center justify-center text-[11px] font-medium border transition-all duration-150 hover:scale-110",
            STATUS_COLORS[status],
            isToday && "ring-1 ring-primary ring-offset-1 ring-offset-card"
          )}
        >
          {status !== "none" ? (
            <span className="text-white/90 text-[10px]">{STATUS_ICONS[status]}</span>
          ) : (
            <span className="text-muted-foreground/50 text-[10px]">{day}</span>
          )}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    );
  }

  // Year grid (12 months × mini dots)
  function renderYearGrid() {
    return (
      <div className="grid grid-cols-3 gap-3">
        {MONTH_NAMES.map((mName, mIdx) => {
          const days = getDaysInMonth(year, mIdx);
          const firstDay = getFirstDayOfMonth(year, mIdx);
          const dots: React.ReactNode[] = [];

          for (let i = 0; i < firstDay; i++) dots.push(<div key={`e-${i}`} className="w-2 h-2" />);
          for (let d = 1; d <= days; d++) {
            const dateStr = formatDate(year, mIdx, d);
            const log = logMap.get(dateStr);
            const status = (log?.status ?? "none") as keyof typeof STATUS_COLORS;
            dots.push(
              <div
                key={d}
                className={cn("w-2 h-2 rounded-sm border", STATUS_COLORS[status])}
              />
            );
          }

          return (
            <div key={mName} className="bg-card border border-border rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5 text-center">{mName}</p>
              <div className="grid grid-cols-7 gap-0.5">{dots}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Habit History</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your consistency over time</p>

        {/* View mode toggle */}
        <div className="flex gap-2 mt-4">
          {(["month", "year"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                viewMode === mode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Habit selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Select Habit</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {habits?.map((habit) => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabitId(selectedHabitId === habit.id ? null : habit.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                  selectedHabitId === habit.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{habit.icon}</span>
                <span>{habit.name}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedHabitId === null ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📅</span>
            <p className="text-foreground font-semibold">Select a habit above</p>
            <p className="text-muted-foreground text-sm mt-1">to view its completion history</p>
          </div>
        ) : (
          <>
            {/* Period navigation */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
              <button onClick={prevPeriod} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all">
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>
              <span className="font-semibold text-foreground">
                {viewMode === "month"
                  ? `${MONTH_NAMES[month]} ${year}`
                  : `${year}`}
              </span>
              <button onClick={nextPeriod} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all">
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Habit info */}
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: selectedHabit?.color + "20", border: `1px solid ${selectedHabit?.color}40` }}
              >
                {selectedHabit?.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedHabit?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedHabit?.category} · {selectedHabit?.frequency}</p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-card border border-border rounded-2xl p-4">
              {viewMode === "month" ? renderMonthGrid() : renderYearGrid()}
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div className="bg-card border border-border rounded-xl p-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{tooltip.date}</p>
                    <p className={cn(
                      "text-xs font-medium mt-0.5 capitalize",
                      tooltip.status === "completed" && "text-green-400",
                      tooltip.status === "missed" && "text-red-400",
                      tooltip.status === "skipped" && "text-yellow-400",
                      tooltip.status === "none" && "text-muted-foreground",
                    )}>
                      {tooltip.status === "none" ? "No log" : tooltip.status}
                    </p>
                  </div>
                  {tooltip.xp > 0 && (
                    <span className="text-accent font-bold text-sm">+{tooltip.xp} XP</span>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              {(["completed", "missed", "skipped", "none"] as const).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 rounded-sm border", STATUS_COLORS[s])} />
                  <span className="text-xs text-muted-foreground capitalize">{s === "none" ? "No log" : s}</span>
                </div>
              ))}
            </div>

            {/* Stats for period */}
            {logs && logs.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Completed", value: logs.filter(l => l.status === "completed").length, color: "text-green-400" },
                  { label: "Missed", value: logs.filter(l => l.status === "missed").length, color: "text-red-400" },
                  { label: "XP Earned", value: logs.reduce((s, l) => s + l.xpEarned, 0), color: "text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
                    <p className={cn("font-bold text-lg", stat.color)}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
