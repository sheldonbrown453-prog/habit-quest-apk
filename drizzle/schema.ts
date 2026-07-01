import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Profiles (RPG stats) ────────────────────────────────────────────────
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  xp: bigint("xp", { mode: "number" }).default(0).notNull(),
  level: int("level").default(1).notNull(),
  tier: varchar("tier", { length: 64 }).default("Novice").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: date("lastActivityDate"),
  totalCompleted: int("totalCompleted").default(0).notNull(),
  totalMissed: int("totalMissed").default(0).notNull(),
  totalSkipped: int("totalSkipped").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ─── Habits ───────────────────────────────────────────────────────────────────
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 32 }).default("⚡").notNull(),
  color: varchar("color", { length: 32 }).default("#6366f1").notNull(),
  category: varchar("category", { length: 64 }).default("General").notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly"]).default("daily").notNull(),
  xpReward: int("xpReward").default(25).notNull(),
  notes: text("notes"),
  isArchived: boolean("isArchived").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

// ─── Habit Logs ───────────────────────────────────────────────────────────────
export const habitLogs = mysqlTable("habit_logs", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  logDate: date("logDate").notNull(),
  status: mysqlEnum("status", ["completed", "missed", "skipped"]).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = typeof habitLogs.$inferInsert;

// ─── Achievement Definitions ──────────────────────────────────────────────────
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 32 }).default("🏆").notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ─── User Achievements ────────────────────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;

// ─── Daily Quest Definitions ──────────────────────────────────────────────────
export const questDefinitions = mysqlTable("quest_definitions", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 32 }).default("🎯").notNull(),
  xpReward: int("xpReward").default(50).notNull(),
  targetValue: int("targetValue").default(1).notNull(),
  questType: varchar("questType", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestDefinition = typeof questDefinitions.$inferSelect;

// ─── User Daily Quests ────────────────────────────────────────────────────────
export const userDailyQuests = mysqlTable("user_daily_quests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questDefinitionId: int("questDefinitionId").notNull(),
  questDate: date("questDate").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  progress: int("progress").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  xpAwarded: int("xpAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserDailyQuest = typeof userDailyQuests.$inferSelect;
