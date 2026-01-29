import mongoose from 'mongoose';

// Modelo de Item - Plantillas de items que se pueden asignar a personajes
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },

    // Tipo de item
    type: {
      type: String,
      enum: [
        'weapon', // Arma
        'armor', // Armadura
        'accessory', // Accesorio
        'consumable', // Consumible (pociones, comida)
        'material', // Material de crafteo
        'quest', // Item de misión
        'misc', // Misceláneo
      ],
      default: 'misc',
    },

    // Subtipo (ej: para weapon: sword, axe, bow, staff)
    subtype: { type: String },

    // Rareza
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'],
      default: 'common',
    },

    // Icono/Emoji para mostrar
    icon: { type: String, default: '📦' },

    // Estadísticas que modifica cuando está equipado
    statModifiers: {
      strength: { type: Number, default: 0 },
      intelligence: { type: Number, default: 0 },
      dexterity: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      maxHp: { type: Number, default: 0 },
      maxMana: { type: Number, default: 0 },
    },

    // Para armas
    damage: { type: String }, // Ej: "1d6", "2d8+3"
    damageType: {
      type: String,
      enum: [
        'physical',
        'magical',
        'fire',
        'ice',
        'lightning',
        'poison',
        'holy',
        'dark',
      ],
    },

    // Para armaduras
    armorValue: { type: Number, default: 0 },

    // Efecto al usar (para consumibles)
    useEffect: {
      type: { type: String }, // 'heal', 'mana', 'buff', 'damage'
      value: { type: Number }, // Cantidad
      duration: { type: Number }, // Turnos (para buffs)
      description: { type: String },
    },

    // Requisitos para usar/equipar
    requirements: {
      level: { type: Number, default: 1 },
      classType: [{ type: String }], // Clases que pueden usarlo
      stats: {
        strength: { type: Number, default: 0 },
        intelligence: { type: Number, default: 0 },
        dexterity: { type: Number, default: 0 },
      },
    },

    // Puede ser equipado
    equippable: { type: Boolean, default: false },

    // Slot de equipo
    equipSlot: {
      type: String,
      enum: [
        'mainHand',
        'offHand',
        'head',
        'chest',
        'legs',
        'feet',
        'hands',
        'neck',
        'ring1',
        'ring2',
      ],
    },

    // Puede apilarse (stackeable)
    stackable: { type: Boolean, default: true },
    maxStack: { type: Number, default: 99 },

    // Valor en oro
    value: { type: Number, default: 0 },

    // Peso (para sistemas con carga)
    weight: { type: Number, default: 0 },

    // Tags para búsqueda/filtrado
    tags: [{ type: String }],

    // Creado por (para items custom del DM)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Si es un item base del sistema o custom
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Índices para búsqueda eficiente
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ type: 1, rarity: 1 });

export const Item = mongoose.model('Item', itemSchema);
