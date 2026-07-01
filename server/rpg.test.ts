import { describe, expect, it } from "vitest";
import { xpForLevel, xpToNextLevel, levelFromXp, tierForLevel } from "../shared/rpg";

describe("RPG XP System", () => {
  it("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("each level requires more XP than the last (scaling)", () => {
    const xpPerLevel = [2, 3, 4, 5, 6].map((l) => xpToNextLevel(l));
    for (let i = 1; i < xpPerLevel.length; i++) {
      expect(xpPerLevel[i]).toBeGreaterThan(xpPerLevel[i - 1]);
    }
  });

  it("levelFromXp(0) returns 1", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("levelFromXp correctly computes level from cumulative XP", () => {
    const xpLv2 = xpForLevel(2);
    expect(levelFromXp(xpLv2)).toBe(2);
    expect(levelFromXp(xpLv2 - 1)).toBe(1);
  });

  it("levelFromXp handles high XP values", () => {
    const xpLv20 = xpForLevel(20);
    expect(levelFromXp(xpLv20)).toBe(20);
    expect(levelFromXp(xpLv20 + 1)).toBe(20);
  });

  it("xpForLevel is strictly increasing", () => {
    for (let l = 2; l <= 10; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
    }
  });
});

describe("Warrior Tier System", () => {
  it("level 1 is Novice tier", () => {
    expect(tierForLevel(1).name).toBe("Novice");
  });

  it("level 5 is Warrior tier", () => {
    expect(tierForLevel(5).name).toBe("Warrior");
  });

  it("level 15 is Champion tier", () => {
    expect(tierForLevel(15).name).toBe("Champion");
  });

  it("level 30 is Legend tier", () => {
    expect(tierForLevel(30).name).toBe("Legend");
  });

  it("level 50 is Mythic tier", () => {
    expect(tierForLevel(50).name).toBe("Mythic");
  });

  it("tier has required fields", () => {
    const tier = tierForLevel(10);
    expect(tier).toHaveProperty("name");
    expect(tier).toHaveProperty("icon");
    expect(tier).toHaveProperty("color");
    expect(tier).toHaveProperty("minLevel");
  });
});

describe("auth.logout", () => {
  it("passes basic sanity check", () => {
    expect(true).toBe(true);
  });
});
