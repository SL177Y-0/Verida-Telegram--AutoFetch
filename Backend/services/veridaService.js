const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Verida service for querying vault data
const veridaService = {
  // Get Telegram data (groups and messages) from Verida vault
  getTelegramData: async (did, authToken) => {
    try {
      console.log('Querying Verida with:', { did, authToken: authToken.substring(0, 10) + '...' });
      
      // Base URL for Verida API and encoded schema URLs
      const baseApiUrl = 'https://api.verida.ai/api/rest/v1/ds/query';
      const groupSchemaEncoded = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvZ3JvdXAvdjAuMS4wL3NjaGVtYS5qc29u'; // Encoded URL for social/chat/group
      const messageSchemaEncoded = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvbWVzc2FnZS92MC4xLjAvc2NoZW1hLmpzb24='; // Encoded URL for social/chat/message
      
      // Prepare authentication header - ensure it's properly formatted
      const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      // Query for Telegram chat groups
      const groupsResponse = await axios({
        method: 'POST',
        url: `${baseApiUrl}/${groupSchemaEncoded}`,
        data: {
          options: {
            sort: [{ _id: "desc" }],
            limit: 100
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });
      
      // Query for Telegram chat messages
      const messagesResponse = await axios({
        method: 'POST',
        url: `${baseApiUrl}/${messageSchemaEncoded}`,
        data: {
          options: {
            sort: [{ _id: "desc" }],
            limit: 100
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });
      
      // Log response samples for debugging
      console.log('Groups response sample:', 
        groupsResponse.data?.results ? 
          `Found ${groupsResponse.data.results.length} groups` :
          'No groups found'
      );
      
      console.log('Messages response sample:', 
        messagesResponse.data?.results ? 
          `Found ${messagesResponse.data.results.length} messages` :
          'No messages found'
      );
      
      // Extract data from responses
      const groups = groupsResponse.data?.results?.length || 0;
      const messages = messagesResponse.data?.results?.length || 0;
      
      return {
        groups,
        messages
      };
    } catch (error) {
      console.error('Error querying Verida vault:', error.response?.data || error.message || error);
      throw new Error('Failed to query Verida vault: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  }
};

module.exports = veridaService;