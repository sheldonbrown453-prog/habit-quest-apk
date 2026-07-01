import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addXpToProfile,
  completeQuest,
  createHabit,
  deleteHabit,
  getAllAchievements,
  getDailyQuests,
  getFullProfile,
  getHabitLogStats,
  getHabitLogsForDate,
  getHabitLogsForHabit,
  getHabits,
  getOrCreateProfile,
  getUserAchievements,
  getXpHistory,
  logHabitAction,
  unlockAchievement,
  updateHabit,
  updateStreak,
} from "./db";
import { getDailyQuote } from "../shared/rpg";

// ─── Achievement check helper ─────────────────────────────────────────────────

async function checkAndUnlockAchievements(
  userId: number,
  context: {
    totalCompleted?: number;
    level?: number;
    tier?: string;
    streak?: number;
    habitsCreated?: number;
    allQuestsToday?: boolean;
  }
): Promise<Array<{ key: string; name: string; icon: string; xpReward: number }>> {
  const unlocked: Array<{ key: string; name: string; icon: string; xpReward: number }> = [];

  const tryUnlock = async (key: string) => {
    const a = await unlockAchievement(userId, key);
    if (a) {
      unlocked.push({ key: a.key, name: a.name, icon: a.icon, xpReward: a.xpReward });
      // Award bonus XP for achievement
      await addXpToProfile(userId, a.xpReward);
    }
  };

  if (context.totalCompleted !== undefined) {
    if (context.totalCompleted >= 1) await tryUnlock("first_habit");
    if (context.totalCompleted >= 10) await tryUnlock("complete_10");
    if (context.totalCompleted >= 50) await tryUnlock("complete_50");
    if (context.totalCompleted >= 100) await tryUnlock("complete_100");
    if (context.totalCompleted >= 500) await tryUnlock("complete_500");
  }

  if (context.level !== undefined) {
    if (context.level >= 5) await tryUnlock("level_5");
    if (context.level >= 10) await tryUnlock("level_10");
    if (context.level >= 25) await tryUnlock("level_25");
    if (context.level >= 50) await tryUnlock("level_50");
  }

  if (context.tier === "Warrior") await tryUnlock("tier_warrior");
  if (context.tier === "Champion") await tryUnlock("tier_champion");
  if (context.tier === "Legend") await tryUnlock("tier_legend");

  if (context.streak !== undefined) {
    if (context.streak >= 3) await tryUnlock("streak_3");
    if (context.streak >= 7) await tryUnlock("streak_7");
    if (context.streak >= 30) await tryUnlock("streak_30");
    if (context.streak >= 100) await tryUnlock("streak_100");
  }

  if (context.habitsCreated !== undefined && context.habitsCreated >= 5) {
    await tryUnlock("create_5_habits");
  }

  if (context.allQuestsToday) await tryUnlock("all_quests");

  return unlocked;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ────────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getFullProfile(ctx.user.id);
    }),

    quote: publicProcedure.query(() => {
      return { quote: getDailyQuote() };
    }),
  }),

  // ─── Habits ─────────────────────────────────────────────────────────────────
  habits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getHabits(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          icon: z.string().default("⚡"),
          color: z.string().default("#6366f1"),
          category: z.string().default("General"),
          frequency: z.enum(["daily", "weekly"]).default("daily"),
          xpReward: z.number().min(5).max(500).default(25),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createHabit({ ...input, userId: ctx.user.id });
        const allHabits = await getHabits(ctx.user.id);
        const unlocked = await checkAndUnlockAchievements(ctx.user.id, {
          habitsCreated: allHabits.length,
        });
        return { success: true, unlocked };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(128).optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
          category: z.string().optional(),
          frequency: z.enum(["daily", "weekly"]).optional(),
          xpReward: z.number().min(5).max(500).optional(),
          notes: z.string().optional(),
          isArchived: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateHabit(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteHabit(input.id, ctx.user.id);
        return { success: true };
      }),

    complete: protectedProcedure
      .input(
        z.object({
          habitId: z.number(),
          logDate: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const allHabits = await getHabits(userId);
        const habit = allHabits.find((h) => h.id === input.habitId);
        if (!habit) throw new Error("Habit not found");

        // Guard: check if already completed today to prevent duplicate XP
        const existingLogs = await getHabitLogsForDate(userId, input.logDate);
        const alreadyCompleted = existingLogs.some(
          (l) => l.habitId === input.habitId && l.status === "completed"
        );
        if (alreadyCompleted) {
          const profile = await getOrCreateProfile(userId);
          return {
            success: true,
            xpEarned: 0,
            leveledUp: false,
            newLevel: profile.level,
            newTier: profile.tier,
            unlocked: [],
          };
        }

        const xpEarned = habit.xpReward;

        await logHabitAction({
          habitId: input.habitId,
          userId,
          logDate: input.logDate,
          status: "completed",
          xpEarned,
          notes: input.notes,
        });

        // Update streak
        await updateStreak(userId, input.logDate);

        // Add XP
        const { leveledUp, newLevel, newTier } = await addXpToProfile(userId, xpEarned);

        // Update profile totals
        const profile = await getOrCreateProfile(userId);
        const newTotal = profile.totalCompleted + 1;
        const dbInstance = await (await import("./db")).getDb();
        if (dbInstance) {
          const { userProfiles } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await dbInstance
            .update(userProfiles)
            .set({ totalCompleted: newTotal })
            .where(eq(userProfiles.userId, userId));
        }

        // Update quest progress
        await updateQuestProgress(userId, input.logDate, xpEarned, allHabits.length);

        // Check achievements
        const updatedProfile = await getOrCreateProfile(userId);
        const unlocked = await checkAndUnlockAchievements(userId, {
          totalCompleted: newTotal,
          level: newLevel,
          tier: newTier,
          streak: updatedProfile.currentStreak,
        });

        return { success: true, xpEarned, leveledUp, newLevel, newTier, unlocked };
      }),

    skip: protectedProcedure
      .input(z.object({ habitId: z.number(), logDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await logHabitAction({
          habitId: input.habitId,
          userId: ctx.user.id,
          logDate: input.logDate,
          status: "skipped",
          xpEarned: 0,
        });
        const dbInstance = await (await import("./db")).getDb();
        if (dbInstance) {
          const { userProfiles } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const p = await getOrCreateProfile(ctx.user.id);
          await dbInstance
            .update(userProfiles)
            .set({ totalSkipped: p.totalSkipped + 1 })
            .where(eq(userProfiles.userId, ctx.user.id));
        }
        return { success: true };
      }),

    logsForDate: protectedProcedure
      .input(z.object({ logDate: z.string() }))
      .query(async ({ ctx, input }) => {
        return getHabitLogsForDate(ctx.user.id, input.logDate);
      }),

    logsForHabit: protectedProcedure
      .input(
        z.object({
          habitId: z.number(),
          fromDate: z.string().optional(),
          toDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return getHabitLogsForHabit(input.habitId, ctx.user.id, input.fromDate, input.toDate);
      }),
  }),

  // ─── Quests ─────────────────────────────────────────────────────────────────
  quests: router({
    today: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return getDailyQuests(ctx.user.id, input.date);
      }),

    complete: protectedProcedure
      .input(z.object({ questId: z.number(), xpReward: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await completeQuest(ctx.user.id, input.questId, input.xpReward);
        const { leveledUp, newLevel, newTier } = await addXpToProfile(ctx.user.id, input.xpReward);

        // Check all-quests achievement
        const today = new Date().toISOString().split("T")[0];
        const quests = await getDailyQuests(ctx.user.id, today);
        const allDone = quests.every((q) => q.quest.isCompleted);
        const unlocked = await checkAndUnlockAchievements(ctx.user.id, { allQuestsToday: allDone });

        return { success: true, xpEarned: input.xpReward, leveledUp, newLevel, newTier, unlocked };
      }),
  }),

  // ─── Achievements ────────────────────────────────────────────────────────────
  achievements: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      const all = await getAllAchievements();
      const userUnlocked = await getUserAchievements(ctx.user.id);
      const unlockedKeys = new Set(userUnlocked.map((u) => u.achievement.key));

      return all.map((a) => ({
        ...a,
        unlocked: unlockedKeys.has(a.key),
        unlockedAt: userUnlocked.find((u) => u.achievement.key === a.key)?.unlockedAt ?? null,
      }));
    }),
  }),

  // ─── Statistics ──────────────────────────────────────────────────────────────
  stats: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getFullProfile(ctx.user.id);
      const logStats = await getHabitLogStats(ctx.user.id);
      const total = logStats.completed + logStats.missed + logStats.skipped;
      const completionRate = total > 0 ? Math.round((logStats.completed / total) * 100) : 0;

      return {
        profile,
        logStats,
        completionRate,
        total,
      };
    }),

    xpHistory: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return getXpHistory(ctx.user.id, input.days);
      }),

    perHabit: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const allHabits = await getHabits(userId);
      const dbInstance = await (await import("./db")).getDb();
      if (!dbInstance) return [];

      const { habitLogs } = await import("../drizzle/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const results = [];
      for (const habit of allHabits) {
        const logs = await dbInstance
          .select({ status: habitLogs.status, count: sql<number>`count(*)` })
          .from(habitLogs)
          .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.userId, userId)))
          .groupBy(habitLogs.status);

        const completed = logs.find((l) => l.status === "completed")?.count ?? 0;
        const missed = logs.find((l) => l.status === "missed")?.count ?? 0;
        const skipped = logs.find((l) => l.status === "skipped")?.count ?? 0;
        const total = completed + missed + skipped;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        results.push({ habit, completed, missed, skipped, total, rate });
      }
      return results;
    }),
  }),
});

// ─── Quest progress helper ────────────────────────────────────────────────────

async function updateQuestProgress(
  userId: number,
  logDate: string,
  xpEarned: number,
  _totalHabits: number
): Promise<void> {
  try {
    const quests = await getDailyQuests(userId, logDate);
    const dbInstance = await (await import("./db")).getDb();
    if (!dbInstance) return;

    const { userDailyQuests } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Count today's completions
    const todayLogs = await getHabitLogsForDate(userId, logDate);
    const completedToday = todayLogs.filter((l) => l.status === "completed").length;
    const xpToday = todayLogs.filter((l) => l.status === "completed").reduce((s, l) => s + l.xpEarned, 0) + xpEarned;

    for (const { quest, definition } of quests) {
      if (quest.isCompleted) continue;

      let progress = quest.progress;
      let shouldComplete = false;

      if (definition.questType === "complete_habits") {
        progress = completedToday;
        shouldComplete = progress >= definition.targetValue;
      } else if (definition.questType === "earn_xp") {
        progress = xpToday;
        shouldComplete = progress >= definition.targetValue;
      } else if (definition.questType === "complete_all") {
        const allHabits = await getHabits(userId);
        const dailyHabits = allHabits.filter((h) => h.frequency === "daily");
        shouldComplete = dailyHabits.length > 0 && completedToday >= dailyHabits.length;
        progress = shouldComplete ? 1 : 0;
      } else if (definition.questType === "complete_xp_habit") {
        shouldComplete = xpEarned >= definition.targetValue;
        progress = shouldComplete ? 1 : 0;
      } else if (definition.questType === "morning_habit") {
        const hour = new Date().getHours();
        shouldComplete = hour < 12;
        progress = shouldComplete ? 1 : 0;
      }

      await dbInstance
        .update(userDailyQuests)
        .set({
          progress,
          isCompleted: shouldComplete,
          completedAt: shouldComplete ? new Date() : undefined,
          xpAwarded: shouldComplete ? definition.xpReward : 0,
        })
        .where(and(eq(userDailyQuests.id, quest.id), eq(userDailyQuests.userId, userId)));

      if (shouldComplete) {
        await addXpToProfile(userId, definition.xpReward);
      }
    }
  } catch (e) {
    console.error("Quest progress update failed:", e);
  }
}

export type AppRouter = typeof appRouter;
