import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Achievement,
  InsertUser,
  QuestDefinition,
  UserProfile,
  achievements,
  habitLogs,
  habits,
  questDefinitions,
  userAchievements,
  userDailyQuests,
  userProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { levelFromXp, tierForLevel, xpForLevel, xpToNextLevel } from "../shared/rpg";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getOrCreateProfile(userId: number): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];

  await db.insert(userProfiles).values({ userId });
  const created = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return created[0]!;
}

export async function addXpToProfile(
  userId: number,
  xpAmount: number
): Promise<{ profile: UserProfile; leveledUp: boolean; newLevel: number; newTier: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const profile = await getOrCreateProfile(userId);
  const oldLevel = profile.level;
  const newXp = profile.xp + xpAmount;
  const newLevel = levelFromXp(newXp);
  const newTier = tierForLevel(newLevel).name;

  await db
    .update(userProfiles)
    .set({ xp: newXp, level: newLevel, tier: newTier })
    .where(eq(userProfiles.userId, userId));

  const updated = await getOrCreateProfile(userId);
  return { profile: updated, leveledUp: newLevel > oldLevel, newLevel, newTier };
}

export async function updateStreak(userId: number, todayDate: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const profile = await getOrCreateProfile(userId);
  const last = profile.lastActivityDate ? String(profile.lastActivityDate) : null;

  if (last === todayDate) return; // already updated today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = 1;
  if (last === yesterdayStr) {
    newStreak = profile.currentStreak + 1;
  }

  const longest = Math.max(newStreak, profile.longestStreak);

  await db
    .update(userProfiles)
    .set({ currentStreak: newStreak, longestStreak: longest, lastActivityDate: todayDate as unknown as Date })
    .where(eq(userProfiles.userId, userId));
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getHabits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.isArchived, false)))
    .orderBy(habits.sortOrder, habits.createdAt);
}

export async function createHabit(data: {
  userId: number;
  name: string;
  icon: string;
  color: string;
  category: string;
  frequency: "daily" | "weekly";
  xpReward: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(habits).values(data);
  return result;
}

export async function updateHabit(
  habitId: number,
  userId: number,
  data: Partial<{
    name: string;
    icon: string;
    color: string;
    category: string;
    frequency: "daily" | "weekly";
    xpReward: number;
    notes: string;
    isArchived: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(habits).set(data).where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
}

export async function deleteHabit(habitId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
}

// ─── Habit Logs ───────────────────────────────────────────────────────────────

export async function getHabitLogsForDate(userId: number, logDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, logDate as unknown as Date)));
}

export async function getHabitLogsForHabit(habitId: number, userId: number, fromDate?: string, toDate?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(habitLogs.habitId, habitId), eq(habitLogs.userId, userId)];
  if (fromDate) conditions.push(gte(habitLogs.logDate, fromDate as unknown as Date));
  if (toDate) conditions.push(lte(habitLogs.logDate, toDate as unknown as Date));

  return db.select().from(habitLogs).where(and(...conditions)).orderBy(habitLogs.logDate);
}

export async function logHabitAction(data: {
  habitId: number;
  userId: number;
  logDate: string;
  status: "completed" | "missed" | "skipped";
  xpEarned: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Upsert: delete existing log for this habit+date, then insert
  await db
    .delete(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, data.habitId),
        eq(habitLogs.userId, data.userId),
        eq(habitLogs.logDate, data.logDate as unknown as Date)
      )
    );

  await db.insert(habitLogs).values({
    ...data,
    logDate: data.logDate as unknown as Date,
    completedAt: data.status === "completed" ? new Date() : undefined,
  });
}

export async function getHabitLogStats(userId: number) {
  const db = await getDb();
  if (!db) return { completed: 0, missed: 0, skipped: 0 };

  const rows = await db
    .select({ status: habitLogs.status, count: sql<number>`count(*)` })
    .from(habitLogs)
    .where(eq(habitLogs.userId, userId))
    .groupBy(habitLogs.status);

  const stats = { completed: 0, missed: 0, skipped: 0 };
  for (const row of rows) {
    if (row.status === "completed") stats.completed = row.count;
    if (row.status === "missed") stats.missed = row.count;
    if (row.status === "skipped") stats.skipped = row.count;
  }
  return stats;
}

export async function getXpHistory(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = fromDate.toISOString().split("T")[0];

  return db
    .select({
      logDate: habitLogs.logDate,
      totalXp: sql<number>`sum(${habitLogs.xpEarned})`,
    })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.userId, userId),
        eq(habitLogs.status, "completed"),
        gte(habitLogs.logDate, fromStr as unknown as Date)
      )
    )
    .groupBy(habitLogs.logDate)
    .orderBy(habitLogs.logDate);
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function getAllAchievements(): Promise<Achievement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievements);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ achievement: achievements, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));
}

export async function unlockAchievement(userId: number, achievementKey: string): Promise<Achievement | null> {
  const db = await getDb();
  if (!db) return null;

  const achievement = await db.select().from(achievements).where(eq(achievements.key, achievementKey)).limit(1);
  if (!achievement[0]) return null;

  const existing = await db
    .select()
    .from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement[0].id)))
    .limit(1);

  if (existing[0]) return null; // already unlocked

  await db.insert(userAchievements).values({ userId, achievementId: achievement[0].id });
  return achievement[0];
}

// ─── Daily Quests ─────────────────────────────────────────────────────────────

export async function getDailyQuests(userId: number, questDate: string) {
  const db = await getDb();
  if (!db) return [];

  const existing = await db
    .select({ quest: userDailyQuests, definition: questDefinitions })
    .from(userDailyQuests)
    .innerJoin(questDefinitions, eq(userDailyQuests.questDefinitionId, questDefinitions.id))
    .where(and(eq(userDailyQuests.userId, userId), eq(userDailyQuests.questDate, questDate as unknown as Date)));

  if (existing.length >= 3) return existing;

  // Generate 3 quests for today
  const allDefs = await db.select().from(questDefinitions);
  // Deterministic shuffle based on date + userId
  const seed = parseInt(questDate.replace(/-/g, "")) + userId;
  const shuffled = [...allDefs].sort((a, b) => {
    const ha = Math.sin(seed * a.id) * 10000;
    const hb = Math.sin(seed * b.id) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });

  const selected = shuffled.slice(0, 3);
  for (const def of selected) {
    await db.insert(userDailyQuests).values({
      userId,
      questDefinitionId: def.id,
      questDate: questDate as unknown as Date,
    });
  }

  const fresh = await db
    .select({ quest: userDailyQuests, definition: questDefinitions })
    .from(userDailyQuests)
    .innerJoin(questDefinitions, eq(userDailyQuests.questDefinitionId, questDefinitions.id))
    .where(and(eq(userDailyQuests.userId, userId), eq(userDailyQuests.questDate, questDate as unknown as Date)));

  return fresh;
}

export async function completeQuest(userId: number, questId: number, xpReward: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  await db
    .update(userDailyQuests)
    .set({ isCompleted: true, completedAt: new Date(), xpAwarded: xpReward })
    .where(and(eq(userDailyQuests.id, questId), eq(userDailyQuests.userId, userId)));
}

// ─── Profile with computed fields ─────────────────────────────────────────────

export async function getFullProfile(userId: number) {
  const profile = await getOrCreateProfile(userId);
  const tier = tierForLevel(profile.level);
  const currentLevelXp = xpForLevel(profile.level);
  const nextLevelXp = xpForLevel(profile.level + 1);
  const xpIntoLevel = profile.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    ...profile,
    tier,
    xpIntoLevel,
    xpNeeded,
    xpToNextLevel: xpToNextLevel(profile.level),
  };
}
