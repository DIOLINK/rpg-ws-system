import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
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

    // Cambios pendientes por turno (para visualización)
    pendingChanges: {
      hp: { type: Number, default: 0 }, // Positivo = curación, Negativo = daño
      mana: { type: Number, default: 0 },
      appliedAt: { type: Date }, // Cuándo se aplicó el último cambio
    },

    // Estado de KO (fuera de combate)
    isKO: { type: Boolean, default: false },
    koWarning: { type: Boolean, default: false }, // Aviso de KO para el siguiente turno

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

    // Estado actual (buffs/debuffs con efectos por turno)
    status: [
      {
        id: { type: String },
        type: {
          type: String,
          enum: ['buff', 'debuff', 'neutral'],
          default: 'neutral',
        },
        name: { type: String, required: true },
        description: { type: String },
        duration: { type: Number }, // Turnos restantes
        icon: { type: String },
        // Efectos por turno
        effects: {
          hpPerTurn: { type: Number, default: 0 }, // +/- HP por turno
          manaPerTurn: { type: Number, default: 0 }, // +/- Mana por turno
          statModifiers: {
            strength: { type: Number, default: 0 },
            intelligence: { type: Number, default: 0 },
            dexterity: { type: Number, default: 0 },
            defense: { type: Number, default: 0 },
          },
        },
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
    },
    level: {
      type: Number,
      default: 1,
    },

    // Validación por el DM
    validated: {
      type: Boolean,
      default: false,
    },
    validationComment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

export const Character = mongoose.model('Character', characterSchema);
