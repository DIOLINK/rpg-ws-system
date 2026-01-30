#!/usr/bin/env node
import mongoose from 'mongoose';
import { connectDB } from '../../src/config/db.js';
import { Item } from '../../src/models/Item.js';

function usage() {
  console.log(
    'Usage: node setItemValue.js --name "Item Name" --value 4 [--upsert]',
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--name') parsed.name = args[++i];
    else if (a === '--value') parsed.value = Number(args[++i]);
    else if (a === '--upsert') parsed.upsert = true;
    else if (a === '--help' || a === '-h') usage();
  }

  if (
    !parsed.name ||
    typeof parsed.value !== 'number' ||
    Number.isNaN(parsed.value)
  ) {
    usage();
  }

  await connectDB();

  try {
    const nameRegex = new RegExp(
      `^${parsed.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    const items = await Item.find({ name: { $regex: nameRegex } });

    if (items.length === 0) {
      if (parsed.upsert) {
        const newItem = new Item({
          name: parsed.name,
          description: '',
          type: 'misc',
          rarity: 'common',
          icon: '📦',
          value: parsed.value,
          stackable: true,
          isCustom: false,
        });
        await newItem.save();
        console.log(
          `Created new item '${newItem.name}' with value=${parsed.value}`,
        );
      } else {
        console.log(
          `No items found with name matching '${parsed.name}'. Use --upsert to create.`,
        );
      }
    } else {
      for (const it of items) {
        const old = it.value || 0;
        it.value = parsed.value;
        await it.save();
        console.log(`Updated '${it.name}': value ${old} -> ${it.value}`);
      }
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
