const axios = require('axios');

async function fetchTelegramData(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const baseUrl = 'https://api.verida.ai/api/rest/v1/ds/query'; 
  const groupSchema = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
  const messageSchema = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';

  const [groupRes, messageRes] = await Promise.all([
    axios.post(`${baseUrl}/${Buffer.from(groupSchema).toString('base64')}`, {
      options: { sort: [{ _id: 'desc' }], limit: 100 },
    }, { headers }),
    axios.post(`${baseUrl}/${Buffer.from(messageSchema).toString('base64')}`, {
      options: { sort: [{ _id: 'desc' }], limit: 100 },
    }, { headers }),
  ]);

  return {
    groups: groupRes.data.items || [],
    messages: messageRes.data.items || [],
  };
}

module.exports = { fetchTelegramData };