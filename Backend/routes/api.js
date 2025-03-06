const express = require('express');
const router = express.Router();
const { fetchTelegramData } = require('../services/veridaService');

router.post('/score', async (req, res) => {
  const { token } = req.body;
  try {
    const data = await fetchTelegramData(token);
    const score = (data.groups.length * 1) + (data.messages.length * 0.1);
    res.json({ score, groups: data.groups.length, messages: data.messages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate FOMOscore' });
  }
});

module.exports = router;