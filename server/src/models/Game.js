import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dmId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
    },
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Game = mongoose.model('Game', gameSchema);
