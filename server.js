const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Groq client with your API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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', // Replace with your actual API key
});

function sortIngredientsByShelfLife(ingredients) {
  const shelfLifeEstimates = {
    'lettuce': 7,
    'tomatoes': 7,
    'fruits': 7,
    'chicken': 4,
    'ground beef': 3,
    'milk': 7,
    'pasta': 365,
    'oats': 365,
    'tomato sauce': 14
  };

  return ingredients.sort((a, b) => 
    (shelfLifeEstimates[a] || 999) - (shelfLifeEstimates[b] || 999)
  );
}

app.post('/api/generate-mealplan', async (req, res) => {
  const { recipes } = req.body;

  if (!recipes || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Invalid input: recipes array required' });
  }

  try {
    const allIngredients = [...new Set(
      recipes.flatMap(recipe => recipe.ingredients)
    )];
    
    const sortedIngredients = sortIngredientsByShelfLife(allIngredients);

    const systemPrompt = `You are a meal planning expert. Generate a 7-day meal plan that optimizes ingredient usage and ensures balanced nutrition.
    
You MUST return your response in the following JSON format ONLY, with no additional text:

{
  "weekPlan": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "recipe": {
            "id": "recipe_id",
            "name": "Recipe Name",
            "ingredients": ["ingredient1", "ingredient2"]
          }
        },
        {
          "type": "lunch",
          "recipe": {
            "id": "recipe_id",
            "name": "Recipe Name",
            "ingredients": ["ingredient1", "ingredient2"]
          }
        },
        {
          "type": "dinner",
          "recipe": {
            "id": "recipe_id",
            "name": "Recipe Name",
            "ingredients": ["ingredient1", "ingredient2"]
          }
        }
      ]
    }
  ]
}

Rules:
1. Use ONLY the provided recipes
2. Each meal must reference an existing recipe ID
3. Prioritize ingredients with shorter shelf life early in the week
4. Ensure variety in meal types
5. Return valid JSON only - no explanations or additional text`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Available recipes: ${JSON.stringify(recipes, null, 2)}
Ingredients in order of priority (shortest shelf life first): ${JSON.stringify(sortedIngredients, null, 2)}`
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    let mealPlanData;
    try {
      const aiResponse = chatCompletion.choices[0].message.content.trim();
      mealPlanData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('AI Response parsing error:', parseError);
      console.log('Raw AI response:', chatCompletion.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!mealPlanData.weekPlan || !Array.isArray(mealPlanData.weekPlan)) {
      throw new Error('Invalid meal plan structure received from AI');
    }

    // Structure the final meal plan
    const mealPlan = {
      startDate: new Date().toISOString(),
      weekPlan: mealPlanData.weekPlan,
      ingredients: {
        priority: sortedIngredients,
        shoppingList: allIngredients
      },
      metadata: {
        recipeCount: recipes.length,
        generatedAt: new Date().toISOString()
      }
    };

    res.json(mealPlan);
  } catch (error) {
    console.error('Meal plan generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      details: error.message 
    });
  }
});

app.post('/api/preservation', async (req, res) => {
  const { foodItems } = req.body;

  if (!foodItems || !Array.isArray(foodItems)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const preservationTips = {};

    for (const food of foodItems) {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful food preservation expert who provides food preservation tips. Give your response about Storage method (where and how to store), shelf life (how long it can be stored), and 2-3 specific preservation tips in the following format only:\nStorage: <storage_method>\nShelf Life: <shelf_life>\nTips:\n- <tip 1>\n- <tip 2>\n- <tip 3>',
          },
          {
            role: 'user',
            content: `Provide food preservation tips for ${food}.`,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false, // Disable streaming for simplicity
        stop: null,
      });

      const tips = chatCompletion.choices[0].message.content;

      // Initialize default values
      let storage = 'Not available';
      let shelf_life = 'Not available';
      let tipsList = [];

      // Parse the output
      const storageMatch = tips.match(/Storage:\s*(.+)/i);
      const shelfLifeMatch = tips.match(/Shelf Life:\s*(.+)/i);
      const tipsMatch = tips.match(/Tips:\s*([\s\S]*)/i);

      if (storageMatch) {
        storage = storageMatch[1].trim();
      }

      if (shelfLifeMatch) {
        shelf_life = shelfLifeMatch[1].trim();
      }

      if (tipsMatch) {
        tipsList = tipsMatch[1]
          .split('\n')
          .map((tip) => tip.replace(/^-/, '').trim()) // Remove bullet points and trim
          .filter((tip) => tip.trim() !== ''); // Filter out empty lines
      }

      preservationTips[food] = {
        storage,
        shelf_life,
        tips: tipsList,
      };
    }

    res.json(preservationTips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch preservation tips' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});