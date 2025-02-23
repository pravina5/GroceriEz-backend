import mongoose from 'mongoose';
const mealPlanSchema = new mongoose.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    meals: [{
      date: { type: Date, required: true },
      breakfast: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
      lunch: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
      dinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }
    }],
    aiRecommendations: {
      weeklyNutritionBalance: String,
      shoppingTips: [String],
      preparationSchedule: String
    }
  });
  
  export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);