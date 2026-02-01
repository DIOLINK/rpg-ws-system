import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

dotenv.config({ path: './src/.env' });

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/rpg-ws-system';

const baseItems = [
  // ========================================
  // ARMAS COMUNES (Todas las clases)
  // classType: [] = disponible para todas las clases
  // ========================================
  {
    name: 'Daga oxidada',
    description: 'Una daga vieja y oxidada, pero aún funcional.',
    type: 'weapon',
    subtype: 'dagger',
    rarity: 'common',
    icon: '🗡️',
    damage: '1d4',
    damageType: 'physical',
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Antorcha',
    description: 'Ilumina el camino. Puede usarse como arma improvisada.',
    type: 'weapon',
    subtype: 'torch',
    rarity: 'common',
    icon: '🔥',
    damage: '1d4',
    damageType: 'fire',
    equippable: true,
    equipSlot: 'offHand',
    requirements: { level: 1, classType: [] },
    value: 2,
    isCustom: false,
  },

  // ========================================
  // ARMAS DE GUERRERO
  // ========================================
  {
    name: 'Espada corta de hierro',
    description: 'Una espada corta básica de hierro. Ideal para principiantes.',
    type: 'weapon',
    subtype: 'sword',
    rarity: 'common',
    icon: '⚔️',
    damage: '1d6',
    damageType: 'physical',
    statModifiers: { strength: 1 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['guerrero'] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Espada larga',
    description: 'Una espada de hoja larga que requiere fuerza para manejar.',
    type: 'weapon',
    subtype: 'sword',
    rarity: 'uncommon',
    icon: '⚔️',
    damage: '1d8',
    damageType: 'physical',
    equippable: true,
    equipSlot: 'mainHand',
    statModifiers: { strength: 2 },
    requirements: { level: 1, classType: ['guerrero'], stats: { strength: 3 } },
    value: 50,
    isCustom: false,
  },
  {
    name: 'Hacha de mano',
    description: 'Un hacha pequeña pero letal.',
    type: 'weapon',
    subtype: 'axe',
    rarity: 'common',
    icon: '🪓',
    damage: '1d6',
    damageType: 'physical',
    statModifiers: { strength: 2 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['guerrero'] },
    value: 12,
    isCustom: false,
  },
  {
    name: 'Hacha de batalla',
    description: 'Un arma brutal que causa gran daño.',
    type: 'weapon',
    subtype: 'axe',
    rarity: 'uncommon',
    icon: '🪓',
    damage: '1d10',
    damageType: 'physical',
    equippable: true,
    equipSlot: 'mainHand',
    statModifiers: { strength: 3 },
    requirements: { level: 1, classType: ['guerrero'], stats: { strength: 5 } },
    value: 75,
    isCustom: false,
  },
  {
    name: 'Escudo de madera',
    description: 'Un escudo simple de madera reforzada.',
    type: 'armor',
    subtype: 'shield',
    rarity: 'common',
    icon: '🛡️',
    armorValue: 2,
    statModifiers: { defense: 2 },
    equippable: true,
    equipSlot: 'offHand',
    requirements: { level: 1, classType: ['guerrero', 'clerigo'] },
    value: 10,
    isCustom: false,
  },

  // ========================================
  // ARMAS DE MAGO
  // ========================================
  {
    name: 'Bastón de aprendiz',
    description: 'Un bastón mágico básico para canalizar hechizos.',
    type: 'weapon',
    subtype: 'staff',
    rarity: 'common',
    icon: '🪄',
    damage: '1d4',
    damageType: 'magical',
    statModifiers: { intelligence: 2, maxMana: 5 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['mago'] },
    value: 20,
    isCustom: false,
  },
  {
    name: 'Bastón mágico',
    description: 'Un bastón imbuido con energía arcana.',
    type: 'weapon',
    subtype: 'staff',
    rarity: 'uncommon',
    icon: '🪄',
    damage: '1d6',
    damageType: 'magical',
    equippable: true,
    equipSlot: 'mainHand',
    statModifiers: { intelligence: 3, maxMana: 10 },
    requirements: { level: 1, classType: ['mago'], stats: { intelligence: 3 } },
    value: 100,
    isCustom: false,
  },
  {
    name: 'Varita de madera',
    description: 'Una varita tallada en madera de roble.',
    type: 'weapon',
    subtype: 'wand',
    rarity: 'common',
    icon: '✨',
    damage: '1d4',
    damageType: 'magical',
    statModifiers: { intelligence: 1, maxMana: 3 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['mago'] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Grimorio básico',
    description: 'Un libro de hechizos para principiantes.',
    type: 'accessory',
    subtype: 'tome',
    rarity: 'common',
    icon: '📖',
    statModifiers: { intelligence: 1, maxMana: 5 },
    equippable: true,
    equipSlot: 'offHand',
    requirements: { level: 1, classType: ['mago'] },
    value: 25,
    isCustom: false,
  },

  // ========================================
  // ARMAS DE LADRÓN
  // ========================================
  {
    name: 'Dagas gemelas',
    description: 'Un par de dagas ligeras para ataques rápidos.',
    type: 'weapon',
    subtype: 'dagger',
    rarity: 'common',
    icon: '🔪',
    damage: '1d4+1',
    damageType: 'physical',
    statModifiers: { dexterity: 2 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['ladron'] },
    value: 18,
    isCustom: false,
  },
  {
    name: 'Cuchillo arrojadizo',
    description: 'Cuchillos pequeños diseñados para lanzar.',
    type: 'weapon',
    subtype: 'throwing',
    rarity: 'common',
    icon: '🎯',
    damage: '1d4',
    damageType: 'physical',
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'offHand',
    stackable: true,
    requirements: { level: 1, classType: ['ladron', 'explorador'] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Ganzúas',
    description: 'Herramientas para abrir cerraduras.',
    type: 'misc',
    subtype: 'tools',
    rarity: 'common',
    icon: '🔓',
    statModifiers: { dexterity: 1 },
    equippable: false,
    requirements: { level: 1, classType: ['ladron'] },
    value: 10,
    isCustom: false,
  },

  // ========================================
  // ARMAS DE CLÉRIGO
  // ========================================
  {
    name: 'Maza de hierro',
    description: 'Una maza bendecida para combatir el mal.',
    type: 'weapon',
    subtype: 'mace',
    rarity: 'common',
    icon: '🔨',
    damage: '1d6',
    damageType: 'holy',
    statModifiers: { strength: 1, intelligence: 1 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['clerigo'] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Símbolo sagrado',
    description: 'Un medallón sagrado que canaliza poder divino.',
    type: 'accessory',
    subtype: 'holy',
    rarity: 'common',
    icon: '✝️',
    statModifiers: { intelligence: 2, maxMana: 5 },
    equippable: true,
    equipSlot: 'neck',
    requirements: { level: 1, classType: ['clerigo'] },
    value: 20,
    isCustom: false,
  },

  // ========================================
  // ARMAS DE EXPLORADOR
  // ========================================
  {
    name: 'Arco corto',
    description: 'Un arco ligero ideal para cazar.',
    type: 'weapon',
    subtype: 'bow',
    rarity: 'common',
    icon: '🏹',
    damage: '1d6',
    damageType: 'physical',
    statModifiers: { dexterity: 2 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['explorador'] },
    value: 20,
    isCustom: false,
  },
  {
    name: 'Arco largo',
    description: 'Un arco potente para disparos a larga distancia.',
    type: 'weapon',
    subtype: 'bow',
    rarity: 'uncommon',
    icon: '🏹',
    damage: '1d8',
    damageType: 'physical',
    statModifiers: { dexterity: 3 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: {
      level: 1,
      classType: ['explorador'],
      stats: { dexterity: 3 },
    },
    value: 45,
    isCustom: false,
  },
  {
    name: 'Carcaj con flechas',
    description: 'Un carcaj de cuero con 20 flechas.',
    type: 'accessory',
    subtype: 'quiver',
    rarity: 'common',
    icon: '🎯',
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'offHand',
    requirements: { level: 1, classType: ['explorador'] },
    value: 8,
    isCustom: false,
  },
  {
    name: 'Cuchillo de caza',
    description: 'Un cuchillo versátil para supervivencia.',
    type: 'weapon',
    subtype: 'knife',
    rarity: 'common',
    icon: '🔪',
    damage: '1d4',
    damageType: 'physical',
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'mainHand',
    requirements: { level: 1, classType: ['explorador', 'ladron'] },
    value: 8,
    isCustom: false,
  },

  // ========================================
  // ARMADURAS COMUNES (Todas las clases)
  // ========================================
  {
    name: 'Ropa de viajero',
    description: 'Ropa simple pero cómoda para viajar.',
    type: 'armor',
    subtype: 'cloth',
    rarity: 'common',
    icon: '👕',
    armorValue: 1,
    statModifiers: { defense: 1 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Botas de cuero',
    description: 'Botas resistentes para largos viajes.',
    type: 'armor',
    subtype: 'boots',
    rarity: 'common',
    icon: '👢',
    armorValue: 1,
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'feet',
    requirements: { level: 1, classType: [] },
    value: 8,
    isCustom: false,
  },
  {
    name: 'Guantes de cuero',
    description: 'Guantes que protegen las manos.',
    type: 'armor',
    subtype: 'gloves',
    rarity: 'common',
    icon: '🧤',
    armorValue: 1,
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'hands',
    requirements: { level: 1, classType: [] },
    value: 6,
    isCustom: false,
  },

  // ========================================
  // ARMADURAS POR CLASE
  // ========================================
  {
    name: 'Cota de malla ligera',
    description: 'Armadura de malla que ofrece buena protección.',
    type: 'armor',
    subtype: 'chainmail',
    rarity: 'common',
    icon: '🛡️',
    armorValue: 4,
    statModifiers: { defense: 3 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: ['guerrero', 'clerigo'] },
    value: 50,
    isCustom: false,
  },
  {
    name: 'Armadura de placas',
    description: 'La mejor protección disponible, pero muy pesada.',
    type: 'armor',
    rarity: 'rare',
    icon: '🏰',
    armorValue: 6,
    equippable: true,
    equipSlot: 'chest',
    statModifiers: { defense: 5, dexterity: -1 },
    requirements: { level: 1, classType: ['guerrero'], stats: { strength: 5 } },
    value: 500,
    isCustom: false,
  },
  {
    name: 'Túnica de mago',
    description: 'Una túnica que facilita el flujo de maná.',
    type: 'armor',
    subtype: 'robe',
    rarity: 'common',
    icon: '🧥',
    armorValue: 1,
    statModifiers: { intelligence: 1, maxMana: 10 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: ['mago'] },
    value: 25,
    isCustom: false,
  },
  {
    name: 'Armadura de cuero',
    description: 'Armadura ligera que permite movilidad.',
    type: 'armor',
    subtype: 'leather',
    rarity: 'common',
    icon: '🦺',
    armorValue: 2,
    statModifiers: { defense: 1, dexterity: 1 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: ['ladron', 'explorador'] },
    value: 30,
    isCustom: false,
  },
  {
    name: 'Capa con capucha',
    description: 'Una capa oscura ideal para pasar desapercibido.',
    type: 'armor',
    subtype: 'cloak',
    rarity: 'common',
    icon: '🧣',
    armorValue: 1,
    statModifiers: { dexterity: 2 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: ['ladron'] },
    value: 20,
    isCustom: false,
  },
  {
    name: 'Hábito de clérigo',
    description: 'Vestimenta religiosa que potencia la fe.',
    type: 'armor',
    subtype: 'robe',
    rarity: 'common',
    icon: '👘',
    armorValue: 2,
    statModifiers: { intelligence: 1, maxMana: 5, defense: 1 },
    equippable: true,
    equipSlot: 'chest',
    requirements: { level: 1, classType: ['clerigo'] },
    value: 25,
    isCustom: false,
  },

  // ========================================
  // CASCOS Y SOMBREROS
  // ========================================
  {
    name: 'Casco de hierro',
    description: 'Un casco básico de hierro.',
    type: 'armor',
    subtype: 'helmet',
    rarity: 'common',
    icon: '⛑️',
    armorValue: 2,
    statModifiers: { defense: 2 },
    equippable: true,
    equipSlot: 'head',
    requirements: { level: 1, classType: ['guerrero', 'clerigo'] },
    value: 20,
    isCustom: false,
  },
  {
    name: 'Sombrero de mago',
    description: 'Un sombrero puntiagudo tradicional.',
    type: 'armor',
    subtype: 'hat',
    rarity: 'common',
    icon: '🎩',
    armorValue: 0,
    statModifiers: { intelligence: 2, maxMana: 5 },
    equippable: true,
    equipSlot: 'head',
    requirements: { level: 1, classType: ['mago'] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Capucha de cuero',
    description: 'Una capucha que oculta el rostro.',
    type: 'armor',
    subtype: 'hood',
    rarity: 'common',
    icon: '🥷',
    armorValue: 1,
    statModifiers: { dexterity: 1 },
    equippable: true,
    equipSlot: 'head',
    requirements: { level: 1, classType: ['ladron', 'explorador'] },
    value: 12,
    isCustom: false,
  },

  // ========================================
  // ACCESORIOS COMUNES (Todas las clases)
  // ========================================
  {
    name: 'Anillo de cobre',
    description: 'Un anillo simple sin propiedades especiales.',
    type: 'accessory',
    subtype: 'ring',
    rarity: 'common',
    icon: '💍',
    statModifiers: {},
    equippable: true,
    equipSlot: 'ring1',
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Amuleto de protección',
    description: 'Un amuleto que ofrece protección menor.',
    type: 'accessory',
    subtype: 'amulet',
    rarity: 'common',
    icon: '📿',
    statModifiers: { defense: 1, maxHp: 5 },
    equippable: true,
    equipSlot: 'neck',
    requirements: { level: 1, classType: [] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Cinturón de aventurero',
    description: 'Un cinturón con varias bolsas para llevar objetos.',
    type: 'accessory',
    subtype: 'belt',
    rarity: 'common',
    icon: '🎒',
    statModifiers: { strength: 1 },
    equippable: false,
    requirements: { level: 1, classType: [] },
    value: 10,
    isCustom: false,
  },
  {
    name: 'Anillo de protección',
    description: 'Un anillo encantado que protege a su portador.',
    type: 'accessory',
    rarity: 'rare',
    icon: '💍',
    equippable: true,
    equipSlot: 'ring1',
    statModifiers: { defense: 2, maxHp: 5 },
    requirements: { level: 1, classType: [] },
    value: 300,
    isCustom: false,
  },
  {
    name: 'Amuleto de maná',
    description: 'Aumenta las reservas de maná de su portador.',
    type: 'accessory',
    rarity: 'rare',
    icon: '📿',
    equippable: true,
    equipSlot: 'neck',
    statModifiers: { maxMana: 15, intelligence: 1 },
    requirements: { level: 1, classType: [] },
    value: 350,
    isCustom: false,
  },
  {
    name: 'Botas de velocidad',
    description: 'Botas encantadas que mejoran la agilidad.',
    type: 'accessory',
    rarity: 'uncommon',
    icon: '👢',
    equippable: true,
    equipSlot: 'feet',
    statModifiers: { dexterity: 3 },
    requirements: { level: 1, classType: [] },
    value: 200,
    isCustom: false,
  },
  {
    name: 'Guantes de fuerza',
    description: 'Guantes que aumentan la fuerza física.',
    type: 'accessory',
    rarity: 'uncommon',
    icon: '🧤',
    equippable: true,
    equipSlot: 'hands',
    statModifiers: { strength: 3 },
    requirements: { level: 1, classType: [] },
    value: 200,
    isCustom: false,
  },

  // ========================================
  // ESCUDOS
  // ========================================
  {
    name: 'Escudo de acero',
    description: 'Un escudo resistente forjado en acero.',
    type: 'armor',
    subtype: 'shield',
    rarity: 'uncommon',
    icon: '🛡️',
    equippable: true,
    equipSlot: 'offHand',
    statModifiers: { defense: 3 },
    requirements: {
      level: 1,
      classType: ['guerrero', 'clerigo'],
      stats: { strength: 3 },
    },
    value: 100,
    isCustom: false,
  },

  // ========================================
  // CONSUMIBLES (Todas las clases)
  // ========================================
  {
    name: 'Poción de vida menor',
    description: 'Restaura 10 puntos de vida.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'common',
    icon: '❤️',
    useEffect: { type: 'heal', value: 10, description: 'Restaura 10 HP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Poción de vida',
    description: 'Restaura 20 puntos de vida.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'common',
    icon: '❤️',
    useEffect: { type: 'heal', value: 20, description: 'Restaura 20 HP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 25,
    isCustom: false,
  },
  {
    name: 'Poción de vida mayor',
    description: 'Restaura 50 puntos de vida.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'uncommon',
    icon: '❤️‍🔥',
    useEffect: { type: 'heal', value: 50, description: 'Restaura 50 HP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 75,
    isCustom: false,
  },
  {
    name: 'Poción de maná menor',
    description: 'Restaura 10 puntos de maná.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'common',
    icon: '💙',
    useEffect: { type: 'mana', value: 10, description: 'Restaura 10 MP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Poción de maná',
    description: 'Restaura 20 puntos de maná.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'common',
    icon: '💙',
    useEffect: { type: 'mana', value: 20, description: 'Restaura 20 MP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 25,
    isCustom: false,
  },
  {
    name: 'Poción de maná mayor',
    description: 'Restaura 50 puntos de maná.',
    type: 'consumable',
    subtype: 'potion',
    rarity: 'uncommon',
    icon: '💜',
    useEffect: { type: 'mana', value: 50, description: 'Restaura 50 MP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 75,
    isCustom: false,
  },
  {
    name: 'Elixir de fuerza',
    description: 'Aumenta la fuerza temporalmente.',
    type: 'consumable',
    subtype: 'elixir',
    rarity: 'rare',
    icon: '💪',
    useEffect: {
      type: 'buff',
      value: 3,
      duration: 3,
      description: '+3 Fuerza durante 3 turnos',
    },
    stackable: true,
    maxStack: 10,
    requirements: { level: 1, classType: [] },
    value: 150,
    isCustom: false,
  },
  {
    name: 'Antídoto',
    description: 'Cura el estado de envenenamiento.',
    type: 'consumable',
    subtype: 'medicine',
    rarity: 'common',
    icon: '🧪',
    useEffect: {
      type: 'cure',
      value: 0,
      description: 'Cura el envenenamiento',
    },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 15,
    isCustom: false,
  },
  {
    name: 'Vendas',
    description: 'Vendas para curar heridas leves.',
    type: 'consumable',
    subtype: 'medicine',
    rarity: 'common',
    icon: '🩹',
    useEffect: { type: 'heal', value: 10, description: 'Restaura 10 HP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Ración de viaje',
    description: 'Comida suficiente para un día de viaje.',
    type: 'consumable',
    subtype: 'food',
    rarity: 'common',
    icon: '🍖',
    useEffect: { type: 'heal', value: 5, description: 'Restaura 5 HP' },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 2,
    isCustom: false,
  },
  {
    name: 'Agua bendita',
    description: 'Agua consagrada que daña a no-muertos.',
    type: 'consumable',
    subtype: 'holy',
    rarity: 'common',
    icon: '💦',
    useEffect: {
      type: 'damage',
      value: 10,
      description: 'Inflige 10 de daño sagrado a no-muertos',
    },
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 15,
    isCustom: false,
  },

  // ========================================
  // MATERIALES (Todas las clases)
  // ========================================
  {
    name: 'Mineral de hierro',
    description: 'Usado para forjar armas y armaduras básicas.',
    type: 'material',
    subtype: 'ore',
    rarity: 'common',
    icon: '🪨',
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Cuero',
    description: 'Cuero curtido listo para trabajar.',
    type: 'material',
    subtype: 'leather',
    rarity: 'common',
    icon: '🟫',
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 3,
    isCustom: false,
  },
  {
    name: 'Tela',
    description: 'Un rollo de tela común.',
    type: 'material',
    subtype: 'cloth',
    rarity: 'common',
    icon: '🧵',
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 2,
    isCustom: false,
  },
  {
    name: 'Hierbas medicinales',
    description: 'Hierbas útiles para crear pociones.',
    type: 'material',
    subtype: 'herb',
    rarity: 'common',
    icon: '🌿',
    stackable: true,
    maxStack: 99,
    requirements: { level: 1, classType: [] },
    value: 3,
    isCustom: false,
  },
  {
    name: 'Gema de fuego',
    description: 'Una gema brillante llena de energía ígnea.',
    type: 'material',
    subtype: 'gem',
    rarity: 'rare',
    icon: '🔥',
    stackable: true,
    maxStack: 10,
    requirements: { level: 1, classType: [] },
    value: 100,
    isCustom: false,
  },
  {
    name: 'Esencia mágica',
    description: 'Esencia destilada de criaturas mágicas.',
    type: 'material',
    subtype: 'essence',
    rarity: 'uncommon',
    icon: '✨',
    stackable: true,
    maxStack: 50,
    requirements: { level: 1, classType: [] },
    value: 30,
    isCustom: false,
  },

  // ========================================
  // MISCELÁNEOS (Todas las clases)
  // ========================================
  {
    name: 'Cuerda (15m)',
    description: 'Una cuerda resistente de 15 metros.',
    type: 'misc',
    subtype: 'tool',
    rarity: 'common',
    icon: '🪢',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 5,
    isCustom: false,
  },
  {
    name: 'Mochila',
    description: 'Una mochila para llevar tus pertenencias.',
    type: 'misc',
    subtype: 'container',
    rarity: 'common',
    icon: '🎒',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 10,
    isCustom: false,
  },
  {
    name: 'Cantimplora',
    description: 'Para llevar agua durante el viaje.',
    type: 'misc',
    subtype: 'container',
    rarity: 'common',
    icon: '🫗',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 3,
    isCustom: false,
  },
  {
    name: 'Pedernal y yesca',
    description: 'Para encender fuego.',
    type: 'misc',
    subtype: 'tool',
    rarity: 'common',
    icon: '🔥',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 2,
    isCustom: false,
  },
  {
    name: 'Bolsa de monedas',
    description: 'Contiene algunas monedas de oro.',
    type: 'misc',
    subtype: 'currency',
    rarity: 'common',
    icon: '💰',
    stackable: true,
    requirements: { level: 1, classType: [] },
    value: 50,
    isCustom: false,
  },

  // ========================================
  // ITEMS DE MISIÓN
  // ========================================
  {
    name: 'Llave oxidada',
    description: 'Una vieja llave que parece abrir algo importante.',
    type: 'quest',
    rarity: 'uncommon',
    icon: '🗝️',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 0,
    isCustom: false,
  },
  {
    name: 'Mapa del tesoro',
    description: 'Un mapa antiguo que marca la ubicación de un tesoro.',
    type: 'quest',
    rarity: 'rare',
    icon: '🗺️',
    stackable: false,
    requirements: { level: 1, classType: [] },
    value: 0,
    isCustom: false,
  },
];

async function seedItems() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar items del sistema existentes (no custom)
    const deleted = await Item.deleteMany({ isCustom: false });
    console.log(
      `🗑️ ${deleted.deletedCount} items del sistema anteriores eliminados`,
    );

    // Insertar items base en lotes para evitar timeouts con datasets grandes
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < baseItems.length; i += BATCH_SIZE) {
      const batch = baseItems.slice(i, i + BATCH_SIZE);
      await Item.insertMany(batch, { ordered: false }); // ordered: false para continuar si hay errores
      insertedCount += batch.length;
      console.log(
        `   Procesados ${insertedCount}/${baseItems.length} items...`,
      );
    }

    console.log(`✅ ${baseItems.length} items base insertados`);

    // Resumen por tipo
    const typeCount = baseItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Items por tipo:');
    const typeNames = {
      weapon: '⚔️ Armas',
      armor: '🛡️ Armaduras',
      accessory: '💍 Accesorios',
      consumable: '🧪 Consumibles',
      material: '🪨 Materiales',
      misc: '📦 Misceláneos',
      quest: '📜 Misión',
    };
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${typeNames[type] || type}: ${count}`);
    });

    // Resumen por clase
    console.log('\n🎭 Items disponibles por clase:');
    const classes = ['guerrero', 'mago', 'ladron', 'clerigo', 'explorador'];
    classes.forEach((cls) => {
      const classItems = baseItems.filter(
        (item) =>
          !item.requirements?.classType?.length || // Sin restricción = todas las clases
          item.requirements.classType.includes(cls),
      );
      const classNames = {
        guerrero: '⚔️ Guerrero',
        mago: '🧙 Mago',
        ladron: '🗡️ Ladrón',
        clerigo: '✝️ Clérigo',
        explorador: '🏹 Explorador',
      };
      console.log(`   ${classNames[cls]}: ${classItems.length} items`);
    });

    // Items exclusivos por clase
    console.log('\n🔒 Items exclusivos por clase:');
    classes.forEach((cls) => {
      const exclusiveItems = baseItems.filter(
        (item) =>
          item.requirements?.classType?.length > 0 &&
          item.requirements.classType.includes(cls),
      );
      if (exclusiveItems.length > 0) {
        const classNames = {
          guerrero: '⚔️ Guerrero',
          mago: '🧙 Mago',
          ladron: '🗡️ Ladrón',
          clerigo: '✝️ Clérigo',
          explorador: '🏹 Explorador',
        };
        console.log(`   ${classNames[cls]}:`);
        exclusiveItems.forEach((item) => {
          const sharedWith = item.requirements.classType.filter(
            (c) => c !== cls,
          );
          const shared =
            sharedWith.length > 0
              ? ` (compartido con: ${sharedWith.join(', ')})`
              : '';
          console.log(`      ${item.icon} ${item.name}${shared}`);
        });
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedItems();
