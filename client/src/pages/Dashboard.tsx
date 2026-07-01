import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { XpFloat, LevelUpOverlay } from "@/components/XpFloat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { tierForLevel } from "../../../shared/rpg";
import { CheckCircle2, SkipForward, Flame, Zap, Star, ChevronRight } from "lucide-react";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = useMemo(() => getTodayDate(), []);
  const utils = trpc.useUtils();

  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; tier: string; icon: string } | null>(null);

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery();
  const { data: quoteData } = trpc.profile.quote.useQuery();
  const { data: habits } = trpc.habits.list.useQuery();
  const { data: todayLogs } = trpc.habits.logsForDate.useQuery({ logDate: today });
  const { data: quests } = trpc.quests.today.useQuery({ date: today });

  const completeHabit = trpc.habits.complete.useMutation({
    onSuccess: (data) => {
      utils.habits.logsForDate.invalidate();
      utils.profile.get.invalidate();
      utils.quests.today.invalidate();
      setXpFloat(data.xpEarned);
      if (data.leveledUp) {
        const tier = tierForLevel(data.newLevel);
        setLevelUp({ level: data.newLevel, tier: data.newTier, icon: tier.icon });
      }
      if (data.unlocked.length > 0) {
        data.unlocked.forEach((a) => {
          toast.success(`Achievement Unlocked: ${a.name}`, {
            description: `+${a.xpReward} XP bonus`,
            icon: a.icon,
            duration: 4000,
          });
        });
      }
    },
  });

  const completeQuest = trpc.quests.complete.useMutation({
    onSuccess: (data) => {
      utils.quests.today.invalidate();
      utils.profile.get.invalidate();
      if (data.xpEarned > 0) setXpFloat(data.xpEarned);
      if (data.leveledUp) {
        const tier = tierForLevel(data.newLevel);
        setLevelUp({ level: data.newLevel, tier: data.newTier, icon: tier.icon });
      }
      data.unlocked.forEach((a) => {
        toast.success(`Achievement Unlocked: ${a.name}`, { icon: a.icon, duration: 4000 });
      });
      toast.success("Quest completed! Bonus XP earned!", { icon: "⭐" });
    },
  });

  const skipHabit = trpc.habits.skip.useMutation({
    onSuccess: () => {
      utils.habits.logsForDate.invalidate();
      toast.info("Habit skipped");
    },
  });

  const dailyHabits = habits?.filter((h) => h.frequency === "daily") ?? [];
  const logMap = new Map(todayLogs?.map((l) => [l.habitId, l.status]));

  const completedToday = dailyHabits.filter((h) => logMap.get(h.id) === "completed").length;
  const completionPct = dailyHabits.length > 0 ? Math.round((completedToday / dailyHabits.length) * 100) : 0;

  const xpIntoLevel = profile?.xpIntoLevel ?? 0;
  const xpNeeded = profile?.xpNeeded ?? 100;
  const xpPct = xpNeeded > 0 ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 0;

  const tierInfo = profile ? tierForLevel(profile.level) : { name: "Novice", icon: "🌱", color: "#6b7280" };

  const tierColorClass: Record<string, string> = {
    Novice: "tier-glow-novice",
    Warrior: "tier-glow-warrior",
    Champion: "tier-glow-champion",
    Legend: "tier-glow-legend",
    Mythic: "tier-glow-mythic",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* XP Float Animation */}
      {xpFloat !== null && (
        <XpFloat amount={xpFloat} onDone={() => setXpFloat(null)} />
      )}
      {/* Level Up Overlay */}
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          tier={levelUp.tier}
          tierIcon={levelUp.icon}
          onDone={() => setLevelUp(null)}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-card to-background px-4 pt-12 pb-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">
              {user?.name?.split(" ")[0] ?? "Warrior"}
            </h1>
          </div>
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2">
            <Flame size={16} className="text-orange-400" />
            <span className="font-bold text-foreground text-sm">{profile?.currentStreak ?? 0}</span>
            <span className="text-muted-foreground text-xs">day streak</span>
          </div>
        </div>

        {/* Avatar + Level Card */}
        <div className={cn(
          "bg-card border border-border rounded-2xl p-4 flex items-center gap-4 card-glow",
          tierColorClass[tierInfo.name]
        )}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/40 flex items-center justify-center">
              <span className="text-3xl">{tierInfo.icon}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              Lv.{profile?.level ?? 1}
            </div>
          </div>

          {/* Level info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-sm font-semibold text-primary">{tierInfo.name}</span>
              <span className="text-xs text-muted-foreground">
                {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 xp-gradient rounded-full transition-all duration-700 ease-out"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap size={10} className="text-accent" />
                {(profile?.xp ?? 0).toLocaleString()} total XP
              </span>
              <span className="text-xs text-muted-foreground">{xpPct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-6">
        {/* Daily Progress */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Today's Progress</h2>
            <span className="text-sm font-bold text-primary">{completedToday}/{dailyHabits.length}</span>
          </div>
          <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{completionPct}% of daily habits completed</p>
        </div>

        {/* Motivational Quote */}
        {quoteData?.quote && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4">
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              "{quoteData.quote}"
            </p>
          </div>
        )}

        {/* Today's Habits */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Today's Habits</h2>
            <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>

          {dailyHabits.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">⚔️</p>
              <p className="text-muted-foreground text-sm">No habits yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Add habits to begin your quest!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dailyHabits.map((habit) => {
                const status = logMap.get(habit.id);
                const isDone = status === "completed";
                const isSkipped = status === "skipped";

                return (
                  <div
                    key={habit.id}
                    className={cn(
                      "bg-card border rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200",
                      isDone ? "border-green-500/30 bg-green-500/5" : "border-border",
                      isSkipped && "opacity-50"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: habit.color + "25", border: `1px solid ${habit.color}40` }}
                    >
                      {habit.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", isDone && "line-through text-muted-foreground")}>
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{habit.category}</span>
                        <span className="text-xs text-accent font-medium flex items-center gap-0.5">
                          <Zap size={9} />+{habit.xpReward} XP
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isDone && !isSkipped && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => skipHabit.mutate({ habitId: habit.id, logDate: today })}
                          className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all"
                          title="Skip"
                        >
                          <SkipForward size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => completeHabit.mutate({ habitId: habit.id, logDate: today })}
                          disabled={completeHabit.isPending}
                          className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 flex items-center justify-center transition-all"
                          title="Complete"
                        >
                          <CheckCircle2 size={14} className="text-green-400" />
                        </button>
                      </div>
                    )}
                    {isDone && (
                      <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Quests */}
        {quests && quests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Star size={16} className="text-accent" />
                Daily Quests
              </h2>
              <span className="text-xs text-muted-foreground">
                {quests.filter((q) => q.quest.isCompleted).length}/3 done
              </span>
            </div>
            <div className="space-y-2">
              {quests.map(({ quest, definition }) => (
                <div
                  key={quest.id}
                  className={cn(
                    "bg-card border rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200",
                    quest.isCompleted ? "border-accent/30 bg-accent/5" : "border-border"
                  )}
                >
                  <span className="text-xl flex-shrink-0">{definition.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm", quest.isCompleted && "line-through text-muted-foreground")}>
                      {definition.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{definition.description}</p>
                    {/* Progress bar */}
                    {!quest.isCompleted && definition.targetValue > 1 && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round((quest.progress / definition.targetValue) * 100))}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {quest.progress} / {definition.targetValue}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className="text-xs text-accent font-medium">+{definition.xpReward} XP</span>
                    {quest.isCompleted ? (
                      <span className="text-xs text-green-400">✓ Done</span>
                    ) : (
                      <button
                        onClick={() => completeQuest.mutate({ questId: quest.id, xpReward: definition.xpReward })}
                        disabled={completeQuest.isPending}
                        className="text-[10px] bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 px-2 py-0.5 rounded-lg transition-all"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier progression teaser */}
        <div className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wider">WARRIOR PROGRESSION</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { name: "Novice", icon: "🌱", level: 1 },
              { name: "Warrior", icon: "⚔️", level: 5 },
              { name: "Champion", icon: "🏆", level: 15 },
              { name: "Legend", icon: "👑", level: 30 },
              { name: "Mythic", icon: "🌟", level: 50 },
            ].map((tier, i) => {
              const currentLevel = profile?.level ?? 1;
              const isUnlocked = currentLevel >= tier.level;
              const isCurrent = i === [1,5,15,30,50].filter(l => currentLevel >= l).length - 1;
              return (
                <div key={tier.name} className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all",
                    isUnlocked ? "border-primary/40 bg-primary/10" : "border-border bg-secondary opacity-40"
                  )}>
                    {tier.icon}
                  </div>
                  <p className={cn("text-[9px] font-medium", isUnlocked ? "text-foreground" : "text-muted-foreground")}>{tier.name}</p>
                  <p className="text-[9px] text-muted-foreground">Lv.{tier.level}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Done", value: profile?.totalCompleted ?? 0, icon: "✅" },
            { label: "Longest Streak", value: `${profile?.longestStreak ?? 0}d`, icon: "🔥" },
            { label: "Level", value: profile?.level ?? 1, icon: "⭐" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="font-bold text-foreground text-lg">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
