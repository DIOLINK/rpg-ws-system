// Script para listar todos los items de tipo 'consumable' que no tienen useEffect
// Uso: node listConsumablesWithoutUseEffect.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

dotenv.config({ path: './src/.env' });

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/rpg-ws-system';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB');

  // Buscar todos los consumibles
  const consumables = await Item.find({ type: 'consumable' });
  if (!consumables.length) {
    console.log('No hay items consumibles en la base de datos.');
    process.exit(0);
  }

  // Mostrar lista de consumibles y si tienen useEffect
  console.log('\nLista de items consumibles:');
  consumables.forEach((item, idx) => {
    const hasEffect = item.useEffect && item.useEffect.type;
    console.log(
      `${idx + 1}. ${item.name} (ID: ${item._id})${hasEffect ? '' : ' [SIN useEffect]'}`,
    );
  });

  // Mostrar resumen de cuántos no tienen useEffect
  const withoutEffect = consumables.filter(
    (item) => !item.useEffect || !item.useEffect.type,
  );
  console.log(`\nTotal sin useEffect: ${withoutEffect.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
