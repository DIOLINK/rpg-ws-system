import mongoose from 'mongoose';

const classAbilitySchema = new mongoose.Schema({
  classType: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  stat: {
    type: String,
    enum: ['strength', 'intelligence', 'dexterity', 'defense'],
    required: true,
  },
  baseDamage: { type: Number, default: 0 },
  manaCost: { type: Number, default: 0 },
});

const ClassAbility = mongoose.model('ClassAbility', classAbilitySchema);
export default ClassAbility;
