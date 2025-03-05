const VeridaTelegramService = require('../services/veridaTelegramService');

async function calculateScore(req, res) {
  try {
    const { did } = req.params;

    const telegramMetrics = await VeridaTelegramService.getTelegramMetrics(did);

    // Calculate FOMO score (up to 10 points for Telegram-only app)
    const score = telegramMetrics * 10;
    const title = score >= 8 ? 'FOMO STAR' : 'FOMO NOVICE';

    res.json({ score, title });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { calculateScore };