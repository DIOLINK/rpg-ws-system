import {
  assignXPToCharacter,
  calculateXPForLevel,
  calculateXPForNextLevel,
  getXPProgress,
} from '../src/utils/xpSystem.js';

describe('XP System', () => {
  describe('calculateXPForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateXPForLevel(1, 100, 1.1)).toBe(0);
    });

    it('should calculate correct XP for level 2', () => {
      expect(calculateXPForLevel(2, 100, 1.1)).toBe(100);
    });

    it('should calculate correct XP for level 5', () => {
      expect(calculateXPForLevel(5, 100, 1.1)).toBe(464);
    });

    it('should handle different baseXP values', () => {
      expect(calculateXPForLevel(2, 200, 1.1)).toBe(200);
    });

    it('should handle different exponent values', () => {
      const xp = calculateXPForLevel(3, 100, 1.2);
      expect(xp).toBeGreaterThan(0);
    });
  });

  describe('calculateXPForNextLevel', () => {
    it('should calculate XP needed for level 2 from level 1', () => {
      expect(calculateXPForNextLevel(1, 100, 1.1)).toBe(100);
    });

    it('should calculate XP needed for next level correctly', () => {
      const xpForLevel4 = calculateXPForLevel(4, 100, 1.1);
      const xpForLevel5 = calculateXPForLevel(5, 100, 1.1);
      const xpNeeded = calculateXPForNextLevel(4, 100, 1.1);
      expect(xpNeeded).toBe(xpForLevel5 - xpForLevel4);
    });
  });

  describe('assignXPToCharacter', () => {
    it('should assign XP without leveling up', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 50, 100, 1.1);

      expect(result.newLevel).toBe(1);
      expect(result.newXP).toBe(50);
      expect(result.levelsGained).toBe(0);
    });

    it('should level up when XP threshold is reached', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 100, 100, 1.1);

      expect(result.newLevel).toBe(2);
      expect(result.newXP).toBe(100);
      expect(result.levelsGained).toBe(1);
    });

    it('should level up multiple times with excess XP', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 500, 100, 1.1);

      expect(result.newLevel).toBe(5);
      expect(result.newXP).toBe(500);
      expect(result.levelsGained).toBe(4);
      expect(result.levelDetails).toHaveLength(4);
    });

    it('should carry over excess XP to next level', () => {
      const character = { level: 1, xp: 50 };
      const result = assignXPToCharacter(character, 75, 100, 1.1);

      expect(result.newLevel).toBe(2);
      expect(result.newXP).toBe(125);
      expect(result.levelsGained).toBe(1);
    });

    it('should respect level cap at 100', () => {
      const character = { level: 99, xp: 999999 };
      const result = assignXPToCharacter(character, 999999, 100, 1.1);

      expect(result.newLevel).toBeLessThanOrEqual(100);
    });

    it('should accumulate XP correctly across multiple assignments', () => {
      const character = { level: 1, xp: 0 };

      // First assignment
      let result = assignXPToCharacter(character, 50, 100, 1.1);
      expect(result.newLevel).toBe(1);
      expect(result.newXP).toBe(50);

      // Second assignment (starting from previous result)
      character.xp = result.newXP;
      character.level = result.newLevel;
      result = assignXPToCharacter(character, 100, 100, 1.1);

      expect(result.newLevel).toBe(2);
      expect(result.newXP).toBe(150);
    });
  });

  describe('getXPProgress', () => {
    it('should calculate progress for level 1 character', () => {
      const character = { level: 1, xp: 50 };
      const progress = getXPProgress(character, 100, 1.1);

      expect(progress.currentLevel).toBe(1);
      expect(progress.currentXP).toBe(50);
      expect(progress.xpForCurrentLevel).toBe(0);
      expect(progress.xpForNextLevel).toBe(100);
      expect(progress.currentProgress).toBe(50);
      expect(progress.progressPercentage).toBe(50);
    });

    it('should calculate progress for higher level character', () => {
      const character = { level: 3, xp: 250 };
      const progress = getXPProgress(character, 100, 1.1);

      expect(progress.currentLevel).toBe(3);
      expect(progress.currentXP).toBe(250);
      expect(progress.currentProgress).toBeGreaterThan(0);
      expect(progress.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    });

    it('should show 0% progress at exact level threshold', () => {
      const character = { level: 2, xp: 100 };
      const progress = getXPProgress(character, 100, 1.1);

      expect(progress.currentProgress).toBe(0);
      expect(progress.progressPercentage).toBe(0);
    });

    it('should show near 100% progress just before level up', () => {
      const xpForLevel3 = calculateXPForLevel(3, 100, 1.1);
      const character = { level: 2, xp: xpForLevel3 - 1 };
      const progress = getXPProgress(character, 100, 1.1);

      expect(progress.progressPercentage).toBeGreaterThan(99);
      expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle 0 XP assignment', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 0, 100, 1.1);

      expect(result.newLevel).toBe(1);
      expect(result.newXP).toBe(0);
      expect(result.levelsGained).toBe(0);
    });

    it('should handle very large XP values', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 10000, 100, 1.1);

      expect(result.newLevel).toBeGreaterThan(1);
      expect(result.newXP).toBe(10000);
    });

    it('should handle custom baseXP and exponent values', () => {
      const character = { level: 1, xp: 0 };
      const result = assignXPToCharacter(character, 500, 200, 1.2);

      expect(result.newLevel).toBeGreaterThanOrEqual(1);
      expect(result.newXP).toBe(500);
    });
  });
});
