import mongoose from 'mongoose';
const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
    preparationTime: { type: Number, required: true },
    servings: { type: Number, required: true },
    instructions: [String],
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    },
    aiSuggestions: {
      cookingTips: [String],
      nutritionInfo: String,
      alternatives: [String]
    }
  });
  
  export const Recipe = mongoose.model('Recipe', recipeSchema);