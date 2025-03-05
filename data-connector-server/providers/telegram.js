const axios = require('axios');

module.exports = {
  name: 'telegram',
  async fetchData(apiKey, chatId) {
    const response = await axios.get(`https://api.telegram.org/bot${apiKey}/getUpdates`, {
      params: { chat_id: chatId, limit: 100 },
    });
    const updates = response.data.result;
    const messages = updates.filter(update => update.message).length;
    const groups = updates.filter(update => update.message?.chat?.type === 'group').map(update => ({
      chatId: update.message.chat.id,
      name: update.message.chat.title || 'Unnamed Group',
      participantsCount: update.message.chat.participants_count || 0,
      activity: { messages: messages },
    }));
    return { messages, groups };
  },
};