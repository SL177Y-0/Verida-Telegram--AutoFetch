const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Verida service for querying vault data
const veridaService = {
  // Get Telegram data (groups and messages) from Verida vault
  getTelegramData: async (did, authToken) => {
    try {
      // Schema URLs for Telegram data
      const groupSchemaUrl = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
      const messageSchemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
      
      // Base URL for Verida API
      const baseUrl = `https://api.${process.env.VERIDA_NETWORK}.verida.io/ds/query`;
      
      // Query for Telegram chat groups
      const groupsResponse = await axios.post(
        baseUrl,
        {
          did,
          schema: groupSchemaUrl,
          query: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Query for Telegram chat messages
      const messagesResponse = await axios.post(
        baseUrl,
        {
          did,
          schema: messageSchemaUrl,
          query: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract data from responses
      const groups = groupsResponse.data?.data?.length || 0;
      const messages = messagesResponse.data?.data?.length || 0;
      
      return {
        groups,
        messages
      };
    } catch (error) {
      console.error('Error querying Verida vault:', error);
      throw new Error('Failed to query Verida vault');
    }
  }
};

module.exports = veridaService;