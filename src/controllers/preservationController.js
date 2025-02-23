const { getPreservationTips } = require("../services/openaiService");

const fetchPreservationTips = async (req, res) => {
    const { foodItems } = req.body;

    if (!foodItems || foodItems.length === 0) {
        return res.status(400).json({ error: "Please provide food items." });
    }

    try {
        const tips = await getPreservationTips(foodItems);
        res.json({ tips });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { fetchPreservationTips };
