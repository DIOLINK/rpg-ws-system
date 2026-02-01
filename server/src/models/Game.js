import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Índice para búsquedas por DM
  },
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
    },
  ],
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },

  // Sistema de turnos basado en iniciativa (dexterity)
  turnOrder: [
    {
      characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
      name: { type: String },
      initiative: { type: Number, default: 0 },
      position: { type: Number }, // Posición en el orden de turnos
      isNPC: { type: Boolean, default: false }, // Si es un NPC
      isKO: { type: Boolean, default: false }, // Si está KO
    },
  ],
  currentTurnIndex: { type: Number, default: 0 }, // Índice del personaje con el turno actual
  combatStarted: { type: Boolean, default: false }, // Indica si el combate ha iniciado
});

// Método estático para asignar un personaje a una partida
gameSchema.statics.assignCharacterToGame = async function (
  gameId,
  characterId,
) {
  const game = await this.findById(gameId);
  if (!game) {
    throw new Error('Partida no encontrada');
  }

  // Verificar si el personaje ya está asignado
  if (
    game.players.some((player) => player.characterId.toString() === characterId)
  ) {
    throw new Error('El personaje ya está asignado a esta partida');
  }

  game.players.push({ characterId });
  await game.save();
  return game;
};

export const Game = mongoose.model('Game', gameSchema);
