const { VaultAccount } = require('@verida/client-ts');
const axios = require('axios');

class VeridaTelegramService {
  constructor() {
    this.networkConfig = {
      network: process.env.VERIDA_NETWORK || 'testnet',
      appName: process.env.VERIDA_APP_NAME || 'FomoScoreApp',
    };
  }

  async connectTelegram(did, chatId) {
    const vault = new VaultAccount(this.networkConfig);
    await vault.connect({ did });

    // Use custom data-connector to fetch and sync Telegram data
    const response = await axios.post('http://localhost:8080/sync/telegram', {
      chatId,
      apiKey: process.env.TELEGRAM_BOT_TOKEN,
    }, {
      headers: { 'x-verida-did': did }, // Pass DID for vault access
    });
    const { messages, groups } = response.data;

    await vault.saveData('telegramActivity', { messages, groups });
    return { messages, groups };
  }

  async getTelegramMetrics(did) {
    const vault = new VaultAccount(this.networkConfig);
    await vault.connect({ did });
    const data = await vault.getData('telegramActivity');
    const messageCount = data?.messages || 0;
    const groupCount = data?.groups || 0;
    return Math.min((messageCount * 0.6 + groupCount * 0.4) / 100, 1);
  }
}

module.exports = new VeridaTelegramService();