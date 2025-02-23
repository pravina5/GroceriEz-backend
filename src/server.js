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