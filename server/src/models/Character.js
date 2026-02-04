import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Índice para búsquedas por jugador
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      index: true, // Índice para búsquedas por partida
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

    // Inventario expandido
    inventory: [
      {
        id: { type: String, required: true },
        // Referencia opcional al item base (si es un item del catálogo)
        itemRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, default: 1 },
        // Tipo de item
        type: {
          type: String,
          enum: [
            'weapon',
            'armor',
            'accessory',
            'consumable',
            'material',
            'quest',
            'misc',
          ],
          default: 'misc',
        },
        // Rareza
        rarity: {
          type: String,
          enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'],
          default: 'common',
        },
        // Icono
        icon: { type: String, default: '📦' },
        // Stats que modifica
        statModifiers: {
          strength: { type: Number, default: 0 },
          intelligence: { type: Number, default: 0 },
          dexterity: { type: Number, default: 0 },
          defense: { type: Number, default: 0 },
          maxHp: { type: Number, default: 0 },
          maxMana: { type: Number, default: 0 },
        },
        // Para armas
        damage: { type: String },
        // Equipable y slot
        equippable: { type: Boolean, default: false },
        equipSlot: { type: String },
        // Si está equipado actualmente
        equipped: { type: Boolean, default: false },
        // Valor en oro
        value: { type: Number, default: 0 },
        // Drop chance para NPCs (porcentaje 0-100)
        dropChance: { type: Number, default: 100 },
      },
    ],

    // Equipment slots (referencias a items equipados del inventario)
    equipment: {
      mainHand: { type: String }, // id del item en inventario
      offHand: { type: String },
      head: { type: String },
      chest: { type: String },
      legs: { type: String },
      feet: { type: String },
      hands: { type: String },
      neck: { type: String },
      ring1: { type: String },
      ring2: { type: String },
    },

    // Oro/monedas
    gold: { type: Number, default: 0 },

    classType: {
      type: String,
    },
    level: {
      type: Number,
      default: 1,
    },
    xp: {
      type: Number,
      default: 0,
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

    // === Campos para NPCs ===
    isNPC: { type: Boolean, default: false },

    // Tipo de NPC (enemy, boss, miniboss, neutral, ally)
    npcType: {
      type: String,
      enum: ['enemy', 'boss', 'miniboss', 'neutral', 'ally'],
      default: 'enemy',
    },

    // Experiencia que da al morir (solo NPCs)
    expReward: { type: Number, default: 0 },

    // Oro que dropea al morir (min-max)
    goldDrop: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    // Drop chance para items del inventario (porcentaje 0-100 por item)
    // Se almacena en cada item del inventory con campo dropChance

    // Plantilla de la que se creó (para referencia)
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'NPCTemplate' },

    // Icono del NPC
    npcIcon: { type: String, default: '👹' },

    // Si el NPC está muerto (para NPCs, KO = muerte)
    isDead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Índices compuestos para consultas frecuentes
characterSchema.index({ playerId: 1, gameId: 1 });
characterSchema.index({ validated: 1 }); // Para búsquedas de pendientes
characterSchema.index({ isNPC: 1, gameId: 1 }); // Para búsquedas de NPCs por partida

export const Character = mongoose.model('Character', characterSchema);
