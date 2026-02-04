/**
 * XP System - Utilities for experience points and leveling
 */

/**
 * Calculate total XP required to reach a specific level
 * @param {number} level - Target level
 * @param {number} baseXP - Base XP value
 * @param {number} exponent - Exponential growth factor
 * @returns {number} Total XP required
 */
export function calculateXPForLevel(level, baseXP = 100, exponent = 1.1) {
  if (level <= 1) return 0;
  return Math.floor(
    (baseXP * (Math.pow(exponent, level - 1) - 1)) / (exponent - 1),
  );
}

/**
 * Calculate XP required to reach next level from current level
 * @param {number} currentLevel - Current level
 * @param {number} baseXP - Base XP value
 * @param {number} exponent - Exponential growth factor
 * @returns {number} XP needed for next level
 */
export function calculateXPForNextLevel(
  currentLevel,
  baseXP = 100,
  exponent = 1.1,
) {
  return (
    calculateXPForLevel(currentLevel + 1, baseXP, exponent) -
    calculateXPForLevel(currentLevel, baseXP, exponent)
  );
}

/**
 * Assign XP to a character and handle automatic leveling
 * @param {Object} character - Character object
 * @param {number} xpToAdd - XP amount to add
 * @param {number} baseXP - Base XP value from game settings
 * @param {number} exponent - Exponent from game settings
 * @returns {Object} Updated character data with level and xp changes
 */
export function assignXPToCharacter(character, xpToAdd, baseXP, exponent) {
  let currentXP = character.xp + xpToAdd;
  let currentLevel = character.level;
  let levelsGained = 0;
  const levelDetails = [];

  // Check if character can level up
  let nextLevelXP = calculateXPForLevel(currentLevel + 1, baseXP, exponent);

  // Keep leveling up while XP is sufficient
  while (currentXP >= nextLevelXP && currentLevel < 100) {
    // Max level cap at 100
    currentLevel += 1;
    levelsGained += 1;

    levelDetails.push({
      level: currentLevel,
      xpRequired: nextLevelXP,
    });

    // Recalculate for next level
    nextLevelXP = calculateXPForLevel(currentLevel + 1, baseXP, exponent);
  }

  return {
    newLevel: currentLevel,
    newXP: currentXP,
    levelsGained,
    levelDetails,
    xpToNextLevel:
      nextLevelXP - calculateXPForLevel(currentLevel, baseXP, exponent),
    currentLevelProgress:
      currentXP - calculateXPForLevel(currentLevel, baseXP, exponent),
  };
}

/**
 * Get XP progress information for a character
 * @param {Object} character - Character object
 * @param {number} baseXP - Base XP value from game settings
 * @param {number} exponent - Exponent from game settings
 * @returns {Object} XP progress information
 */
export function getXPProgress(character, baseXP, exponent) {
  const currentLevelXP = calculateXPForLevel(character.level, baseXP, exponent);
  const nextLevelXP = calculateXPForLevel(
    character.level + 1,
    baseXP,
    exponent,
  );
  const xpForNextLevel = nextLevelXP - currentLevelXP;
  const currentProgress = character.xp - currentLevelXP;
  const progressPercentage =
    xpForNextLevel > 0 ? (currentProgress / xpForNextLevel) * 100 : 0;

  return {
    currentLevel: character.level,
    currentXP: character.xp,
    xpForCurrentLevel: currentLevelXP,
    xpForNextLevel: nextLevelXP,
    xpNeededForNextLevel: xpForNextLevel,
    currentProgress,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
