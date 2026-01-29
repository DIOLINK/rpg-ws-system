// Script para precargar habilidades de clase en MongoDB (ESM)
import { connectDB } from '../config/db.js';
import classAbilities from '../data/classAbilities.js';
import ClassAbility from '../models/ClassAbility.js';

const seed = async () => {
  await connectDB();
  await ClassAbility.deleteMany({});
  const docs = [];
  for (const classType in classAbilities) {
    for (const ability of classAbilities[classType]) {
      docs.push({ ...ability, classType });
    }
  }
  await ClassAbility.insertMany(docs);
  console.log('Habilidades de clase precargadas.');
  process.exit();
};

seed();
