// Script para asignar useEffect a items consumibles por ID
// Uso: node assignUseEffectToConsumables.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

dotenv.config({ path: './src/.env' });

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/rpg-ws-system';

// Mapea los IDs a los efectos deseados
const effectsById = {
  '697bb49b5e987e69aef70fe7': {
    // Poción de vida menor
    type: 'heal',
    value: 10,
    description: 'Restaura 10 puntos de vida al consumirla.',
  },
  '697bb49b5e987e69aef70fe8': {
    // Poción de vida
    type: 'heal',
    value: 25,
    description: 'Restaura 25 puntos de vida al consumirla.',
  },
  '697bb49b5e987e69aef70fea': {
    // Poción de maná menor
    type: 'mana',
    value: 10,
    description: 'Restaura 10 puntos de maná al consumirla.',
  },
  '697bb49b5e987e69aef70feb': {
    // Poción de maná
    type: 'mana',
    value: 25,
    description: 'Restaura 25 puntos de maná al consumirla.',
  },
  '697bb49b5e987e69aef70fee': {
    // Antídoto
    type: 'cure',
    value: 1,
    description: 'Cura el estado de veneno.',
  },
  '697bb49b5e987e69aef70fef': {
    // Vendas
    type: 'heal',
    value: 5,
    description: 'Restaura 5 puntos de vida.',
  },
  '697bb49b5e987e69aef70ff0': {
    // Ración de viaje
    type: 'heal',
    value: 2,
    description: 'Restaura 2 puntos de vida.',
  },
  '697bb49b5e987e69aef70ff1': {
    // Agua bendita
    type: 'damage',
    value: 15,
    description: 'Inflige 15 de daño a enemigos no-muertos.',
  },
  '697bb49b5e987e69aef70fed': {
    // Elixir de fuerza
    type: 'buff',
    value: 2,
    duration: 3,
    description: 'Aumenta la fuerza en +2 durante 3 turnos.',
  },
  '697bb49b5e987e69aef70fe9': {
    // Poción de vida mayor
    type: 'heal',
    value: 50,
    description: 'Restaura 50 puntos de vida al consumirla.',
  },
  '697bb49b5e987e69aef70fec': {
    // Poción de maná mayor
    type: 'mana',
    value: 50,
    description: 'Restaura 50 puntos de maná al consumirla.',
  },
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB');

  let updated = 0;
  for (const [id, useEffect] of Object.entries(effectsById)) {
    const item = await Item.findById(id);
    if (!item) {
      console.log(`❌ No se encontró el item con ID: ${id}`);
      continue;
    }
    item.useEffect = useEffect;
    await item.save();
    console.log(`✅ useEffect asignado a: ${item.name} (${id})`);
    updated++;
  }

  console.log(`\nTotal de items actualizados: ${updated}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
