require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { VaultAccount } = require('@verida/client-ts');
const telegramProvider = require('./providers/telegram');

const app = express();
app.use(express.json());

const networkConfig = {
  network: process.env.VERIDA_NETWORK || 'testnet',
  appName: process.env.VERIDA_APP_NAME || 'FomoScoreApp',
};

// Verida Data Connector endpoint for Telegram synchronization
app.post('/sync/telegram', async (req, res) => {
  const { chatId, apiKey, did } = req.body;
  if (!chatId || !apiKey || !did) {
    return res.status(400).json({ error: 'Chat ID, API key, and Verida DID are required' });
  }

  try {
    // Fetch and map Telegram data using the provider
    const telegramData = await telegramProvider.fetchData(apiKey, chatId);
    const mappedData = {
      groups: telegramData.groups.map(group => ({
        "@context": "https://common.schemas.verida.io/social/chat/group/v0.1.0",
        id: group.chatId,
        name: group.name,
        participantsCount: group.participantsCount,
        activity: group.activity,
      })),
      messages: telegramData.messages,
    };

    // Store in Verida vault
    const vault = new VaultAccount(networkConfig);
    await vault.connect({ did });
    await vault.saveData('telegramActivity', mappedData);

    res.json({ message: 'Telegram data synchronized successfully', data: mappedData });
  } catch (error) {
    console.error('Error synchronizing Telegram data:', error);
    res.status(500).json({ error: 'Failed to synchronize Telegram data' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Verida Data Connector running on port ${process.env.PORT}`);
});