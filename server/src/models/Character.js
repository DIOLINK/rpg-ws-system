import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    avatar: { type: String },

    // Stats principales
    stats: {
      hp: { type: Number, default: 10 },
      maxHp: { type: Number, default: 10 },
      mana: { type: Number, default: 5 },
      maxMana: { type: Number, default: 5 },
      strength: { type: Number, default: 1 },
      intelligence: { type: Number, default: 1 },
      dexterity: { type: Number, default: 1 },
      defense: { type: Number, default: 1 },
    },

    // Habilidades
    abilities: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        damage: { type: String },
        manaCost: { type: Number, default: 0 },
        icon: { type: String },
      },
    ],

    // Estado actual
    status: [
      {
        type: {
          type: String,
          enum: ['buff', 'debuff', 'neutral'],
          default: 'neutral',
        },
        name: { type: String, required: true },
        description: { type: String },
        duration: { type: Number },
        icon: { type: String },
      },
    ],

    // Control de edición
    canEdit: { type: Boolean, default: false },

    // Inventario
    inventory: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        description: { type: String },
      },
    ],

    classType: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const Character = mongoose.model('Character', characterSchema);
