# XP System Documentation

## Overview

The XP (Experience Points) system allows the Dungeon Master (DM) to assign experience to player characters (PCs) with automatic level progression. The system uses configurable parameters stored in the game session.

## Features

- ✅ Assign XP to one or multiple characters simultaneously
- ✅ Automatic level-up calculation with overflow handling
- ✅ Configurable XP curve (baseXP and exponent)
- ✅ Real-time updates via WebSocket
- ✅ XP progress tracking per character

## Data Models

### Game Model Updates

```javascript
{
  baseXP: { type: Number, default: 100 },  // Base XP for level calculations
  exponent: { type: Number, default: 1.1 } // Exponential growth factor
}
```

### Character Model Updates

```javascript
{
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 }  // Current accumulated XP
}
```

## XP Calculation Formula

The total XP required for a specific level is calculated using:

```
XP(level) = floor(baseXP × (exponent^(level-1) - 1) / (exponent - 1))
```

**Example with default values (baseXP=100, exponent=1.1):**

- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 210 XP
- Level 4: 331 XP
- Level 5: 464 XP

## Socket Events

### 1. Assign XP to Characters

**Event:** `dm:assign-xp`

**Payload:**

```javascript
{
  gameId: "game_id_here",
  characterIds: ["char_id_1", "char_id_2"], // Array of character IDs
  xp: 150 // Amount of XP to assign
}
```

**Response:** `xp-assigned`

```javascript
{
  results: [
    {
      characterId: "char_id_1",
      characterName: "Aragorn",
      oldLevel: 3,
      newLevel: 5,
      levelsGained: 2,
      xpGained: 150,
      totalXP: 500,
      levelDetails: [
        { level: 4, xpRequired: 331 },
        { level: 5, xpRequired: 464 }
      ],
      progressInfo: {
        currentLevel: 5,
        currentXP: 500,
        xpForCurrentLevel: 464,
        xpForNextLevel: 610,
        xpNeededForNextLevel: 146,
        currentProgress: 36,
        progressPercentage: 24.66
      }
    }
  ],
  xpAmount: 150
}
```

**Authorization:** DM only

### 2. Update XP Settings

**Event:** `dm:update-xp-settings`

**Payload:**

```javascript
{
  gameId: "game_id_here",
  baseXP: 150,    // Optional: new base XP value
  exponent: 1.15  // Optional: new exponent value (must be > 1)
}
```

**Response:** `xp-settings-updated`

```javascript
{
  baseXP: 150,
  exponent: 1.15
}
```

**Authorization:** DM only

### 3. Get XP Progress

**Event:** `get-xp-progress`

**Payload:**

```javascript
{
  characterId: "char_id_here",
  gameId: "game_id_here"
}
```

**Response:** `xp-progress`

```javascript
{
  characterId: "char_id_here",
  currentLevel: 5,
  currentXP: 500,
  xpForCurrentLevel: 464,
  xpForNextLevel: 610,
  xpNeededForNextLevel: 146,
  currentProgress: 36,
  progressPercentage: 24.66
}
```

**Authorization:** Any user in the game

## Utility Functions

### `calculateXPForLevel(level, baseXP, exponent)`

Calculates total XP required to reach a specific level.

**Parameters:**

- `level` (number): Target level
- `baseXP` (number): Base XP value from game settings
- `exponent` (number): Exponential growth factor from game settings

**Returns:** Total XP required (number)

### `assignXPToCharacter(character, xpToAdd, baseXP, exponent)`

Assigns XP to a character and calculates automatic level progression.

**Parameters:**

- `character` (Object): Character document
- `xpToAdd` (number): Amount of XP to add
- `baseXP` (number): Base XP from game settings
- `exponent` (number): Exponent from game settings

**Returns:** Object with:

- `newLevel`: Updated level
- `newXP`: Updated XP total
- `levelsGained`: Number of levels gained
- `levelDetails`: Array of levels reached
- `xpToNextLevel`: XP needed for next level
- `currentLevelProgress`: Current progress in current level

### `getXPProgress(character, baseXP, exponent)`

Gets detailed XP progress information for a character.

**Parameters:**

- `character` (Object): Character document
- `baseXP` (number): Base XP from game settings
- `exponent` (number): Exponent from game settings

**Returns:** Progress information object

## Frontend Integration Example

### Assign XP to Selected Characters

```javascript
// In DM Panel
const handleAssignXP = (characterIds, xpAmount) => {
  socket.emit('dm:assign-xp', {
    gameId: currentGameId,
    characterIds: characterIds, // ["id1", "id2"] or ["all"]
    xp: xpAmount,
  });
};

// Listen for results
socket.on('xp-assigned', (data) => {
  console.log('XP assigned:', data.results);
  // Update UI with level-up notifications
  data.results.forEach((result) => {
    if (result.levelsGained > 0) {
      showNotification(
        `${result.characterName} reached level ${result.newLevel}!`,
      );
    }
  });
});
```

### Update XP Settings

```javascript
// In DM Settings Panel
const handleUpdateXPSettings = (baseXP, exponent) => {
  socket.emit('dm:update-xp-settings', {
    gameId: currentGameId,
    baseXP: baseXP,
    exponent: exponent,
  });
};

socket.on('xp-settings-updated', (data) => {
  console.log('New XP settings:', data);
  // Update UI
});
```

### Display XP Progress

```javascript
// In Character Sheet
const fetchXPProgress = (characterId) => {
  socket.emit('get-xp-progress', {
    characterId: characterId,
    gameId: currentGameId,
  });
};

socket.on('xp-progress', (data) => {
  // Update progress bar
  const percentage = data.progressPercentage;
  const current = data.currentProgress;
  const needed = data.xpNeededForNextLevel;
  // Display: "36 / 146 XP (24.66%)"
});
```

## Auto-leveling Logic

When XP is assigned:

1. Add XP to character's current total
2. Check if total XP >= XP required for next level
3. If yes:
   - Increment level by 1
   - Calculate XP for next level
   - Repeat until XP is insufficient for another level
4. Any excess XP carries over to the next level
5. Maximum level cap: 100

**Example:**

- Character at Level 3 (210 XP needed)
- Current XP: 200
- Assign 300 XP
- New total: 500 XP
- Level 4 requires 331 XP → Level up to 4
- Level 5 requires 464 XP → Level up to 5
- Final: Level 5 with 500 XP (36 XP into Level 5)

## Error Handling

- **Not authorized**: User is not the DM
- **Invalid XP amount**: XP must be > 0
- **No characters selected**: characterIds array is empty
- **Game not found**: Invalid gameId
- **Character not found**: Invalid characterId
- **Invalid baseXP**: Must be > 0
- **Invalid exponent**: Must be > 1

## Testing

Example test cases:

```javascript
// Test XP calculation
const xp2 = calculateXPForLevel(2, 100, 1.1); // Should be 100
const xp5 = calculateXPForLevel(5, 100, 1.1); // Should be 464

// Test auto-leveling
const character = { level: 1, xp: 0 };
const result = assignXPToCharacter(character, 500, 100, 1.1);
// Should return: { newLevel: 5, newXP: 500, levelsGained: 4 }
```

## Notes

- XP settings are stored per game, allowing different campaigns to have different progression curves
- The system supports hybrid progression: exponential growth with configurable parameters
- All socket events are real-time and broadcast to all clients in the game room
- Character updates trigger both `xp-assigned` and `character-updated` events
