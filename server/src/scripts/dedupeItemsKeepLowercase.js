#!/usr/bin/env node
import mongoose from 'mongoose';
import { connectDB } from '../../src/config/db.js';
import { Character } from '../../src/models/Character.js';
import { Item } from '../../src/models/Item.js';
import { NPCTemplate } from '../../src/models/NPCTemplate.js';

const isLowercaseStart = (s) => {
  if (!s || s.length === 0) return false;
  const ch = s.trim().charAt(0);
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase();
};

async function main() {
  await connectDB();
  try {
    const items = await Item.find({}).lean();
    const groups = new Map();

    for (const it of items) {
      const key = (it.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }

    let totalGroups = 0;
    let totalDeleted = 0;
    let totalUpdatedRefs = 0;

    for (const [nameKey, group] of groups.entries()) {
      if (group.length < 2) continue;
      totalGroups += 1;
      // choose keeper: prefer one that starts lowercase
      let keeper = group.find((g) => isLowercaseStart(g.name));
      if (!keeper) {
        // fallback: earliest createdAt or smallest _id
        keeper = group.reduce((a, b) => {
          if (!a.createdAt) return b;
          if (!b.createdAt) return a;
          return new Date(a.createdAt) <= new Date(b.createdAt) ? a : b;
        });
      }

      const duplicates = group.filter(
        (g) => g._id.toString() !== keeper._id.toString(),
      );
      if (duplicates.length === 0) continue;

      console.log(
        `\nProcesando grupo '${keeper.name}' (${group.length} items), keeper: ${keeper._id}`,
      );

      for (const dup of duplicates) {
        // Reasignar itemRef en Character.inventory
        const chars = await Character.find({
          $or: [
            { 'inventory.itemRef': dup._id },
            { equipment: { $exists: true } },
          ],
        });

        for (const ch of chars) {
          let modified = false;
          // inventory
          if (Array.isArray(ch.inventory)) {
            for (const inv of ch.inventory) {
              if (
                inv &&
                inv.itemRef &&
                inv.itemRef.toString() === dup._id.toString()
              ) {
                inv.itemRef = mongoose.Types.ObjectId(keeper._id);
                modified = true;
                totalUpdatedRefs += 1;
              }
            }
          }
          // equipment (object of slot->inventoryId)
          if (ch.equipment && typeof ch.equipment === 'object') {
            for (const slot of Object.keys(ch.equipment)) {
              if (!ch.equipment[slot]) continue;
              if (ch.equipment[slot].toString() === dup._id.toString()) {
                ch.equipment[slot] = keeper._id.toString();
                modified = true;
                totalUpdatedRefs += 1;
              }
            }
          }
          if (modified) {
            await ch.save();
            console.log(
              `  - Actualizado Character ${ch._id} referencias de ${dup._id} -> ${keeper._id}`,
            );
          }
        }

        // Reasignar en NPCTemplate.inventory si existe itemRef
        const templates = await NPCTemplate.find({
          'inventory.itemRef': dup._id,
        });
        for (const tpl of templates) {
          let mod = false;
          for (const inv of tpl.inventory) {
            if (
              inv &&
              inv.itemRef &&
              inv.itemRef.toString() === dup._id.toString()
            ) {
              inv.itemRef = mongoose.Types.ObjectId(keeper._id);
              mod = true;
            }
          }
          if (mod) {
            await tpl.save();
            console.log(
              `  - Actualizado NPCTemplate ${tpl._id} referencias de ${dup._id} -> ${keeper._id}`,
            );
            totalUpdatedRefs += 1;
          }
        }

        // Finalmente eliminar el item duplicado
        await Item.findByIdAndDelete(dup._id);
        totalDeleted += 1;
        console.log(`  - Eliminado Item duplicado ${dup._id} ('${dup.name}')`);
      }
    }

    console.log('\nResumen:');
    console.log(`Grupos procesados: ${totalGroups}`);
    console.log(`Referencias actualizadas: ${totalUpdatedRefs}`);
    console.log(`Items eliminados: ${totalDeleted}`);
  } catch (e) {
    console.error('Error durante deduplicación:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
