import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const RARITY_STYLES = {
  common:    { border: "border-border",         bg: "bg-card",              badge: "bg-secondary text-muted-foreground",   glow: "" },
  rare:      { border: "border-blue-500/40",    bg: "bg-blue-500/5",        badge: "bg-blue-500/20 text-blue-400",         glow: "shadow-blue-500/20" },
  epic:      { border: "border-purple-500/40",  bg: "bg-purple-500/5",      badge: "bg-purple-500/20 text-purple-400",     glow: "shadow-purple-500/20" },
  legendary: { border: "border-yellow-500/50",  bg: "bg-yellow-500/5",      badge: "bg-yellow-500/20 text-yellow-400",     glow: "shadow-yellow-500/30" },
};

type Rarity = keyof typeof RARITY_STYLES;

export default function Achievements() {
  const { data: achievements, isLoading } = trpc.achievements.all.useQuery();

  const unlocked = achievements?.filter((a) => a.unlocked) ?? [];
  const locked = achievements?.filter((a) => !a.unlocked) ?? [];

  const byRarity = (list: typeof achievements) =>
    (list ?? []).sort((a, b) => {
      const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return (order[a.rarity as Rarity] ?? 3) - (order[b.rarity as Rarity] ?? 3);
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {unlocked.length} / {achievements?.length ?? 0} unlocked
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full xp-gradient rounded-full transition-all duration-700"
              style={{ width: achievements?.length ? `${(unlocked.length / achievements.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <>
            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  Unlocked ({unlocked.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {byRarity(unlocked).map((achievement) => {
                    const style = RARITY_STYLES[achievement.rarity as Rarity] ?? RARITY_STYLES.common;
                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "rounded-2xl p-4 border transition-all duration-200 animate-slide-up",
                          style.border, style.bg,
                          style.glow && `shadow-lg ${style.glow}`
                        )}
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{achievement.name}</p>
                        <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">{achievement.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", style.badge)}>
                            {achievement.rarity}
                          </span>
                          <span className="text-accent text-[11px] font-bold">+{achievement.xpReward} XP</span>
                        </div>
                        {achievement.unlockedAt && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div>
                <h2 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Lock size={16} />
                  Locked ({locked.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {byRarity(locked).map((achievement) => {
                    const style = RARITY_STYLES[achievement.rarity as Rarity] ?? RARITY_STYLES.common;
                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "rounded-2xl p-4 border opacity-50 transition-all duration-200",
                          style.border, "bg-card"
                        )}
                      >
                        <div className="text-3xl mb-2 opacity-40">{achievement.icon}</div>
                        <p className="font-semibold text-muted-foreground text-sm leading-tight">{achievement.name}</p>
                        <p className="text-muted-foreground/60 text-[11px] mt-1 leading-relaxed">{achievement.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", style.badge)}>
                            {achievement.rarity}
                          </span>
                          <span className="text-muted-foreground text-[11px]">+{achievement.xpReward} XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {achievements?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4">🏆</span>
                <p className="text-foreground font-semibold">No achievements yet</p>
                <p className="text-muted-foreground text-sm mt-1">Complete habits to unlock achievements</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
