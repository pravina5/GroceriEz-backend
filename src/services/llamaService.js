import Groq from 'groq-sdk';

export class LlamaService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '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', // Replace with your actual API key
    });
  }

  async getPreservationTips(ingredient) {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful food preservation expert who provides food preservation tips. Give your response about Storage method (where and how to store), shelf life (how long it can be stored), and 2-3 specific preservation tips in the following format only:\nStorage: <storage_method>\nShelf Life: <shelf_life>\nTips:\n- <tip 1>\n- <tip 2>\n- <tip 3>'
          },
          {
            role: 'user',
            content: `Provide food preservation tips for ${ingredient.name}.`
          }
        ],
        model: 'llama3-70b-8192',
        temperature: 1,
        max_completion_tokens: 1024
      });

      return this.parsePreservationResponse(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error('Llama API error:', error);
      throw error;
    }
  }

  async getRecipeSuggestions(recipe) {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a culinary expert. Provide cooking tips, nutrition information, and ingredient alternatives in the following format:\nCooking Tips:\n- <tip 1>\n- <tip 2>\nNutrition Info: <nutrition_summary>\nAlternatives:\n- <alternative 1>\n- <alternative 2>'
          },
          {
            role: 'user',
            content: `Provide cooking suggestions for ${recipe.name} with ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}`
          }
        ],
        model: 'llama3-70b-8192',
        temperature: 1,
        max_completion_tokens: 1024
      });

      return this.parseRecipeSuggestions(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error('Llama API error:', error);
      throw error;
    }
  }

  parsePreservationResponse(response) {
    const storageMatch = response.match(/Storage:\s*(.+)/i);
    const shelfLifeMatch = response.match(/Shelf Life:\s*(.+)/i);
    const tipsMatch = response.match(/Tips:\s*([\s\S]*)/i);

    return {
      storage: storageMatch ? storageMatch[1].trim() : 'Not available',
      shelfLife: shelfLifeMatch ? shelfLifeMatch[1].trim() : 'Not available',
      tips: tipsMatch ? tipsMatch[1]
        .split('\n')
        .map(tip => tip.replace(/^-/, '').trim())
        .filter(tip => tip !== '') : []
    };
  }

  parseRecipeSuggestions(response) {
    const tipsMatch = response.match(/Cooking Tips:\s*([\s\S]*?)(?=\nNutrition Info:)/i);
    const nutritionMatch = response.match(/Nutrition Info:\s*(.+)/i);
    const alternativesMatch = response.match(/Alternatives:\s*([\s\S]*)/i);

    return {
      cookingTips: tipsMatch ? tipsMatch[1]
        .split('\n')
        .map(tip => tip.replace(/^-/, '').trim())
        .filter(tip => tip !== '') : [],
      nutritionInfo: nutritionMatch ? nutritionMatch[1].trim() : 'Not available',
      alternatives: alternativesMatch ? alternativesMatch[1]
        .split('\n')
        .map(alt => alt.replace(/^-/, '').trim())
        .filter(alt => alt !== '') : []
    };
  }
}