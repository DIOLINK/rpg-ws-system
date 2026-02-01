import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { NPCTemplate } from '../models/NPCTemplate.js';

dotenv.config({ path: './src/.env' });

const defaultNPCTemplates = [
  // === ENEMIGOS BÁSICOS ===
  {
    name: 'Goblin',
    description: 'Criatura pequeña y maliciosa, débil pero astuta.',
    classType: 'Enemigo Menor',
    icon: '👺',
    stats: {
      hp: 8,
      maxHp: 8,
      mana: 0,
      maxMana: 0,
      strength: 2,
      intelligence: 1,
      dexterity: 3,
      defense: 1,
    },
    abilities: [
      {
        id: 'goblin_slash',
        name: 'Corte Sucio',
        description: 'Un ataque rápido con una daga oxidada.',
        damage: '1d4',
        manaCost: 0,
        icon: '🗡️',
      },
    ],
    inventory: [
      { name: 'Daga Oxidada', icon: '🗡️', quantity: 1, dropChance: 30 },
      { name: 'Monedas Sucias', icon: '🪙', quantity: 1, dropChance: 50 },
    ],
    goldDrop: { min: 1, max: 5 },
    expReward: 15,
    level: 1,
    npcType: 'enemy',
    isGlobal: true,
  },
  {
    name: 'Esqueleto',
    description: 'Restos animados de un guerrero caído.',
    classType: 'No-muerto',
    icon: '💀',
    stats: {
      hp: 12,
      maxHp: 12,
      mana: 0,
      maxMana: 0,
      strength: 3,
      intelligence: 1,
      dexterity: 2,
      defense: 2,
    },
    abilities: [
      {
        id: 'skeleton_strike',
        name: 'Golpe Óseo',
        description: 'Ataque con huesos afilados.',
        damage: '1d6',
        manaCost: 0,
        icon: '🦴',
      },
    ],
    inventory: [
      { name: 'Hueso Antiguo', icon: '🦴', quantity: 1, dropChance: 40 },
      { name: 'Espada Mellada', icon: '⚔️', quantity: 1, dropChance: 20 },
    ],
    goldDrop: { min: 0, max: 3 },
    expReward: 20,
    level: 2,
    npcType: 'enemy',
    isGlobal: true,
  },
  {
    name: 'Lobo Salvaje',
    description: 'Depredador feroz de los bosques.',
    classType: 'Bestia',
    icon: '🐺',
    stats: {
      hp: 10,
      maxHp: 10,
      mana: 0,
      maxMana: 0,
      strength: 3,
      intelligence: 1,
      dexterity: 4,
      defense: 1,
    },
    abilities: [
      {
        id: 'wolf_bite',
        name: 'Mordisco',
        description: 'Un mordisco feroz.',
        damage: '1d6',
        manaCost: 0,
        icon: '🦷',
      },
      {
        id: 'wolf_howl',
        name: 'Aullido',
        description: 'Llama a la manada.',
        damage: '0',
        manaCost: 0,
        icon: '🌙',
      },
    ],
    inventory: [
      { name: 'Piel de Lobo', icon: '🦊', quantity: 1, dropChance: 60 },
      { name: 'Colmillo de Lobo', icon: '🦷', quantity: 1, dropChance: 40 },
    ],
    goldDrop: { min: 0, max: 0 },
    expReward: 18,
    level: 2,
    npcType: 'enemy',
    isGlobal: true,
  },
  {
    name: 'Bandido',
    description: 'Ladrón de caminos, peligroso pero cobarde.',
    classType: 'Humanoide',
    icon: '🥷',
    stats: {
      hp: 15,
      maxHp: 15,
      mana: 0,
      maxMana: 0,
      strength: 3,
      intelligence: 2,
      dexterity: 3,
      defense: 2,
    },
    abilities: [
      {
        id: 'bandit_slash',
        name: 'Estocada',
        description: 'Un ataque rápido con espada.',
        damage: '1d6+1',
        manaCost: 0,
        icon: '⚔️',
      },
      {
        id: 'bandit_throw',
        name: 'Lanzar Cuchillo',
        description: 'Ataque a distancia.',
        damage: '1d4',
        manaCost: 0,
        icon: '🔪',
      },
    ],
    inventory: [
      { name: 'Espada Corta', icon: '⚔️', quantity: 1, dropChance: 25 },
      { name: 'Cuchillo Arrojadizo', icon: '🔪', quantity: 3, dropChance: 50 },
      { name: 'Bolsa de Monedas', icon: '💰', quantity: 1, dropChance: 70 },
    ],
    goldDrop: { min: 5, max: 15 },
    expReward: 25,
    level: 3,
    npcType: 'enemy',
    isGlobal: true,
  },
  {
    name: 'Orco',
    description: 'Guerrero brutal de gran fuerza.',
    classType: 'Humanoide',
    icon: '👹',
    stats: {
      hp: 25,
      maxHp: 25,
      mana: 0,
      maxMana: 0,
      strength: 5,
      intelligence: 1,
      dexterity: 2,
      defense: 3,
    },
    abilities: [
      {
        id: 'orc_smash',
        name: 'Aplastamiento',
        description: 'Un golpe devastador con su maza.',
        damage: '2d6',
        manaCost: 0,
        icon: '🔨',
      },
      {
        id: 'orc_rage',
        name: 'Furia',
        description: 'Aumenta su fuerza temporalmente.',
        damage: '0',
        manaCost: 0,
        icon: '😤',
      },
    ],
    inventory: [
      { name: 'Maza de Guerra', icon: '🔨', quantity: 1, dropChance: 30 },
      { name: 'Amuleto Tribal', icon: '📿', quantity: 1, dropChance: 15 },
    ],
    goldDrop: { min: 8, max: 20 },
    expReward: 40,
    level: 4,
    npcType: 'enemy',
    isGlobal: true,
  },

  // === MINIBOSSES ===
  {
    name: 'Capitán Goblin',
    description: 'Líder de una banda de goblins, más inteligente y peligroso.',
    classType: 'Líder',
    icon: '👺',
    stats: {
      hp: 30,
      maxHp: 30,
      mana: 5,
      maxMana: 5,
      strength: 4,
      intelligence: 3,
      dexterity: 4,
      defense: 3,
    },
    abilities: [
      {
        id: 'goblin_cap_slash',
        name: 'Corte Venenoso',
        description: 'Ataque con daga envenenada.',
        damage: '1d6+2',
        manaCost: 0,
        icon: '🗡️',
      },
      {
        id: 'goblin_cap_call',
        name: 'Llamar Refuerzos',
        description: 'Convoca goblins adicionales.',
        damage: '0',
        manaCost: 3,
        icon: '📯',
      },
    ],
    inventory: [
      { name: 'Daga Envenenada', icon: '🗡️', quantity: 1, dropChance: 50 },
      { name: 'Corona de Huesos', icon: '👑', quantity: 1, dropChance: 30 },
      { name: 'Llave del Tesoro', icon: '🗝️', quantity: 1, dropChance: 100 },
    ],
    goldDrop: { min: 20, max: 40 },
    expReward: 80,
    level: 5,
    npcType: 'miniboss',
    isGlobal: true,
  },
  {
    name: 'Caballero Oscuro',
    description: 'Un caballero corrompido por la oscuridad.',
    classType: 'No-muerto',
    icon: '⚔️',
    stats: {
      hp: 50,
      maxHp: 50,
      mana: 10,
      maxMana: 10,
      strength: 6,
      intelligence: 3,
      dexterity: 3,
      defense: 6,
    },
    abilities: [
      {
        id: 'dk_slash',
        name: 'Tajo Sombrío',
        description: 'Un corte imbuido de oscuridad.',
        damage: '2d6+3',
        manaCost: 0,
        icon: '⚔️',
      },
      {
        id: 'dk_drain',
        name: 'Drenar Vida',
        description: 'Roba vida del objetivo.',
        damage: '1d8',
        manaCost: 5,
        icon: '💜',
      },
    ],
    inventory: [
      { name: 'Espada Maldita', icon: '⚔️', quantity: 1, dropChance: 40 },
      { name: 'Armadura Oscura', icon: '🛡️', quantity: 1, dropChance: 25 },
      { name: 'Amuleto de Sombras', icon: '📿', quantity: 1, dropChance: 35 },
    ],
    goldDrop: { min: 30, max: 60 },
    expReward: 120,
    level: 7,
    npcType: 'miniboss',
    isGlobal: true,
  },

  // === BOSSES ===
  {
    name: 'Dragón Joven',
    description:
      'Un dragón que aún no ha alcanzado su máximo poder, pero sigue siendo letal.',
    classType: 'Dragón',
    icon: '🐉',
    stats: {
      hp: 100,
      maxHp: 100,
      mana: 30,
      maxMana: 30,
      strength: 8,
      intelligence: 6,
      dexterity: 4,
      defense: 8,
    },
    abilities: [
      {
        id: 'dragon_claw',
        name: 'Zarpazo',
        description: 'Un devastador ataque con garras.',
        damage: '3d6',
        manaCost: 0,
        icon: '🐲',
      },
      {
        id: 'dragon_breath',
        name: 'Aliento de Fuego',
        description: 'Una llamarada que afecta a todos los enemigos.',
        damage: '4d6',
        manaCost: 10,
        icon: '🔥',
      },
      {
        id: 'dragon_tail',
        name: 'Golpe de Cola',
        description: 'Barre a los enemigos cercanos.',
        damage: '2d8',
        manaCost: 0,
        icon: '💨',
      },
    ],
    inventory: [
      { name: 'Escama de Dragón', icon: '🔷', quantity: 3, dropChance: 80 },
      { name: 'Garra de Dragón', icon: '🦷', quantity: 1, dropChance: 60 },
      { name: 'Corazón de Dragón', icon: '❤️', quantity: 1, dropChance: 20 },
      { name: 'Tesoro del Dragón', icon: '💎', quantity: 1, dropChance: 100 },
    ],
    goldDrop: { min: 100, max: 250 },
    expReward: 300,
    level: 10,
    npcType: 'boss',
    isGlobal: true,
  },
  {
    name: 'Liche',
    description:
      'Un mago que ha conquistado la muerte a costa de su humanidad.',
    classType: 'No-muerto',
    icon: '💀',
    stats: {
      hp: 80,
      maxHp: 80,
      mana: 100,
      maxMana: 100,
      strength: 3,
      intelligence: 10,
      dexterity: 3,
      defense: 5,
    },
    abilities: [
      {
        id: 'lich_bolt',
        name: 'Rayo de Muerte',
        description: 'Un rayo de energía necromántica.',
        damage: '3d8',
        manaCost: 8,
        icon: '⚡',
      },
      {
        id: 'lich_summon',
        name: 'Invocar Muertos',
        description: 'Levanta esqueletos para pelear.',
        damage: '0',
        manaCost: 15,
        icon: '💀',
      },
      {
        id: 'lich_curse',
        name: 'Maldición',
        description: 'Reduce las estadísticas del objetivo.',
        damage: '0',
        manaCost: 10,
        icon: '☠️',
      },
      {
        id: 'lich_heal',
        name: 'Absorber Almas',
        description: 'Se cura drenando almas.',
        damage: '0',
        manaCost: 20,
        icon: '👻',
      },
    ],
    inventory: [
      { name: 'Filacteria del Liche', icon: '💎', quantity: 1, dropChance: 10 },
      { name: 'Báculo de la Muerte', icon: '🪄', quantity: 1, dropChance: 40 },
      { name: 'Grimorio Oscuro', icon: '📕', quantity: 1, dropChance: 50 },
      { name: 'Anillo del Liche', icon: '💍', quantity: 1, dropChance: 30 },
    ],
    goldDrop: { min: 80, max: 200 },
    expReward: 350,
    level: 12,
    npcType: 'boss',
    isGlobal: true,
  },

  // === NEUTRALES/ALIADOS ===
  {
    name: 'Comerciante Viajero',
    description: 'Un vendedor ambulante que recorre los caminos.',
    classType: 'Comerciante',
    icon: '🧔',
    stats: {
      hp: 15,
      maxHp: 15,
      mana: 0,
      maxMana: 0,
      strength: 2,
      intelligence: 3,
      dexterity: 2,
      defense: 1,
    },
    abilities: [],
    inventory: [
      { name: 'Poción de Vida', icon: '🧪', quantity: 3, dropChance: 100 },
      { name: 'Antídoto', icon: '💚', quantity: 2, dropChance: 100 },
    ],
    goldDrop: { min: 50, max: 100 },
    expReward: 0,
    level: 1,
    npcType: 'neutral',
    isGlobal: true,
  },
  {
    name: 'Guardia de la Ciudad',
    description: 'Protector del orden público.',
    classType: 'Guardia',
    icon: '💂',
    stats: {
      hp: 20,
      maxHp: 20,
      mana: 0,
      maxMana: 0,
      strength: 4,
      intelligence: 2,
      dexterity: 3,
      defense: 4,
    },
    abilities: [
      {
        id: 'guard_strike',
        name: 'Golpe de Lanza',
        description: 'Ataque con lanza reglamentaria.',
        damage: '1d8',
        manaCost: 0,
        icon: '🔱',
      },
      {
        id: 'guard_shield',
        name: 'Bloqueo',
        description: 'Aumenta defensa temporalmente.',
        damage: '0',
        manaCost: 0,
        icon: '🛡️',
      },
    ],
    inventory: [
      { name: 'Lanza de Guardia', icon: '🔱', quantity: 1, dropChance: 20 },
      { name: 'Escudo de la Ciudad', icon: '🛡️', quantity: 1, dropChance: 10 },
    ],
    goldDrop: { min: 5, max: 15 },
    expReward: 30,
    level: 3,
    npcType: 'ally',
    isGlobal: true,
  },
];

async function seedNPCTemplates() {
  try {
    await connectDB();

    // Limpiar plantillas globales existentes
    await NPCTemplate.deleteMany({ isGlobal: true });

    // Insertar nuevas plantillas en lotes
    const BATCH_SIZE = 50;
    let insertedCount = 0;

    for (let i = 0; i < defaultNPCTemplates.length; i += BATCH_SIZE) {
      const batch = defaultNPCTemplates.slice(i, i + BATCH_SIZE);
      await NPCTemplate.insertMany(batch, { ordered: false });
      insertedCount += batch.length;
      console.log(
        `   Procesados ${insertedCount}/${defaultNPCTemplates.length} NPCs...`,
      );
    }

    console.log('✅ Plantillas de NPC creadas exitosamente');
    console.log(`   Total: ${defaultNPCTemplates.length} plantillas`);

    // Mostrar resumen por tipo
    const enemyCount = defaultNPCTemplates.filter(
      (t) => t.npcType === 'enemy',
    ).length;
    const minibossCount = defaultNPCTemplates.filter(
      (t) => t.npcType === 'miniboss',
    ).length;
    const bossCount = defaultNPCTemplates.filter(
      (t) => t.npcType === 'boss',
    ).length;
    const neutralCount = defaultNPCTemplates.filter(
      (t) => t.npcType === 'neutral',
    ).length;
    const allyCount = defaultNPCTemplates.filter(
      (t) => t.npcType === 'ally',
    ).length;

    console.log(`   - Enemigos: ${enemyCount}`);
    console.log(`   - Minibosses: ${minibossCount}`);
    console.log(`   - Bosses: ${bossCount}`);
    console.log(`   - Neutrales: ${neutralCount}`);
    console.log(`   - Aliados: ${allyCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear plantillas de NPC:', error);
    process.exit(1);
  }
}

seedNPCTemplates();
