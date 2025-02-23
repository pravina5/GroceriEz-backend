import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  shelfLife: { type: Number, required: true },
  category: { type: String, required: true },
  preservationInfo: {
    storage: { type: String },
    shelfLife: { type: String },
    tips: [String]
  }
});

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);