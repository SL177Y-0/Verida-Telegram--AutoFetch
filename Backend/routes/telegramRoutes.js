const express = require('express');
const router = express.Router();
const VeridaTelegramService = require('../services/veridaTelegramService');

router.post('/connect', async (req, res) => {
  const { did, chatId } = req.body;
  if (!did || !chatId) {
    return res.status(400).json({ error: 'Provide Verida DID and Telegram Chat ID' });
  }
  try {
    const data = await VeridaTelegramService.connectTelegram(did, chatId);
    res.json({ message: 'Telegram connected successfully', data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect Telegram' });
  }
});

module.exports = router;