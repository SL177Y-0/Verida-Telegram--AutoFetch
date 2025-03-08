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

    console.log('Received score request for DID:', did);
    
    // Get Telegram data from Verida vault
    const telegramData = await veridaService.getTelegramData(did, authToken);
    
    // Calculate FOMOscore
    const fomoScore = calculateFOMOscore(telegramData);
    console.log('Calculated FOMO score:', fomoScore);
    
    return res.json({ 
      score: fomoScore,
      data: {
        groups: telegramData.groups,
        messages: telegramData.messages
      }
    });
  } catch (error) {
    console.error('Error calculating FOMOscore:', error);
    return res.status(500).json({ 
      error: 'Failed to calculate FOMOscore', 
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to calculate FOMOscore
function calculateFOMOscore(data) {
  const { groups, messages } = data;
  // Simple formula: groups * 1 + messages * 0.1
  return Math.round((groups * 1 + messages * 0.1) * 10) / 10;
}

module.exports = router;