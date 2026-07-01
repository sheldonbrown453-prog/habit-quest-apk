// ─── RPG Progression System ───────────────────────────────────────────────────

export const WARRIOR_TIERS = [
  { name: "Novice",    minLevel: 1,   icon: "🌱", color: "#6b7280" },
  { name: "Warrior",   minLevel: 5,   icon: "⚔️",  color: "#3b82f6" },
  { name: "Champion",  minLevel: 15,  icon: "🏆", color: "#8b5cf6" },
  { name: "Legend",    minLevel: 30,  icon: "👑", color: "#f59e0b" },
  { name: "Mythic",    minLevel: 50,  icon: "🌟", color: "#ec4899" },
  { name: "Divine",    minLevel: 75,  icon: "✨", color: "#06b6d4" },
  { name: "Eternal",   minLevel: 100, icon: "💎", color: "#10b981" },
  { name: "Celestial", minLevel: 150, icon: "🌌", color: "#f97316" },
  { name: "Godslayer", minLevel: 200, icon: "⚡", color: "#ef4444" },
  { name: "Titan",     minLevel: 300, icon: "🔱", color: "#a855f7" },
] as const;

export type TierName = typeof WARRIOR_TIERS[number]["name"] | string;

/** XP required to reach the given level from level 1 (cumulative). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Quadratic scaling: each level requires more XP than the last
  // Level 2 = 100, Level 3 = 250, Level 4 = 450, Level 5 = 700 ...
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += Math.floor(100 * Math.pow(l - 1, 1.5));
  }
  return total;
}

/** XP required to go from current level to the next level. */
export function xpToNextLevel(level: number): number {
  return xpForLevel(level + 1) - xpForLevel(level);
}

/** Compute level from total XP. */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export type TierInfo = { name: string; minLevel: number; icon: string; color: string };

/** Get tier info for a given level. */
export function tierForLevel(level: number): TierInfo {
  let tier: TierInfo = WARRIOR_TIERS[0];
  for (const t of WARRIOR_TIERS) {
    if (level >= t.minLevel) tier = t;
  }
  return tier;
}

/** XP rewards by difficulty label. */
export const XP_REWARDS = {
  easy:    10,
  medium:  25,
  hard:    50,
  extreme: 100,
} as const;

export type Difficulty = keyof typeof XP_REWARDS;

/** Motivational quotes pool. */
export const MOTIVATIONAL_QUOTES = [
  "Every habit you build is a brick in the fortress of your future self.",
  "The warrior who shows up every day becomes unstoppable.",
  "Small consistent actions forge legendary characters.",
  "Your streak is your sword — keep it sharp.",
  "Champions are built one completed habit at a time.",
  "The path to greatness is paved with daily discipline.",
  "Level up your life, one habit at a time.",
  "Consistency is the magic spell of champions.",
  "Your future self is watching. Make them proud.",
  "Every day you show up, you become harder to defeat.",
];

export function getDailyQuote(seed?: number): string {
  const idx = (seed ?? new Date().getDate()) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[idx];
}
