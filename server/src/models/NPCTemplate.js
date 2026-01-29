import mongoose from 'mongoose';

// Plantillas de NPCs base que el DM puede usar o modificar
const npcTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    classType: { type: String, default: 'enemigo' },
    icon: { type: String, default: '👹' },

    // Stats base
    stats: {
      hp: { type: Number, default: 10 },
      maxHp: { type: Number, default: 10 },
      mana: { type: Number, default: 0 },
      maxMana: { type: Number, default: 0 },
      strength: { type: Number, default: 1 },
      intelligence: { type: Number, default: 1 },
      dexterity: { type: Number, default: 1 },
      defense: { type: Number, default: 1 },
    },

    // Habilidades del NPC
    abilities: [
      {
        id: { type: String },
        name: { type: String },
        description: { type: String },
        damage: { type: String },
        manaCost: { type: Number, default: 0 },
        icon: { type: String },
      },
    ],

    // Inventario que dropeará al morir
    inventory: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        name: { type: String },
        icon: { type: String },
        quantity: { type: Number, default: 1 },
        dropChance: { type: Number, default: 100 }, // Porcentaje de drop (0-100)
      },
    ],

    // Oro que dropea al morir
    goldDrop: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    // Experiencia que da al morir
    expReward: { type: Number, default: 10 },

    // Nivel del NPC (para referencia)
    level: { type: Number, default: 1 },

    // Tipo de NPC
    npcType: {
      type: String,
      enum: ['enemy', 'boss', 'miniboss', 'neutral', 'ally'],
      default: 'enemy',
    },

    // Si es plantilla global (disponible para todos) o creada por un DM específico
    isGlobal: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const NPCTemplate = mongoose.model('NPCTemplate', npcTemplateSchema);
