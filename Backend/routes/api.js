const express = require('express');
const router = express.Router();
const veridaService = require('../services/veridaService');

// Calculate FOMOscore based on Telegram data
router.post('/score', async (req, res) => {
  try {
    const { did, authToken } = req.body;
    
    if (!did || !authToken) {
      return res.status(400).json({ error: 'DID and auth token are required' });
    }

    // Get Telegram data from Verida vault
    const telegramData = await veridaService.getTelegramData(did, authToken);
    
    // Calculate FOMOscore
    const fomoScore = calculateFOMOscore(telegramData);
    
    return res.json({ 
      score: fomoScore,
      data: telegramData
    });
  } catch (error) {
    console.error('Error calculating FOMOscore:', error);
    return res.status(500).json({ error: 'Failed to calculate FOMOscore' });
  }
});

// Helper function to calculate FOMOscore
function calculateFOMOscore(data) {
  const { groups, messages } = data;
  // Simple formula: groups * 1 + messages * 0.1
  return Math.round((groups * 1 + messages * 0.1) * 10) / 10;
}

module.exports = router;