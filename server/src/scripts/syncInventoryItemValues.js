#!/usr/bin/env node
import mongoose from 'mongoose';
import { connectDB } from '../../src/config/db.js';
import { Character } from '../../src/models/Character.js';
import { Item } from '../../src/models/Item.js';
import { NPCTemplate } from '../../src/models/NPCTemplate.js';

async function syncCharacterInventories() {
  const chars = await Character.find({});
  let updatedCount = 0;
  for (const ch of chars) {
    let modified = false;
    if (Array.isArray(ch.inventory)) {
      for (const inv of ch.inventory) {
        try {
          if (inv.itemRef) {
            const item = await Item.findById(inv.itemRef);
            if (item) {
              const newVal = item.value || 0;
              if ((inv.value || 0) !== newVal) {
                inv.value = newVal;
                modified = true;
              }
            }
          } else if (inv.name) {
            const itemByName = await Item.findOne({ name: inv.name });
            if (itemByName) {
              const newVal = itemByName.value || 0;
              if ((inv.value || 0) !== newVal) {
                inv.value = newVal;
                modified = true;
              }
            }
          }
        } catch (e) {
          console.warn('Error syncing inv item', inv && inv.id, e.message);
        }
      }
    }

    if (modified) {
      await ch.save();
      updatedCount += 1;
      console.log(`Updated character ${ch._id} inventory values`);
    }
  }
  return updatedCount;
}

async function syncNPCTemplates() {
  const templates = await NPCTemplate.find({});
  let updatedCount = 0;
  for (const tpl of templates) {
    let modified = false;
    if (Array.isArray(tpl.inventory)) {
      for (const inv of tpl.inventory) {
        try {
          if (inv.itemRef) {
            const item = await Item.findById(inv.itemRef);
            if (item) {
              const newVal = item.value || 0;
              if ((inv.value || 0) !== newVal) {
                inv.value = newVal;
                modified = true;
              }
            }
          } else if (inv.name) {
            const itemByName = await Item.findOne({ name: inv.name });
            if (itemByName) {
              const newVal = itemByName.value || 0;
              if ((inv.value || 0) !== newVal) {
                inv.value = newVal;
                modified = true;
              }
            }
          }
        } catch (e) {
          console.warn('Error syncing template inv', inv && inv.id, e.message);
        }
      }
    }

    if (modified) {
      await tpl.save();
      updatedCount += 1;
      console.log(`Updated template ${tpl._id} inventory values`);
    }
  }
  return updatedCount;
}

async function main() {
  await connectDB();
  try {
    console.log(
      '🔁 Sincronizando valores de items en inventarios de personajes...',
    );
    const charsUpdated = await syncCharacterInventories();
    console.log(`✅ Characters updated: ${charsUpdated}`);

    console.log('🔁 Sincronizando valores de items en plantillas NPC...');
    const tplUpdated = await syncNPCTemplates();
    console.log(`✅ NPCTemplates updated: ${tplUpdated}`);
  } catch (e) {
    console.error('Error durante sincronización:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
