import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { Zap, Flame, TrendingUp, Target } from "lucide-react";

const CHART_COLORS = {
  xp: "#8b5cf6",
  completion: "#10b981",
  grid: "rgba(255,255,255,0.05)",
  text: "rgba(255,255,255,0.4)",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
}

export default function Statistics() {
  const { data: overview, isLoading } = trpc.stats.overview.useQuery();
  const { data: xpHistory } = trpc.stats.xpHistory.useQuery({ days: 30 });
  const { data: perHabit } = trpc.stats.perHabit.useQuery();

  const xpChartData = useMemo(() => {
    if (!xpHistory) return [] as { date: string; XP: number }[];
    return xpHistory.map((row) => {
      const d = row.logDate as unknown;
      const dateStr = typeof d === "string" ? (d as string).slice(5) : new Date(d as string).toISOString().slice(5, 10);
      return { date: dateStr, XP: Number(row.totalXp) };
    });
  }, [xpHistory]);

  const habitBarData = useMemo(() => {
    if (!perHabit) return [];
    return [...perHabit]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8)
      .map((h) => ({
        name: h.habit.icon + " " + (h.habit.name.length > 10 ? h.habit.name.slice(0, 10) + "…" : h.habit.name),
        Done: h.completed,
        Missed: h.missed,
        rate: h.rate,
      }));
  }, [perHabit]);

  const profile = overview?.profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your journey at a glance</p>
      </div>

      <div className="px-4 space-y-5 pb-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Completion Rate", value: `${overview?.completionRate ?? 0}%`, icon: <Target size={18} className="text-green-400" />, color: "text-green-400" },
            { label: "Current Streak", value: `${profile?.currentStreak ?? 0} days`, icon: <Flame size={18} className="text-orange-400" />, color: "text-orange-400" },
            { label: "Longest Streak", value: `${profile?.longestStreak ?? 0} days`, icon: <TrendingUp size={18} className="text-blue-400" />, color: "text-blue-400" },
            { label: "Total XP", value: (profile?.xp ?? 0).toLocaleString(), icon: <Zap size={18} className="text-accent" />, color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* XP Over Time */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            XP Earned (Last 30 Days)
          </h2>
          {xpChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Complete habits to see your XP history
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={xpChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.xp} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.xp} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="XP"
                  stroke={CHART_COLORS.xp}
                  strokeWidth={2}
                  fill="url(#xpGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Habit Performance */}
        {habitBarData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target size={16} className="text-green-400" />
              Habit Performance
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={habitBarData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Done" fill={CHART_COLORS.completion} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Missed" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Overall stats */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-foreground mb-3">All-Time Summary</h2>
          <div className="space-y-2">
            {[
              { label: "Total Completed", value: overview?.logStats.completed ?? 0, color: "text-green-400" },
              { label: "Total Missed", value: overview?.logStats.missed ?? 0, color: "text-red-400" },
              { label: "Total Skipped", value: overview?.logStats.skipped ?? 0, color: "text-yellow-400" },
              { label: "Total Logged", value: overview?.total ?? 0, color: "text-foreground" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={cn("font-bold text-sm", row.color)}>{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-habit breakdown */}
        {perHabit && perHabit.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-foreground mb-3">Per-Habit Breakdown</h2>
            <div className="space-y-3">
              {perHabit.map(({ habit, completed, missed, rate }) => (
                <div key={habit.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: habit.color + "20", border: `1px solid ${habit.color}40` }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                      <span className={cn(
                        "text-xs font-bold ml-2",
                        rate >= 70 ? "text-green-400" : rate >= 40 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {rate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{completed} done · {missed} missed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
