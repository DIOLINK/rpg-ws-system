#!/usr/bin/env node
import mongoose from 'mongoose';
import { connectDB } from '../../src/config/db.js';
import { Character } from '../../src/models/Character.js';
import { Item } from '../../src/models/Item.js';
import { NPCTemplate } from '../../src/models/NPCTemplate.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

async function main() {
  await connectDB();

  try {
    console.log('🔎 Recolectando items desde plantillas de NPC...');
    const templates = await NPCTemplate.find({}).lean();
    const itemsMap = new Map();

    for (const tpl of templates) {
      const level = tpl.level || 1;
      for (const it of tpl.inventory || []) {
        const key = normalize(it.name);
        if (!key) continue;
        if (!itemsMap.has(key)) {
          itemsMap.set(key, { item: it, source: 'template', level });
        }
      }
    }

    console.log('🔎 Recolectando items desde NPCs existentes...');
    const npcs = await Character.find({ isNPC: true }).lean();
    for (const npc of npcs) {
      for (const it of npc.inventory || []) {
        const key = normalize(it.name);
        if (!key) continue;
        if (!itemsMap.has(key)) {
          itemsMap.set(key, { item: it, source: 'npc', level: null });
        }
      }
    }

    console.log(`🗂️ Encontrados ${itemsMap.size} items únicos para procesar.`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [key, data] of itemsMap.entries()) {
      const it = data.item;

      const existing = await Item.findOne({ name: it.name });

      // Default value: prefer item.value, else template-level based, else 1
      const defaultValue =
        it.value && it.value > 0
          ? it.value
          : data.level
            ? Math.max(1, Math.floor(data.level * 2))
            : 1;

      if (existing) {
        if (!existing.value || existing.value === 0) {
          existing.value = defaultValue;
          await existing.save();
          updated += 1;
          console.log(
            `✏️ Actualizado: ${existing.name} -> value=${defaultValue}`,
          );
        } else {
          skipped += 1;
        }
      } else {
        const newItem = new Item({
          name: it.name,
          description: it.description || '',
          type: it.type || 'misc',
          rarity: it.rarity || 'common',
          icon: it.icon || '📦',
          equippable: !!it.equippable,
          equipSlot: it.equipSlot || undefined,
          stackable: it.stackable !== undefined ? it.stackable : true,
          maxStack: it.maxStack || 99,
          value: defaultValue,
          damage: it.damage || '',
          statModifiers: it.statModifiers || {},
          isCustom: false,
        });

        await newItem.save();
        created += 1;
        console.log(`✅ Creado: ${newItem.name} -> value=${defaultValue}`);
      }
    }

    console.log('-------------------------');
    console.log(`Creado: ${created}`);
    console.log(`Actualizado: ${updated}`);
    console.log(`Omitido (ya tenían value): ${skipped}`);
  } catch (e) {
    console.error('Error procesando items:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
